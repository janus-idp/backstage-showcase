class Actor {
  actorId?: string;
  hostname: string;
}

class LogRequest {
  body?: object;
  method: string;
  params?: object;
  query?: {
    facet?: string[];
    limit?: number;
    offset?: number;
  };
  url: string;
}

class LogResponse {
  status: number;
}

export class Log {
  actor: Actor;
  eventName: string;
  isAuditLog: boolean;
  level: string;
  message: string;
  meta: object;
  plugin: string;
  request: LogRequest;
  response: LogResponse;
  service: string;
  stage: string;
  status: string;
  timestamp: string;

  /**
   * Constructor for the Log class.
   * It sets default values for status and actorId, and allows other properties to be set or overridden.
   *
   * @param overrides Partial object to override default values in the Log class
   */
  constructor(overrides: Partial<Log> = {}) {
    // Default value for status
    this.status = overrides.status || "succeeded";
    this.isAuditLog = overrides.isAuditLog || true;

    // Default value for actorId, with other actor properties being optional
    this.actor = {
      actorId: overrides.actor?.actorId || "user:development/guest", // Default actorId
      hostname: overrides.actor?.hostname || "",
    };

    // Other properties without default values
    this.eventName = overrides.eventName || "";
    this.plugin = overrides.plugin || "";
    this.message = overrides.message || "";
    this.request = {
      method: overrides.request?.method || "",
      url: overrides.request?.url || "",
    };
    this.response = {
      status: overrides.response?.status || 0,
    };
  }
}
