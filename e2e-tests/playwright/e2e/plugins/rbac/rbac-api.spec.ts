import { Page, expect, test } from "@playwright/test";
import { PolicyComplete, Response } from "../../../support/pages/rbac";
import { Common, setupBrowser } from "../../../utils/common";
import { UIhelper } from "../../../utils/ui-helper";
import { RbacConstants } from "../../../data/rbac-constants";
import { RhdhAuthApiHack } from "../../../support/api/rhdh-auth-api-hack";

/*
    Note that:
    The policies generated from a policy.csv or ConfigMap file cannot be edited or deleted using the Developer Hub Web UI. 
    https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.2/html/authorization/proc-rbac-ui-manage-roles_title-authorization#proc-rbac-ui-edit-role_title-authorization
*/

test.describe.serial("Test RBAC plugin REST API", () => {
  let common: Common;
  let uiHelper: UIhelper;
  let page: Page;
  let responseHelper: Response;

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;

    uiHelper = new UIhelper(page);
    common = new Common(page);

    await common.loginAsKeycloakUser();
    const apiToken = await RhdhAuthApiHack.getToken(page);
    responseHelper = new Response(apiToken);
  });

  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(async ({}, testInfo) => {
    console.log(
      `beforeEach: Attempting setup for ${testInfo.title}, retry: ${testInfo.retry}`,
    );
  });

  test("Test that roles and policies from GET request are what expected", async ({
    request,
  }) => {
    const rolesResponse = await request.get(
      "/api/permission/roles",
      responseHelper.getSimpleRequest(),
    );
    const policiesResponse = await request.get(
      "/api/permission/policies",
      responseHelper.getSimpleRequest(),
    );

    if (!rolesResponse.ok()) {
      throw Error(
        `RBAC rolesResponse API call failed with status code ${rolesResponse.status()}`,
      );
    }

    if (!policiesResponse.ok()) {
      throw Error(
        `RBAC policiesResponse API call failed with status code ${policiesResponse.status()}`,
      );
    }

    console.log("rolesResponse");
    console.log(rolesResponse.json());

    console.log("policiesResponse");
    console.log(policiesResponse.json());

    await responseHelper.checkResponse(
      rolesResponse,
      RbacConstants.getExpectedRoles(),
    );
    await responseHelper.checkResponse(
      policiesResponse,
      RbacConstants.getExpectedPolicies(),
    );
  });

  test("Create new role for rhdh-qe, change its name, and deny it from reading catalog entities", async ({
    request,
  }) => {
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

    console.log("rolePostResponse");
    console.log(rolePostResponse);

    console.log("rolePutResponse");
    console.log(rolePutResponse);

    console.log("policyPostResponse");
    console.log(policyPostResponse);

    expect(rolePostResponse.ok());
    expect(rolePutResponse.ok());
    expect(policyPostResponse.ok());
  });

  test("Test catalog-entity read is denied", async ({ page }) => {
    await page.reload();
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "Component");
    await uiHelper.verifyTableIsEmpty();
    await uiHelper.openSidebar("Create...");
    await uiHelper.verifyText(
      "No templates found that match your filter. Learn more about",
      false,
    );
  });

  test("Test catalog-entity creation is denied", async () => {
    expect(
      await uiHelper.isLinkVisible("Register Existing Component"),
    ).toBeFalsy();
  });

  test("PUT catalog-entity read and POST create policies", async ({
    request,
  }) => {
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
  });

  test("Test catalog-entity read is allowed", async () => {
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "API");
    await uiHelper.clickLink("Nexus Repo Manager 3");
  });

  test("Test catalog-entity refresh is denied", async () => {
    expect(
      await uiHelper.isBtnVisibleByTitle("Schedule entity refresh"),
    ).toBeFalsy();
  });

  test("Test catalog-entity create is allowed", async () => {
    await uiHelper.openSidebar("Create...");
    expect(await uiHelper.isLinkVisible("Register Existing Component"));
  });

  test("Test bad PUT and PUT catalog-entity update policy", async ({
    request,
  }) => {
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
  });

  test("Test that the bad PUT didnt go through and catalog-entities can be read", async () => {
    await uiHelper.openSidebar("Home");
    await uiHelper.openSidebar("Create...");
    expect(
      await uiHelper.isTextVisible(
        "No templates found that match your filter. Learn more about",
      ),
    ).toBeFalsy();
  });

  test("Test that the good PUT request went through and catalog-entities can be refreshed", async () => {
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "API");
    await uiHelper.clickLink("Nexus Repo Manager 3");
    expect(await uiHelper.isBtnVisibleByTitle("Schedule entity refresh"));
  });

  test("Test that the good PUT request went through and catalog-entities cant be created", async () => {
    await uiHelper.openSidebar("Create...");
    expect(
      await uiHelper.isLinkVisible("Register Existing Component"),
    ).toBeFalsy();
  });

  test("DELETE catalog-entity update policy", async ({ request }) => {
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

  test("Test catalog-entity refresh is denied after DELETE", async () => {
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "API");
    await uiHelper.clickLink("Nexus Repo Manager 3");
    expect(await uiHelper.isBtnVisible("Schedule entity refresh")).toBeFalsy();
  });

  test.afterAll(async ({ request }) => {
    try {
      const remainingPoliciesResponse = await request.get(
        "/api/permission/policies/role/default/test",
        responseHelper.getSimpleRequest(),
      );

      const remainingPolicies = await responseHelper.removeMetadataFromResponse(
        remainingPoliciesResponse,
      );

      const deleteRemainingPolicies = await request.delete(
        "/api/permission/policies/role/default/test",
        responseHelper.createOrDeletePolicyRequest(
          remainingPolicies as PolicyComplete[],
        ),
      );

      const deleteRole = await request.delete(
        "/api/permission/roles/role/default/test",
        responseHelper.getSimpleRequest(),
      );

      expect(deleteRemainingPolicies.ok()).toBeTruthy();
      expect(deleteRole.ok()).toBeTruthy();
    } catch (error) {
      console.error("Error during cleanup in afterAll:", error);
    }
  });
});
