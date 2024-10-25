import path from "path";

const rootPath = process.cwd();

export const GH_USER_IDAuthFile_rhdh = path.join(
  rootPath,
  "playwright/.auth/admin_rhdh.json",
);
export const GH_USER2_IDAuthFile_rhdh = path.join(
  rootPath,
  "playwright/.auth/user2_rhdh.json",
);
export const GH_USER_IDAuthFile_github = path.join(
  rootPath,
  "playwright/.auth/admin_github.json",
);
export const GH_USER2_IDAuthFile_github = path.join(
  rootPath,
  "../../playwright/.auth/user2_github.json",
);
