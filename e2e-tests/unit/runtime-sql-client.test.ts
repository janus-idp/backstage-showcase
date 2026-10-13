import { createServer, type Socket } from "node:net";

import { expect, it } from "vitest";

import { RuntimeSqlClient } from "../playwright/utils/runtime-sql-client";

it("bounds shutdown when a real PostgreSQL-protocol peer never closes its socket", async () => {
  const peers = new Set<Socket>();
  const server = createServer({ allowHalfOpen: true }, (peer) => {
    peers.add(peer);
    peer.once("data", () => {
      // AuthenticationOk + ReadyForQuery: enough of the wire protocol for pg.connect().
      peer.write(Buffer.from([82, 0, 0, 0, 8, 0, 0, 0, 0, 90, 0, 0, 0, 5, 73]));
    });
    peer.on("error", () => {});
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("TCP peer did not start");
  const client = new RuntimeSqlClient(
    { host: "127.0.0.1", port: address.port, user: "test", database: "test", ssl: false },
    50,
  );
  client.on("error", () => {});
  try {
    await client.connect();
    await expect(client.end()).rejects.toThrow("connection shutdown exceeded 50ms");
    await expect(client.end()).resolves.toBeUndefined();
  } finally {
    for (const peer of peers) peer.destroy();
    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  }
});
