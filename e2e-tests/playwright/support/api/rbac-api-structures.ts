export interface Role {
  memberReferences: string[];
  name: string;
  metadata?: { description: string };
}

export interface Permission {
  entityReference: string;
  permission: string;
  policy: string;
  effect: string;
}

export interface Condition {
  result: "CONDITIONAL";
  roleEntityRef: string;
  pluginId: string;
  resourceType: string;
  permissionMapping: "read" | "update" | "delete"[];
  conditions: {
    rule: string;
    resourceType: string;
    params: { claims: string[] };
  };
}
