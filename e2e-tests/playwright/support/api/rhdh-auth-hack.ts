import { Page } from "@playwright/test";

//here, we spy on the request to get the Backstage token to use APIs
// for context see https://redhat-internal.slack.com/archives/C04CUSD4JSG/p1733209200187279
export class RhdhAuthHack {
  static token: string;

  static async getToken(page: Page) {
    try {
      const response = await page.request.get(
        "/api/auth/github/refresh?optional=&scope=&env=development",
        {
          headers: {
            "x-requested-with": "XMLHttpRequest",
          },
        },
      );

      if (!response.ok()) {
        throw new Error(`HTTP error! Status: ${response.status()}`);
      }

      const body = await response.json();

      if (
        body &&
        body.backstageIdentity &&
        typeof body.backstageIdentity.token === "string"
      ) {
        RhdhAuthHack.token = body.backstageIdentity.token;
        return RhdhAuthHack.token;
      } else {
        throw new Error("Token not found in response body");
      }
    } catch (error) {
      console.error("Failed to retrieve the token:", error);

      throw error;
    }
  }
}
