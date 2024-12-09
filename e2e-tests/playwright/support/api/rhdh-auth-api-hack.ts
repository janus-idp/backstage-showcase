import { Page } from "@playwright/test";

export class RhdhAuthApiHack {
  private static instance: RhdhAuthApiHack;

  private token: string | null = null;

  private constructor() {}

  public static getInstance(): RhdhAuthApiHack {
    if (!RhdhAuthApiHack.instance) {
      RhdhAuthApiHack.instance = new RhdhAuthApiHack();
    }
    return RhdhAuthApiHack.instance;
  }

  public async getToken(page: Page): Promise<string> {
    if (this.token) return this.token;

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
        this.token = body.backstageIdentity.token;
        return this.token;
      } else {
        throw new Error("Token not found in response body");
      }
    } catch (error) {
      console.error("Failed to retrieve the token:", error);
      throw error;
    }
  }
}
