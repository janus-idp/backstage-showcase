/* oxlint-disable import/max-dependencies -- fixture coordinates PostgreSQL, Kubernetes, and Playwright */
import type { Client } from "pg";

import { base64Encode, discoverRouterBase, resolveInstallMethod } from "../../utils/helper";
import { KubeClient } from "../../utils/kube-client";
import { generateUntrustedCaCertificate } from "../../utils/runtime-ca";
import { createRuntimeCatalogProbe } from "../../utils/runtime-catalog";
import { resolveConfig, RUNTIME_DB_SECRET } from "../../utils/runtime-config";
import {
  connectExternalDatabase,
  clearSlotDatabases,
  closeDatabaseClients,
  dropOwnedDatabases,
  firstConfiguredExternalDatabaseSlot,
  readExternalDatabaseInputs,
  runtimeDatabasePrefix,
  RUNTIME_DATABASE_CLEANUP_TIMEOUT_MS,
  type ExternalDatabaseProvider,
} from "../../utils/runtime-database";
import { deployRuntime, type RuntimeDeploymentHandle } from "../../utils/runtime-deploy";
import {
  resetRuntimeNamespace,
  deleteOwnedRuntimeNamespace,
  deleteRuntimeApplication,
  collectRuntimeDiagnostics,
  runtimeRevision,
} from "../../utils/runtime-lifecycle";
import { createRuntimeProgress } from "../../utils/runtime-progress";
import { restartRuntime } from "../../utils/runtime-restart";
import { teardownRuntime } from "../../utils/runtime-teardown";
import { verifyRuntimeRejectsUntrustedCa } from "../../utils/runtime-tls";
import { test as base } from "../coverage/test";
import { withRuntimeRequest } from "./runtime-request";

interface ExternalRuntime extends RuntimeDeploymentHandle {
  databasePrefix: string;
  entityName: string;
  apiToken: string;
  connect(database?: string): Promise<Client>;
  restart(whileStopped?: () => Promise<void>): Promise<void>;
  /** Present only on the provider's first configured slot, which owns the check. */
  verifyUntrustedCa?: () => Promise<void>;
}
type Target = { provider: ExternalDatabaseProvider; slot: number };

