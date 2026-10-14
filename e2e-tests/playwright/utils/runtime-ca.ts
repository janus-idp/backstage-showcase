import { X509Certificate } from "node:crypto";

import { run } from "./helper";

const OPENSSL_TIMEOUT_MS = 15_000;

/** Generate an unrelated CA for runtime database TLS rejection checks. */
export async function generateUntrustedCaCertificate(): Promise<string> {
  const certificate = await run(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      "/dev/null",
      "-days",
      "1",
      "-subj",
      "/CN=RHDH unrelated test CA",
    ],
    { timeout: OPENSSL_TIMEOUT_MS },
  );

  validateCaCertificate(certificate);
  return certificate;
}

function validateCaCertificate(pem: string): void {
  let certificate: X509Certificate;
  try {
    certificate = new X509Certificate(pem);
  } catch (error) {
    throw new Error("OpenSSL did not generate a valid X.509 certificate", { cause: error });
  }

  if (!certificate.ca) {
    throw new Error("Generated X.509 certificate is not a CA");
  }
  if (certificate.subject !== certificate.issuer || !certificate.verify(certificate.publicKey)) {
    throw new Error("Generated CA certificate is not self-signed");
  }

  const notBefore = Date.parse(certificate.validFrom);
  const notAfter = Date.parse(certificate.validTo);
  const now = Date.now();
  if (
    !Number.isFinite(notBefore) ||
    !Number.isFinite(notAfter) ||
    notBefore > now ||
    notAfter <= now
  ) {
    throw new Error("Generated CA certificate is not currently valid");
  }
}
