import { assert } from "node:console";
import { OcApi } from "../support/api/oc-api";
import test from "@playwright/test";

test("check if oc api is alive", async () => {
  const ocApi = new OcApi(
    "https://api.alxdq5slv4a572c9df.eastus.aroapp.io:6443",
  );
  assert(await ocApi.isAlive());
  await ocApi.installDeveloperHubOperator();
});

test("I have some oeprators", async () => {
  const ocApi = new OcApi(
    "https://api.alxdq5slv4a572c9df.eastus.aroapp.io:6443",
  );
  assert(await ocApi.isAlive());
  await ocApi.listAvailableOperators();
});
