export interface PolicyComplete {
  entityReference: string;
  permission: string;
  policy: string;
  effect: string;
}

export interface Policy {
  permission: string;
  policy: string;
  effect: string;
}

export interface Role {
  memberReferences: string[];
  name: string;
}
