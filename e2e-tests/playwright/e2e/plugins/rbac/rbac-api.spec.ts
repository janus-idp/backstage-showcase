import { Page, expect, test } from "@playwright/test";
import { Response } from "../../../support/pages/rbac";
import { Common, setupBrowser } from "../../../utils/common";
import { UIhelper } from "../../../utils/ui-helper";
import { RbacConstants } from "../../../data/rbac-constants";
import { RhdhAuthApiHack } from "../../../support/api/rhdh-auth-api-hack";
import RhdhRbacApi from "../../../support/api/rbac-api";
import { PolicyComplete } from "../../../support/api/rbac-api-structures";

/*
    Note that:
    The policies generated from a policy.csv or ConfigMap file cannot be edited or deleted using the Developer Hub Web UI. 
    https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.2/html/authorization/proc-rbac-ui-manage-roles_title-authorization#proc-rbac-ui-edit-role_title-authorization
*/

test.describe.serial("Test RBAC plugin REST API", () => {
  let common: Common;
  let uiHelper: UIhelper;
  let page: Page;
  let apiToken: string;

  test.beforeAll(async ({ browser }, testInfo) => {
    page = (await setupBrowser(browser, testInfo)).page;

    uiHelper = new UIhelper(page);
    common = new Common(page);

    await common.loginAsKeycloakUser();
    apiToken = await RhdhAuthApiHack.getToken(page);
  });

  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(async ({}, testInfo) => {
    console.log(
      `beforeEach: Attempting setup for ${testInfo.title}, retry: ${testInfo.retry}`,
    );
  });

  test("Test that roles and policies from GET request are what expected", async () => {
    const rbacApi = await RhdhRbacApi.build(apiToken);

    const rolesResponse = await rbacApi.getRoles();

    const policiesResponse = await rbacApi.getPolicies();

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
    console.log(rolesResponse.status());
    console.log(await rolesResponse.json());

    console.log("policiesResponse");
    console.log(policiesResponse.status());
    console.log(await policiesResponse.json());

    await Response.checkResponse(
      rolesResponse,
      RbacConstants.getExpectedRoles(),
    );
    await Response.checkResponse(
      policiesResponse,
      RbacConstants.getExpectedPolicies(),
    );
  });

  test("Create new role for rhdh-qe, change its name, and deny it from reading catalog entities", async () => {
    const rbacApi = await RhdhRbacApi.build(apiToken);
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

    const rolePostResponse = await rbacApi.createRoles(firstRole);
    //    const rolePostResponse = await request.post(
    //      "/api/permission/roles",
    //      responseHelper.createRoleRequest(firstRole),
    //    );
    const rolePutResponse = await rbacApi.updateRole(
      "default/admin",
      firstRole,
      newRole,
    );
    //    const rolePutResponse = await request.put(
    //      "/api/permission/roles/role/default/admin",
    //      responseHelper.editRoleRequest(firstRole, newRole),
    //    );
    const policyPostResponse = await rbacApi.createPolicies([newPolicy]);
    //    const policyPostResponse = await request.post(
    //     "/api/permission/policies",
    //     responseHelper.createOrDeletePolicyRequest([newPolicy]),
    //   );

    console.log("rolePostResponse");
    console.log(rolePostResponse.status());
    console.log(await rolePostResponse.json());

    console.log("rolePutResponse");
    console.log(rolePutResponse.status());
    console.log(await rolePutResponse.json());

    console.log("policyPostResponse");
    console.log(policyPostResponse.status());
    console.log(await policyPostResponse.json());

    expect(rolePostResponse.ok()).toBeTruthy();
    expect(rolePutResponse.ok()).toBeTruthy();
    expect(policyPostResponse.ok()).toBeTruthy();
  });

  test("Test catalog-entity read is denied", async ({ page }) => {
    await page.reload();
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "Component");
    await uiHelper.verifyTableIsEmpty();
    await page.goto("/create");
    await page.reload();
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

  test("PUT catalog-entity read and POST create policies", async () => {
    const rbacApi = await RhdhRbacApi.build(apiToken);

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

    const readPutResponse = await rbacApi.updatePolicy(
      "default/test",
      oldReadPolicy,
      newReadPolicy,
    );

    //const readPutResponse = await request.put(
    //  "/api/permission/policies/role/default/test",
    //  responseHelper.editPolicyRequest(oldReadPolicy, newReadPolicy),
    //);
    const createPostResponse = await rbacApi.createPolicies(createPolicy);

    //const createPostResponse = await request.post(
    //  "/api/permission/policies",
    //  responseHelper.createOrDeletePolicyRequest(createPolicy),
    //);

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

  test("Test bad PUT and PUT catalog-entity update policy", async () => {
    const rbacApi = await RhdhRbacApi.build(apiToken);

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

    const badPutResponse = await rbacApi.updatePolicy(
      "default/test",
      oldBadPolicy,
      newBadPolicy,
    );

    const goodPutResponse = await rbacApi.updatePolicy(
      "default/test",
      oldGoodPolicy,
      newGoodPolicy,
    );

    //
    //const badPutResponse = await request.put(
    //  "/api/permission/policies/role/default/test",
    //  responseHelper.editPolicyRequest(oldBadPolicy, newBadPolicy),
    //)//;

    //const goodPutResponse = await request.put(
    //  "/api/permission/policies/role/default/test",
    //  responseHelper.editPolicyRequest(oldGoodPolicy, newGoodPolicy),
    //);

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

  test("DELETE catalog-entity update policy", async () => {
    const rbacApi = await RhdhRbacApi.build(apiToken);
    const deletePolicies = [
      {
        entityReference: "role:default/test",
        permission: "catalog.entity.refresh",
        policy: "update",
        effect: "allow",
      },
    ];
    const deleteResponse = await rbacApi.deletePolicy(
      "default/test",
      deletePolicies,
    );
    //const deleteResponse = await request.delete(
    //  "/api/permission/policies/role/default/test",
    //  responseHelper.createOrDeletePolicyRequest(deletePolicies),
    //);

    expect(deleteResponse.ok());
  });

  test("Test catalog-entity refresh is denied after DELETE", async () => {
    await uiHelper.openSidebar("Catalog");
    await uiHelper.selectMuiBox("Kind", "API");
    await uiHelper.clickLink("Nexus Repo Manager 3");
    expect(await uiHelper.isBtnVisible("Schedule entity refresh")).toBeFalsy();
  });

  test.afterAll(async () => {
    const rbacApi = await RhdhRbacApi.build(apiToken);

    try {
      const remainingPoliciesResponse = await rbacApi.getPolicy("default/test");
      ///const remainingPoliciesResponse = await request.get(
      ///  "/api/permission/policies/role/default/test",
      ///  responseHelper.getSimpleRequest(),
      ///);

      const remainingPolicies = await Response.removeMetadataFromResponse(
        remainingPoliciesResponse,
      );

      const deleteRemainingPolicies = await rbacApi.deletePolicy(
        "default/test",
        remainingPolicies as PolicyComplete[],
      );
      //const deleteRemainingPolicies = await request.delete(
      //  "/api/permission/policies/role/default/test",
      //  responseHelper.createOrDeletePolicyRequest(
      //    remainingPolicies as PolicyComplete[],
      //  ),
      //);

      // const deleteRole = await request.delete(
      //   "/api/permission/roles/role/default/test",
      //   responseHelper.getSimpleRequest(),
      // );

      const deleteRole = await rbacApi.deleteRole("default/test");

      expect(deleteRemainingPolicies.ok()).toBeTruthy();
      expect(deleteRole.ok()).toBeTruthy();
    } catch (error) {
      console.error("Error during cleanup in afterAll:", error);
    }
  });
});
