import { expect, Locator, Page } from "@playwright/test";
import { PageObject, PagesUrl } from "./page";

export class RbacPo extends PageObject {
  private readonly testUsers = {
    guest: "Guest User",
    tara: "Tara MacGovern",
    backstage: "Backstage",
    rhdhqe: "rhdh-qe",
  };

  private article: Locator;
  private updateMemberButton: Locator;
  // roles
  private roleName: Locator;
  private roledescription: Locator;
  private addUsersAndGroups: Locator;
  private addPermissionPolicy: Locator;

  private selectMember(label: string): string {
    return `span[data-testid="${label}"]`;
  }
  private selectPermissionPolicyPlugin(row: number): string {
    return `input[name="permissionPoliciesRows[${row}].plugin"]`;
  }
  private selectPermissionPolicyPermission(row: number): string {
    return `input[name="permissionPoliciesRows[${row}].permission"]`;
  }
  private selectPolicy(
    row: number,
    policy: number,
    policyName: string,
  ): string {
    return `input[name="permissionPoliciesRows[${row}].policies[${policy}].policy-${policyName}"]`;
  }

  constructor(page: Page, url: PagesUrl = PagesUrl.rbac) {
    super(page, url);
    this.article = this.page.getByRole("article");
    this.updateMemberButton = this.page
      .getByTestId("update-members")
      .getByLabel("Update");
    this.roleName = this.page.locator('input[name="name"]');
    this.roledescription = this.page.locator('input[name="description"]');
    this.addUsersAndGroups = this.page.locator(
      'input[name="add-users-and-groups"]',
    );
    this.addPermissionPolicy = this.page.locator(
      'button[name="add-permission-policy"]',
    );
  }

  async verifyGeneralRbacViewHeading() {
    await this.uiHelper.verifyHeading(/All roles \(\d+\)/);
  }

  async verifyUserRoleViewHeading(role: string) {
    await this.uiHelper.verifyHeading(role);
  }

  async verifyRoleIsListed(role: string) {
    await this.uiHelper.verifyLink(role);
  }

  async clickOnRoleLink(role: string) {
    await this.uiHelper.clickLink(role);
  }

  async switchToOverView() {
    await this.uiHelper.clickTab("Overview");
  }

  async verifyOverviewHeading(groups: number, policies: number) {
    await this.uiHelper.verifyHeading(`Users and groups (${groups} group)`);
    await this.uiHelper.verifyHeading(`Permission policies (${policies})`);
  }

  async verifyArticle() {
    await expect(this.article).toContainText("catalog-entity");
    await expect(this.article).toContainText("Read, Update");
    await expect(this.article).toContainText("Delete");
  }

  async updateMember(member: string) {
    await this.updateMemberButton.click();
    await this.verifyATextIsVisible(member);
  }

  async next() {
    this.uiHelper.clickButton("Next");
  }

  async selectOption(option: "catalog" | "catalog-entity") {
    const optionSelector = `li[role="option"]:has-text("${option}")`;
    await this.page.waitForSelector(optionSelector);
    await this.page.click(optionSelector);
  }

  async createRole(
    name: string,
    rolesAndUsersToAdd: string[] = [
      this.testUsers.guest,
      this.testUsers.tara,
      this.testUsers.backstage,
    ],
  ) {
    if (!this.page.url().includes("rbac")) await this.goto();
    await this.uiHelper.clickButton("Create");
    await this.uiHelper.verifyHeading("Create role");
    await this.roleName.fill(name);
    await this.uiHelper.clickButton("Next");
    rolesAndUsersToAdd.forEach(async (userOrRole) => {
      await this.addUsersAndGroups.fill(userOrRole);
      await this.page.click(this.selectMember(userOrRole));
    });
    //TODO: this has to be dynamic
    await this.uiHelper.verifyHeading("Users and groups (2 users, 1 group)");
    await this.next();
    await this.page.click(this.selectPermissionPolicyPlugin(0));
    await this.selectOption("catalog");
    await this.page.click(this.selectPermissionPolicyPermission(0));
    await this.selectOption("catalog-entity");
  }
}
