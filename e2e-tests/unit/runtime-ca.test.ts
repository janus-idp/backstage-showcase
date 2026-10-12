import { X509Certificate } from "node:crypto";

import { describe, expect, it } from "vitest";

import { generateUntrustedCaCertificate } from "../playwright/utils/runtime-ca";

describe("generateUntrustedCaCertificate", () => {
  it("captures a valid self-signed CA from a real OpenSSL subprocess", async () => {
    const pem = await generateUntrustedCaCertificate();
    const certificate = new X509Certificate(pem);
    const now = Date.now();

    expect(pem).toContain("-----BEGIN CERTIFICATE-----");
    expect(pem).not.toContain("PRIVATE KEY");
    expect(certificate.ca).toBe(true);
    expect(certificate.subject).toBe(certificate.issuer);
    expect(certificate.verify(certificate.publicKey)).toBe(true);
    expect(Date.parse(certificate.validFrom)).toBeLessThanOrEqual(now);
    expect(Date.parse(certificate.validTo)).toBeGreaterThan(now);
  });
});
