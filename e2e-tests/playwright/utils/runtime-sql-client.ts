import { Socket } from "node:net";

import { Client, type ClientConfig } from "pg";

/** Own the TCP transport so a peer that never finishes shutdown cannot hang teardown. */
export class RuntimeSqlClient extends Client {
  private readonly transport: Socket;

  constructor(
    config: ClientConfig,
    private readonly closeTimeoutMs = 15_000,
  ) {
    const transport = new Socket();
    super({ ...config, stream: () => transport });
    this.transport = transport;
  }

  override async end(): Promise<void> {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      // Close only our client socket, not any PostgreSQL backend process.
      this.transport.destroy();
    }, this.closeTimeoutMs);
    try {
      await super.end();
      if (timedOut)
        throw new Error(`Runtime SQL connection shutdown exceeded ${this.closeTimeoutMs}ms`);
    } finally {
      clearTimeout(timer);
    }
  }
}
