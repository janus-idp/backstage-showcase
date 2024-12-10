import { expect, test } from "@playwright/test";
import { Common } from "../../../utils/common";
import { RhdhAuthApiHack } from "../../../support/api/rhdh-auth-api-hack";
import { RhdhRbacClient } from "../../../support/api/rbac-api";
import { Role } from "../../../support/api/rbac-api-structures";

test.describe.only("Test RBAC plugin REST API", () => {
  test.beforeEach(async ({ page }) => {
    await new Common(page).loginAsGithubUser();
  });

  test("Test that roles and policies from GET request can be parsed", async ({
    page,
  }) => {
    const token = await RhdhAuthApiHack.getInstance().getToken(page);

    const rbacApi = await RhdhRbacClient.build(token);

    const rolesResponse = await rbacApi.getAllRoles();
    const policiesResponse = await rbacApi.getAllPolicies();

    expect(await rolesResponse.json());
    expect(await policiesResponse.json());
  });

  test("Create new role", async ({ request, page }) => {
    const members = ["user:default/rhdh-qe" + Date.now().toString()];
    const kind = "role";
    const ns = "default";
    const name = "role" + Date.now().toString();
    const token = await RhdhAuthApiHack.getInstance().getToken(page);
    const heads = { authorization: "Bearer: " + token };
    const firstRole = {
      memberReferences: members,
      name: "role:default/admin",
    };

    const createRole = await request.post(
      `/api/permission/roles/${kind}/${ns}/${name}`,
      {
        data: firstRole,
        headers: heads,
      },
    );

    expect(createRole.status).toBe(201);
    const body = await createRole.json();
    expect(body);
  });

  test("Change role name", async ({ request, page }) => {
    const newRole: Role = {
      memberReferences: ["user:default/rhdh-qe" + Date.now().toString()],
      name: "role:default/role" + Date.now().toString(),
    };
    const token = await RhdhAuthApiHack.getInstance().getToken(page);
    const heads = { authorization: "Bearer: " + token };
    const rolePostResponse = await request.post("/api/permission/roles", {
      data: newRole,
      headers: heads,
    });

    expect(rolePostResponse.ok());
  });

  // test("Create new role for rhdh-qe, change its name, and deny it from reading catalog entities", async ({
  //   request,
  // }) => {
  //   const newPolicy = {
  //     entityReference: "role:default/test",
  //     permission: "catalog-entity",
  //     policy: "read",
  //     effect: "deny",
  //   };

  //   const newRole = {
  //     memberReferences: members,
  //     name: "role:default/test",
  //   };

  //   const rolePostResponse = await request.post(
  //     "/api/permission/roles",
  //     responseHelper.createRoleRequest(firstRole),
  //   );

  //   const rolePutResponse = await request.put(
  //     "/api/permission/roles/role/default/admin",
  //     responseHelper.editRoleRequest(firstRole, newRole),
  //   );

  //   const policyPostResponse = await request.post(
  //     "/api/permission/policies",
  //     responseHelper.createOrDeletePolicyRequest([newPolicy]),
  //   );

  //   expect(rolePutResponse.ok());
  //   expect(policyPostResponse.ok());
  // });

  // test("Test catalog-entity read is denied", async () => {
  //   await uiHelper.openSidebar("Catalog");
  //   await uiHelper.selectMuiBox("Kind", "Component");
  //   await uiHelper.verifyTableIsEmpty();
  //   await uiHelper.openSidebar("Create...");
  //   await uiHelper.verifyText(
  //     "No templates found that match your filter. Learn more about",
  //     false,
  //   );
  // });

  // test("Test catalog-entity creation is denied", async () => {
  //   expect(
  //     await uiHelper.isLinkVisible("Register Existing Component"),
  //   ).toBeFalsy();
  // });

  // test("PUT catalog-entity read and POST create policies", async ({
  //   request,
  // }) => {
  //   const oldReadPolicy = [
  //     { permission: "catalog-entity", policy: "read", effect: "deny" },
  //   ];
  //   const newReadPolicy = [
  //     { permission: "catalog-entity", policy: "read", effect: "allow" },
  //   ];

  //   const createPolicy = [
  //     {
  //       entityReference: "role:default/test",
  //       permission: "catalog.entity.create",
  //       policy: "create",
  //       effect: "allow",
  //     },
  //   ];

  //   const readPutResponse = await request.put(
  //     "/api/permission/policies/role/default/test",
  //     responseHelper.editPolicyRequest(oldReadPolicy, newReadPolicy),
  //   );

  //   const createPostResponse = await request.post(
  //     "/api/permission/policies",
  //     responseHelper.createOrDeletePolicyRequest(createPolicy),
  //   );

  //   expect(readPutResponse.ok());
  //   expect(createPostResponse.ok());
  // });

  // test("Test catalog-entity refresh is denied", async () => {
  //   expect(
  //     await uiHelper.isBtnVisibleByTitle("Schedule entity refresh"),
  //   ).toBeFalsy();
  // });

  // test("Test catalog-entity create is allowed", async () => {
  //   await uiHelper.openSidebar("Create...");
  //   expect(await uiHelper.isLinkVisible("Register Existing Component"));
  // });

  // test("Test bad PUT and PUT catalog-entity update policy", async ({
  //   request,
  // }) => {
  //   const oldBadPolicy = [
  //     { permission: "catalog-entity", policy: "refresh", effect: "allow" },
  //   ];
  //   const newBadPolicy = [
  //     { permission: "catalog-entity", policy: "read", effect: "allow" },
  //   ];

  //   const oldGoodPolicy = [
  //     {
  //       permission: "catalog.entity.create",
  //       policy: "create",
  //       effect: "allow",
  //     },
  //   ];
  //   const newGoodPolicy = [
  //     {
  //       permission: "catalog.entity.refresh",
  //       policy: "update",
  //       effect: "allow",
  //     },
  //   ];

  //   const badPutResponse = await request.put(
  //     "/api/permission/policies/role/default/test",
  //     responseHelper.editPolicyRequest(oldBadPolicy, newBadPolicy),
  //   );

  //   const goodPutResponse = await request.put(
  //     "/api/permission/policies/role/default/test",
  //     responseHelper.editPolicyRequest(oldGoodPolicy, newGoodPolicy),
  //   );

  //   expect(badPutResponse.ok()).toBeFalsy();
  //   expect(goodPutResponse.ok());
  // });

  // test("Test that the bad PUT didnt go through and catalog-entities can be read", async () => {
  //   await page.go("Home");
  //   await uiHelper.openSidebar("Create...");
  //   expect(
  //     await uiHelper.isTextVisible(
  //       "No templates found that match your filter. Learn more about",
  //     ),
  //   ).toBeFalsy();
  // });

  // test("Test that the good PUT request went through and catalog-entities can be refreshed", async () => {
  //   await uiHelper.openSidebar("Catalog");
  //   await uiHelper.selectMuiBox("Kind", "API");
  //   await uiHelper.clickLink("Nexus Repo Manager 3");
  //   expect(await uiHelper.isBtnVisibleByTitle("Schedule entity refresh"));
  // });

  // test("Test that the good PUT request went through and catalog-entities cant be created", async () => {
  //   await uiHelper.openSidebar("Create...");
  //   expect(
  //     await uiHelper.isLinkVisible("Register Existing Component"),
  //   ).toBeFalsy();
  // });

  // test("DELETE catalog-entity update policy", async ({ request }) => {
  //   const deletePolicies = [
  //     {
  //       entityReference: "role:default/test",
  //       permission: "catalog.entity.refresh",
  //       policy: "update",
  //       effect: "allow",
  //     },
  //   ];
  //   const deleteResponse = await request.delete(
  //     "/api/permission/policies/role/default/test",
  //     responseHelper.createOrDeletePolicyRequest(deletePolicies),
  //   );

  //   expect(deleteResponse.ok());
  // });

  // test("Test catalog-entity refresh is denied after DELETE", async () => {
  //   await uiHelper.openSidebar("Catalog");
  //   await uiHelper.selectMuiBox("Kind", "API");
  //   await uiHelper.clickLink("Nexus Repo Manager 3");
  //   expect(await uiHelper.isBtnVisible("Schedule entity refresh")).toBeFalsy();
  // });

  // // eslint-disable-next-line no-empty-pattern
  // test.afterEach(async ({}, testInfo) => {
  //   if (testInfo.status === "failed") {
  //     console.log(`Test failed: ${testInfo.title}`);
  //     hasErrors = true;

  //     // Calculate the remaining retries by subtracting the current retry count from the total retries and adjusting for zero-based indexing.
  //     retriesRemaining = testInfo.project.retries - testInfo.retry - 1;
  //     console.log(`Retries remaining: ${retriesRemaining}`);
  //   }
  // });

  // test.afterAll(async ({ request }) => {
  //   if (hasErrors && retriesRemaining > 0) {
  //     console.log(
  //       `Skipping cleanup due to errors. Retries remaining: ${retriesRemaining}`,
  //     );
  //     return;
  //   }

  //   console.log(
  //     `afterAll: Proceeding with cleanup. Retries remaining: ${retriesRemaining}`,
  //   );

  //   try {
  //     const remainingPoliciesResponse = await request.get(
  //       "/api/permission/policies/role/default/test",
  //       responseHelper.getSimpleRequest(),
  //     );

  //     const remainingPolicies = await responseHelper.removeMetadataFromResponse(
  //       remainingPoliciesResponse,
  //     );

  //     const deleteRemainingPolicies = await request.delete(
  //       "/api/permission/policies/role/default/test",
  //       responseHelper.createOrDeletePolicyRequest(
  //         remainingPolicies as PolicyComplete[],
  //       ),
  //     );

  //     const deleteRole = await request.delete(
  //       "/api/permission/roles/role/default/test",
  //       responseHelper.getSimpleRequest(),
  //     );

  //     expect(deleteRemainingPolicies.ok()).toBeTruthy();
  //     expect(deleteRole.ok()).toBeTruthy();
  //   } catch (error) {
  //     console.error("Error during cleanup in afterAll:", error);
  //   }
  // });
});
