import { expect } from "@playwright/test";
import { Response } from "../../../support/pages/rbac";
import { testWithHelper } from "../../../utils/UIhelper";
import { RbacConstants } from "../../../data/rbac-constants";
import { RhdhAuthHack } from "../../../support/api/rhdh-auth-hack";
import { Common } from "../../../utils/Common";
import { RBAC_IDAuthFile } from "../../../support/auth/auth_constants";

testWithHelper.use({
  actionTimeout: 0,
  navigationTimeout: 0,
  storageState: RBAC_IDAuthFile,
});
testWithHelper.describe("Test RBAC plugin REST API", () => {
  let responseHelper: Response;
  testWithHelper.beforeEach(async ({ page }) => {
    await new Common(page).logintoGithub();
    const apiToken = await RhdhAuthHack.getInstance().getApiToken(page);
    responseHelper = new Response(apiToken);
  });

  testWithHelper(
    "Test that roles and policies from GET request are what expected",
    async ({ request }) => {
      const rolesResponse = await request.get(
        "/api/permission/roles",
        responseHelper.getSimpleRequest(),
      );
      const policiesResponse = await request.get(
        "/api/permission/policies",
        responseHelper.getSimpleRequest(),
      );

      await responseHelper.checkResponse(
        rolesResponse,
        RbacConstants.getExpectedRoles(),
      );
      await responseHelper.checkResponse(
        policiesResponse,
        RbacConstants.getExpectedPolicies(),
      );
    },
  );

  testWithHelper(
    "Create new role for rhdh-qe, change its name, and deny it from reading catalog entities",
    async ({ request }) => {
      const members = ["user:default/rhdh-qe"];

      const newPolicy = {
        entityReference: "role:default/test",
        permission: "catalog-entity",
        policy: "read",
        effect: "deny",
      };

      const firstRole = {
        memberReferences: members,
        name: "role:default/admin",
      };

      const newRole = {
        memberReferences: members,
        name: "role:default/test",
      };

      const rolePostResponse = await request.post(
        "/api/permission/roles",
        responseHelper.createRoleRequest(firstRole),
      );

      const rolePutResponse = await request.put(
        "/api/permission/roles/role/default/admin",
        responseHelper.editRoleRequest(firstRole, newRole),
      );

      const policyPostResponse = await request.post(
        "/api/permission/policies",
        responseHelper.createOrDeletePolicyRequest([newPolicy]),
      );

      expect(rolePostResponse.ok());
      expect(rolePutResponse.ok());
      expect(policyPostResponse.ok());
    },
  );

  testWithHelper("Test catalog-entity read is denied", async ({ uiHelper }) => {
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "Component");
    await uiHelper.verifyTableIsEmpty();
    await uiHelper.openSidebar("Create...");
    await uiHelper.verifyText(
      "No templates found that match your filter. Learn more about",
      false,
    );
  });

  testWithHelper(
    "Test catalog-entity creation is denied",
    async ({ uiHelper }) => {
      expect(
        await uiHelper.isLinkVisible("Register Existing Component"),
      ).toBeFalsy();
    },
  );

  testWithHelper(
    "PUT catalog-entity read and POST create policies",
    async ({ request }) => {
      const oldReadPolicy = [
        { permission: "catalog-entity", policy: "read", effect: "deny" },
      ];
      const newReadPolicy = [
        { permission: "catalog-entity", policy: "read", effect: "allow" },
      ];

      const createPolicy = [
        {
          entityReference: "role:default/test",
          permission: "catalog.entity.create",
          policy: "create",
          effect: "allow",
        },
      ];

      const readPutResponse = await request.put(
        "/api/permission/policies/role/default/test",
        responseHelper.editPolicyRequest(oldReadPolicy, newReadPolicy),
      );

      const createPostResponse = await request.post(
        "/api/permission/policies",
        responseHelper.createOrDeletePolicyRequest(createPolicy),
      );

      expect(readPutResponse.ok());
      expect(createPostResponse.ok());
    },
  );

  testWithHelper(
    "Test catalog-entity read is allowed",
    async ({ uiHelper }) => {
      await uiHelper.openSidebar("Catalog");
      await uiHelper.selectMuiBox("Kind", "API");
      await uiHelper.clickLink("Nexus Repo Manager 3");
    },
  );

  testWithHelper(
    "Test catalog-entity refresh is denied",
    async ({ uiHelper }) => {
      expect(
        await uiHelper.isBtnVisibleByTitle("Schedule entity refresh"),
      ).toBeFalsy();
    },
  );

  testWithHelper(
    "Test catalog-entity create is allowed",
    async ({ uiHelper }) => {
      await uiHelper.openSidebar("Create...");
      expect(await uiHelper.isLinkVisible("Register Existing Component"));
    },
  );

  testWithHelper(
    "Test bad PUT and PUT catalog-entity update policy",
    async ({ request }) => {
      const oldBadPolicy = [
        { permission: "catalog-entity", policy: "refresh", effect: "allow" },
      ];
      const newBadPolicy = [
        { permission: "catalog-entity", policy: "read", effect: "allow" },
      ];

      const oldGoodPolicy = [
        {
          permission: "catalog.entity.create",
          policy: "create",
          effect: "allow",
        },
      ];
      const newGoodPolicy = [
        {
          permission: "catalog.entity.refresh",
          policy: "update",
          effect: "allow",
        },
      ];

      const badPutResponse = await request.put(
        "/api/permission/policies/role/default/test",
        responseHelper.editPolicyRequest(oldBadPolicy, newBadPolicy),
      );

      const goodPutResponse = await request.put(
        "/api/permission/policies/role/default/test",
        responseHelper.editPolicyRequest(oldGoodPolicy, newGoodPolicy),
      );

      expect(badPutResponse.ok()).toBeFalsy();
      expect(goodPutResponse.ok());
    },
  );

  testWithHelper(
    "Test that the bad PUT didnt go through and catalog-entities can be read",
    async ({ uiHelper }) => {
      await uiHelper.openSidebar("Home");
      await uiHelper.openSidebar("Create...");
      expect(
        await uiHelper.isTextVisible(
          "No templates found that match your filter. Learn more about",
        ),
      ).toBeFalsy();
    },
  );

  testWithHelper(
    "Test that the good PUT request went through and catalog-entities can be refreshed",
    async ({ uiHelper }) => {
      await uiHelper.openSidebar("Catalog");
      await uiHelper.selectMuiBox("Kind", "API");
      await uiHelper.clickLink("Nexus Repo Manager 3");
      expect(await uiHelper.isBtnVisibleByTitle("Schedule entity refresh"));
    },
  );

  testWithHelper(
    "Test that the good PUT request went through and catalog-entities cant be created",
    async ({ uiHelper }) => {
      await uiHelper.openSidebar("Create...");
      expect(
        await uiHelper.isLinkVisible("Register Existing Component"),
      ).toBeFalsy();
    },
  );

  testWithHelper("DELETE catalog-entity update policy", async ({ request }) => {
    const deletePolicies = [
      {
        entityReference: "role:default/test",
        permission: "catalog.entity.refresh",
        policy: "update",
        effect: "allow",
      },
    ];
    const deleteResponse = await request.delete(
      "/api/permission/policies/role/default/test",
      responseHelper.createOrDeletePolicyRequest(deletePolicies),
    );

    expect(deleteResponse.ok());
  });

  testWithHelper.skip(
    "Test catalog-entity refresh is denied after DELETE",
    async ({ uiHelper }) => {
      await uiHelper.openSidebar("Catalog");
      await uiHelper.selectMuiBox("Kind", "API");
      await uiHelper.clickLink("Nexus Repo Manager 3");
      expect(
        await uiHelper.isBtnVisible("Schedule entity refresh"),
      ).toBeFalsy();
    },
  );

  testWithHelper.afterAll(
    "Cleanup by deleting all new policies and roles",
    async ({ request }) => {
      const remainingPoliciesResponse = await request.get(
        "/api/permission/policies/role/default/test",
        responseHelper.getSimpleRequest(),
      );

      const remainingPolicies = await responseHelper.removeMetadataFromResponse(
        remainingPoliciesResponse,
      );

      const deleteRemainingPolicies = await request.delete(
        "/api/permission/policies/role/default/test",
        responseHelper.createOrDeletePolicyRequest(remainingPolicies),
      );

      const deleteRole = await request.delete(
        "/api/permission/roles/role/default/test",
        responseHelper.getSimpleRequest(),
      );

      expect(deleteRemainingPolicies.ok());
      expect(deleteRole.ok());
    },
  );
});
