import { describe, expect, it } from "vitest";

import {
  buildGitlabFetchProbeCommand,
  buildGitlabSClientCommand,
  buildOpenSslVersionCommand,
  isHybridMlKemGroup,
  parseOpenSslSClientOutput,
} from "../playwright/utils/pqc/tls-ml-kem-probe";

const HYBRID_S_CLIENT_FIXTURE = `
CONNECTED(00000003)
---
Certificate chain
---
Server certificate
---
No client certificate CA names sent
Peer signing digest: SHA256
Peer signature type: ECDSA
Server Temp Key: X25519, 253 bits
---
SSL handshake has read 3291 bytes and written 1653 bytes
Verification: OK
---
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
Protocol: TLSv1.3
Negotiated TLS1.3 group: X25519MLKEM768
Verify return code: 0 (ok)
---
`;

const CLASSICAL_S_CLIENT_FIXTURE = `
Protocol: TLSv1.3
Negotiated TLS1.3 group: x25519
Verify return code: 0 (ok)
`;

describe("isHybridMlKemGroup", () => {
  it("accepts known hybrid ML-KEM groups", () => {
    expect(isHybridMlKemGroup("X25519MLKEM768")).toBe(true);
    expect(isHybridMlKemGroup("SecP256r1MLKEM768")).toBe(true);
    expect(isHybridMlKemGroup("SecP384r1MLKEM1024")).toBe(true);
  });

  it("rejects classical groups and missing values", () => {
    expect(isHybridMlKemGroup("x25519")).toBe(false);
    expect(isHybridMlKemGroup("P-256")).toBe(false);
    expect(isHybridMlKemGroup()).toBe(false);
    expect(isHybridMlKemGroup("")).toBe(false);
  });
});

describe("parseOpenSslSClientOutput", () => {
  it("parses hybrid ML-KEM handshake output", () => {
    const parsed = parseOpenSslSClientOutput(HYBRID_S_CLIENT_FIXTURE);
    expect(parsed.protocol).toBe("TLSv1.3");
    expect(parsed.negotiatedGroup).toBe("X25519MLKEM768");
    expect(parsed.verifyReturnCode).toBe(0);
    expect(isHybridMlKemGroup(parsed.negotiatedGroup)).toBe(true);
  });

  it("parses classical negotiated group without treating it as hybrid", () => {
    const parsed = parseOpenSslSClientOutput(CLASSICAL_S_CLIENT_FIXTURE);
    expect(parsed.protocol).toBe("TLSv1.3");
    expect(parsed.negotiatedGroup).toBe("x25519");
    expect(isHybridMlKemGroup(parsed.negotiatedGroup)).toBe(false);
  });

  it("returns undefined fields when markers are missing", () => {
    const parsed = parseOpenSslSClientOutput("no tls info here");
    expect(parsed.protocol).toBeUndefined();
    expect(parsed.negotiatedGroup).toBeUndefined();
    expect(parsed.verifyReturnCode).toBeUndefined();
  });
});

describe("command builders", () => {
  it("builds openssl version command", () => {
    expect(buildOpenSslVersionCommand()).toEqual(["openssl", "version"]);
  });

  it("builds a default-ClientHello s_client command for the GitLab host", () => {
    const command = buildGitlabSClientCommand("gitlab.example.com");
    expect(command[0]).toBe("sh");
    expect(command[1]).toBe("-c");
    expect(command[2]).toContain("openssl s_client");
    expect(command[2]).toContain("-connect 'gitlab.example.com:443'");
    expect(command[2]).toContain("-servername 'gitlab.example.com'");
    expect(command[2]).toContain("exit 0");
    expect(command[2]).not.toContain("-groups");
  });

  it("builds a Node fetch probe against the GitLab version API", () => {
    const command = buildGitlabFetchProbeCommand("gitlab.example.com");
    expect(command[0]).toBe("node");
    expect(command[1]).toBe("-e");
    expect(command[2]).toContain("https://gitlab.example.com/api/v4/version");
    expect(command[2]).toContain("process.exit(0)");
  });

  it("includes PRIVATE-TOKEN when a token is provided", () => {
    const command = buildGitlabFetchProbeCommand("gitlab.example.com", "glpat-test");
    expect(command[2]).toContain("PRIVATE-TOKEN");
    expect(command[2]).toContain("glpat-test");
  });
});
