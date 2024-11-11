import { test as base } from "@playwright/test";
import { Common } from "../Common";

export function githubTest(githubUser = process.env.GH_USER_ID) {
  const test = base;
  test.beforeEach(async ({ page }) => {
    const common = new Common(page);
    await common.loginAsGithubUser(githubUser);
  });
  return test;
}