/** One complete lifecycle per target; teardown errors belong to the test that used it. */
export const test = base.extend<{
  externalTarget: Target;
  externalRuntime: ExternalRuntime;
}>({
  externalTarget: [{ provider: "rds", slot: 1 }, { option: true }],
  request: async (
    { playwright, externalRuntime, ignoreHTTPSErrors, extraHTTPHeaders, proxy },
    use,
  ) => {
    await withRuntimeRequest(
      playwright,
      externalRuntime.baseURL,
      { ignoreHTTPSErrors, extraHTTPHeaders, proxy },
      use,
    );
  },
  externalRuntime: [
    async ({ externalTarget: { provider, slot } }, use, info) => {
      const inputs = readExternalDatabaseInputs(provider, slot);
      info.skip(inputs === null, `${provider} slot ${slot} is not configured`);
      if (!inputs) return;
      const runId = process.env.RUNTIME_RUN_ID ?? "";
      const prefix = runtimeDatabasePrefix(runId, provider, slot);
      const config = resolveConfig(await discoverRouterBase());
      config.namespace = `${config.namespace.slice(0, 15).replace(/-+$/u, "")}-${provider}${slot}-${runId}`;
      config.revision = runtimeRevision();
      config.catalogProbe = true;
      config.externalPostgres = {
        host: inputs.host,
        port: inputs.port,
        user: inputs.user,
        databasePrefix: prefix,
      };
      const method = resolveInstallMethod();
      const kube = new KubeClient(30_000);
      const namespace = config.namespace;
      const progress = createRuntimeProgress(info, {
        runId,
        namespace,
        databasePrefix: prefix,
        provider,
        slot,
        installMethod: method,
      });
      // Verify local tooling before creating a namespace or touching any database.
      const checksUntrustedCa = slot === firstConfiguredExternalDatabaseSlot(provider);
      const untrustedCa = checksUntrustedCa
        ? await progress.run("preflight-ca", generateUntrustedCaCertificate)
        : undefined;
      const clients = new Set<Client>();
      let apiToken = "";
      const redact = (text: string) => {
        const safe = text.replaceAll(inputs.password, "[REDACTED]");
        return apiToken === "" ? safe : safe.replaceAll(apiToken, "[REDACTED]");
      };
      info.annotations.push(
        { type: "namespace", description: namespace },
        { type: "database", description: `${provider} slot ${slot}` },
      );
      await progress.run("reset-namespace", () => resetRuntimeNamespace(kube, namespace, runId));
      let setupError: unknown;
      try {
        await progress.run("prepare-databases", async () => {
          const admin = await connectExternalDatabase(
            inputs,
            "postgres",
            RUNTIME_DATABASE_CLEANUP_TIMEOUT_MS,
          );
          try {
            const slotCleanup = await clearSlotDatabases(admin, prefix);
            const version = await admin.query<{ version: string; version_number: string }>(
              "SELECT current_setting('server_version') AS version, current_setting('server_version_num') AS version_number",
            );
            await info.attach("runtime-database-target", {
              body: JSON.stringify({
                provider,
                slot,
                namespace,
                databasePrefix: prefix,
                installMethod: method,
                postgres: version.rows[0],
                slotCleanup,
                chart: config.helm,
                image: config.image,
              }),
              contentType: "application/json",
            });
          } finally {
            await admin.end();
          }
        });
        await kube.createOrUpdateSecret(
          {
            metadata: { name: RUNTIME_DB_SECRET },
            data: {
              POSTGRES_HOST: base64Encode(inputs.host),
              POSTGRES_PORT: base64Encode(String(inputs.port)),
              POSTGRES_USER: base64Encode(inputs.user),
              POSTGRES_PASSWORD: base64Encode(inputs.password),
            },
          },
          namespace,
        );
        await kube.createOrUpdateSecret(
          {
            metadata: { name: "postgres-crt" },
            data: { "postgres-crt.pem": base64Encode(inputs.certificate) },
          },
          namespace,
        );
        const probe = await createRuntimeCatalogProbe(
          kube,
          namespace,
          `${provider}-${runId}-${slot}`,
        );
        apiToken = probe.apiToken;
        const handle = await progress.run("deploy", () => deployRuntime(config, method, kube));
        const finishTest = progress.begin("test");
        await use({
          ...handle,
          ...probe,
          databasePrefix: prefix,
          async connect(database) {
            const client = await connectExternalDatabase(inputs, database);
            clients.add(client);
            client.once("end", () => {
              clients.delete(client);
            });
            return client;
          },
          restart: (whileStopped) =>
            progress.run("restart", () => restartRuntime(kube, config, method, whileStopped)),
          verifyUntrustedCa: checksUntrustedCa
            ? () =>
                progress.run("reject-ca-and-recover", () =>
                  verifyRuntimeRejectsUntrustedCa(
                    kube,
                    config,
                    method,
                    inputs.certificate,
                    info,
                    redact,
                    untrustedCa,
                  ),
                )
            : undefined,
        });
        finishTest(info.status === info.expectedStatus);
      } catch (error) {
        setupError = error;
      }
      await teardownRuntime({
        label: `${provider} slot ${slot}`,
        setupError,
        redact,
        progress,
        collectDiagnostics: () => collectRuntimeDiagnostics(kube, namespace, info, redact),
        stopApplication: () =>
          deleteRuntimeApplication(kube, namespace, config.releaseName, method),
        closeSqlClients: () => closeDatabaseClients(clients),
        dropDatabases: () =>
          dropOwnedDatabases(
            () => connectExternalDatabase(inputs, "postgres", RUNTIME_DATABASE_CLEANUP_TIMEOUT_MS),
            prefix,
          ),
        reportCleanup: (completed) =>
          info.attach("runtime-database-cleanup", {
            body: JSON.stringify({ databasePrefix: prefix, completed }),
            contentType: "application/json",
          }),
        deleteNamespace: () => deleteOwnedRuntimeNamespace(kube, namespace, runId),
      });
    },
    { timeout: 1_800_000 },
  ],
});

export { expect } from "../coverage/test";
