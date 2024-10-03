export class RbacConstants {
  static getExpectedRoles() {
    return `
      [
        {
          "memberReferences": ["user:default/rhdh-qe"],
          "name": "role:default/rbac_admin"
        },
        {
          "memberReferences": ["user:xyz/user"],
          "name": "role:xyz/team_a"
        },
        {
          "memberReferences": ["group:janus-qe/rhdh-qe-2-team"],
          "name": "role:default/test2-role"
        },
        {
          "memberReferences": ["group:janus-qe/rhdh-qe-2-team"],
          "name": "role:default/bulk_import"
        }
      ]
    `;
  }

  static getExpectedPolicies() {
    return `
      [
        {
          "entityReference": "role:default/rbac_admin",
          "permission": "policy-entity",
          "policy": "read",
          "effect": "allow"
        },
        {
          "entityReference": "role:default/rbac_admin",
          "permission": "policy-entity",
          "policy": "create",
          "effect": "allow"
        },
        {
          "entityReference": "role:default/rbac_admin",
          "permission": "policy-entity",
          "policy": "delete",
          "effect": "allow"
        },
        {
          "entityReference": "role:default/rbac_admin",
          "permission": "policy-entity",
          "policy": "update",
          "effect": "allow"
        },
        {
          "entityReference": "role:default/rbac_admin",
          "permission": "catalog-entity",
          "policy": "read",
          "effect": "allow"
        },
        {
          "entityReference": "role:default/guests",
          "permission": "catalog.entity.create",
          "policy": "create",
          "effect": "allow"
        },
        {
          "entityReference": "role:default/team_a",
          "permission": "catalog-entity",
          "policy": "read",
          "effect": "allow"
        },
        {
          "entityReference": "role:xyz/team_a",
          "permission": "catalog-entity",
          "policy": "read",
          "effect": "allow"
        },
        {
          "entityReference": "role:xyz/team_a",
          "permission": "catalog.entity.create",
          "policy": "create",
          "effect": "allow"
        },
        {
          "entityReference": "role:xyz/team_a",
          "permission": "catalog.location.create",
          "policy": "create",
          "effect": "allow"
        },
        {
          "entityReference": "role:xyz/team_a",
          "permission": "catalog.location.read",
          "policy": "read",
          "effect": "allow"
        },
        {
          "entityReference": "role:default/bulk_import",
          "permission": "bulk.import",
          "policy": "use",
          "effect": "allow"
        },
        {
          "entityReference": "role:default/bulk_import",
          "permission": "catalog.location.create",
          "policy": "create",
          "effect": "allow"
        },
        {
          "entityReference": "role:default/bulk_import",
          "permission": "catalog.entity.create",
          "policy": "create",
          "effect": "allow"
        }
      ]
    `;
  }
}
