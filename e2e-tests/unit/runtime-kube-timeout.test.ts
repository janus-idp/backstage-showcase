import { createServer } from "node:http";
import type { Socket } from "node:net";

import { afterEach, expect, it, vi } from "vitest";

import { KubeClient } from "../playwright/utils/kube-client";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("retries a read stalled on a real HTTP connection but never replays a write", async () => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  const sockets = new Set<Socket>();
  const requests = { GET: 0, POST: 0 };
  // The first read and every write stall like a black-holed API connection.
  const server = createServer((request, response) => {
    if (request.method === "GET" && ++requests.GET > 1) {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ kind: "Deployment", metadata: { name: "rhdh" } }));
    } else if (request.method === "POST") requests.POST++;
  });
  server.on("connection", (socket) => {
    sockets.add(socket);
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("HTTP peer did not start");
  vi.stubEnv("K8S_CLUSTER_URL", `http://127.0.0.1:${address.port}`);
  vi.stubEnv("K8S_CLUSTER_TOKEN", "fake");
  try {
    const kube = new KubeClient(100);
    const read = await kube.appsApi.readNamespacedDeployment("rhdh", "runtime");
    expect(read.body.metadata?.name).toBe("rhdh");
    // Responsive reads can also time out under load, but retries remain bounded.
    expect(requests.GET).toBeGreaterThanOrEqual(2);
    expect(requests.GET).toBeLessThanOrEqual(3);
    await expect(
      kube.coreV1Api.createNamespace({ metadata: { name: "runtime" } }),
    ).rejects.toMatchObject({ code: "ESOCKETTIMEDOUT" });
    expect(requests.POST).toBe(1);
  } finally {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  }
});
