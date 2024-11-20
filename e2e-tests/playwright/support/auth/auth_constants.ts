import path from "path";

const rootPath = process.cwd();

export const GH_USER_IDAuthFile = path.join(
  rootPath,
  "playwright/.auth/admin_rhdh.json",
);
export const GH_USER2_IDAuthFile = path.join(
  rootPath,
  "playwright/.auth/user2_rhdh.json",
);
export const RBAC_IDAuthFile = path.join(
  rootPath,
  "playwright/.auth/rbac.json",
);
