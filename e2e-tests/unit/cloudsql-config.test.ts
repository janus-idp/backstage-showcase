import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import {
  cloudSqlDatabasePrefix,
  readCloudSqlInputs,
  isCloudSqlRevisionReady,
  buildCloudSqlProxy,
} from "../playwright/utils/cloudsql-config";
import { buildImageRef } from "../playwright/utils/helper";
import { generateBackstageCR, type RuntimeDeployConfig } from "../playwright/utils/runtime-config";

mkdirSync(join(tmpdir(), "opencode"), { recursive: true, mode: 0o700 });
const directory = mkdtempSync(join(tmpdir(), "opencode", "cloudsql-unit-"));
const keyPath = join(directory, "key.json");
writeFileSync(
  keyPath,
  JSON.stringify({
    type: "service_account",
    client_email: "test@example.test",
    private_key: "fake key",
  }),
  { mode: 0o600 },
);
afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

const env = {
  CLOUDSQL_USER: "test-user",
  CLOUDSQL_PASSWORD: "test-password",
  CLOUDSQL_INSTANCE_1: "project:region:instance",
  CLOUDSQL_SERVICE_ACCOUNT_JSON_PATH: keyPath,
};
const config: RuntimeDeployConfig = {
  releaseName: "rhdh",
  namespace: "runtime-cloudsql",
  routerBase: "apps.example.test",
  image: buildImageRef("quay.io", "rhdh-community/rhdh", "next"),
  internalPostgresqlImage: buildImageRef("quay.io", "fedora/postgresql-18", "latest"),
  catalogProbe: true,
  cloudSql: {
    instanceConnectionName: "project:region:instance",
    user: "test-user",
    databasePrefix: cloudSqlDatabasePrefix("012345abcdef", 1),
    revision: "test-revision",
  },
};

describe("Cloud SQL prerequisites", () => {
  it("skips absent instances but rejects configured instances without credentials", () => {
    expect(readCloudSqlInputs({})).toBeNull();
    expect(readCloudSqlInputs(env)?.instances[0]).toBe(env.CLOUDSQL_INSTANCE_1);
    expect(() => readCloudSqlInputs({ CLOUDSQL_INSTANCE_1: env.CLOUDSQL_INSTANCE_1 })).toThrow(
      "require CLOUDSQL_USER",
    );
  });
  it("rejects malformed instance names and service accounts without leaking JSON", () => {
    expect(() => readCloudSqlInputs({ ...env, CLOUDSQL_INSTANCE_1: "invalid" })).toThrow(
      "project:region:instance",
    );
    const broken = join(directory, "broken.json");
    writeFileSync(broken, "secret-fragment", { mode: 0o600 });
    const readBrokenKey = () =>
      readCloudSqlInputs({ ...env, CLOUDSQL_SERVICE_ACCOUNT_JSON_PATH: broken });
    expect(readBrokenKey).toThrow("readable service-account JSON key");
    expect(readBrokenKey).not.toThrow("secret-fragment");
  });
  it("uses distinct bounded prefixes for runs and slots and rejects unsafe ownership", () => {
    expect(cloudSqlDatabasePrefix("012345abcdef", 1)).not.toBe(
      cloudSqlDatabasePrefix("012345abcdef", 2),
    );
    expect(cloudSqlDatabasePrefix("012345abcdef", 1)).not.toBe(
      cloudSqlDatabasePrefix("abcdef012345", 1),
    );
    expect(() => cloudSqlDatabasePrefix("anything", 1)).toThrow("ownership");
    expect(() => cloudSqlDatabasePrefix("012345abcdef", 5)).toThrow("ownership");
  });
});

describe("Operator Cloud SQL configuration", () => {
  it("rejects a ready old revision until reconciliation and rollout finish", () => {
    const cloudSql = config.cloudSql!;
    const deployment = {
      metadata: { generation: 2 },
      spec: {
        replicas: 1,
        selector: {},
        template: {
          metadata: { annotations: { "rhdh.redhat.com/cloudsql-revision": cloudSql.revision } },
          spec: {
            containers: [],
            initContainers: [buildCloudSqlProxy(cloudSql.instanceConnectionName)],
          },
        },
      },
      status: {
        observedGeneration: 1,
        readyReplicas: 1,
        availableReplicas: 1,
        updatedReplicas: 1,
        replicas: 1,
      },
    };
    expect(isCloudSqlRevisionReady(deployment, cloudSql)).toBe(false);
    deployment.status.observedGeneration = 2;
    deployment.status.updatedReplicas = 0;
    expect(isCloudSqlRevisionReady(deployment, cloudSql)).toBe(false);
    deployment.status.updatedReplicas = 1;
    deployment.status.replicas = 2;
    expect(isCloudSqlRevisionReady(deployment, cloudSql)).toBe(false);
    deployment.status.replicas = 1;
    expect(isCloudSqlRevisionReady(deployment, cloudSql)).toBe(true);
    deployment.spec.template.spec.initContainers = [buildCloudSqlProxy("another:region:instance")];
    expect(isCloudSqlRevisionReady(deployment, cloudSql)).toBe(false);
  });
  it("owns external DB credentials and orders the native proxy before the localhost wait", () => {
    const proxyArgs: unknown = expect.arrayContaining(["project:region:instance"]);
    const waitCommand: unknown = expect.stringContaining("/dev/tcp/127.0.0.1/5432");
    const waitCommands: unknown = expect.arrayContaining([waitCommand]);
    expect(generateBackstageCR(config)).toMatchObject({
      metadata: { annotations: { "rhdh.redhat.com/deployment-patch-list-merge-mode": "prepend" } },
      spec: {
        database: { enableLocalDb: false, authSecretName: "cloud-sql-database" },
        application: {
          extraEnvs: {
            secrets: [
              { name: "rhdh-runtime-config" },
              {
                name: "runtime-catalog-token",
                key: "RUNTIME_CATALOG_API_TOKEN",
                containers: ["backstage-backend"],
              },
            ],
          },
        },
        deployment: {
          patch: {
            spec: {
              template: {
                metadata: { annotations: { "rhdh.redhat.com/cloudsql-revision": "test-revision" } },
                spec: {
                  initContainers: [
                    {
                      name: "cloud-sql-proxy",
                      restartPolicy: "Always",
                      args: proxyArgs,
                    },
                    { name: "install-dynamic-plugins" },
                    {
                      name: "wait-for-db",
                      command: waitCommands,
                    },
                  ],
                },
              },
            },
          },
        },
      },
    });
  });
});
