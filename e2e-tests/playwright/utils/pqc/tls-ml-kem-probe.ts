/** Hybrid ML-KEM TLS 1.3 groups accepted as PQ proof (RHIDP-17857). */
export const HYBRID_ML_KEM_GROUPS = [
  "X25519MLKEM768",
  "SecP256r1MLKEM768",
  "SecP384r1MLKEM1024",
] as const;

export type HybridMlKemGroup = (typeof HYBRID_ML_KEM_GROUPS)[number];

export interface OpenSslSClientResult {
  protocol: string | undefined;
  negotiatedGroup: string | undefined;
  verifyReturnCode: number | undefined;
}

const PROTOCOL_RE = /^Protocol\s*:\s*(.+)$/imu;
const NEGOTIATED_GROUP_RE = /^Negotiated TLS1\.3 group:\s*(\S+)/imu;
const VERIFY_RETURN_CODE_RE = /^Verify return code:\s*(\d+)\s*\(/imu;

export function isHybridMlKemGroup(group?: string): group is HybridMlKemGroup {
  if (group === undefined || group === "") {
    return false;
  }
  return (HYBRID_ML_KEM_GROUPS as readonly string[]).includes(group);
}

/** Parse openssl s_client stdout/stderr for TLS 1.3 negotiated-group evidence. */
export function parseOpenSslSClientOutput(output: string): OpenSslSClientResult {
  const protocolMatch = PROTOCOL_RE.exec(output);
  const groupMatch = NEGOTIATED_GROUP_RE.exec(output);
  const verifyMatch = VERIFY_RETURN_CODE_RE.exec(output);

  const verifyCodeRaw = verifyMatch?.[1];
  return {
    protocol: protocolMatch?.[1]?.trim(),
    negotiatedGroup: groupMatch?.[1],
    verifyReturnCode:
      verifyCodeRaw === undefined ? undefined : Math.trunc(Number(verifyCodeRaw)),
  };
}

export function buildOpenSslVersionCommand(): string[] {
  return ["openssl", "version"];
}

/**
 * Default ClientHello to the GitLab HTTPS peer (no -groups force).
 * Pipe empty stdin so s_client exits after the handshake.
 * Always exit 0 so kube exec returns stdout for parsing (handshake assertions
 * live in the Playwright expect, not the openssl process exit code).
 */
export function buildGitlabSClientCommand(host: string): string[] {
  const connect = `${host}:443`;
  return [
    "sh",
    "-c",
    `echo | openssl s_client -connect ${shellQuote(connect)} -servername ${shellQuote(host)} 2>&1; exit 0`,
  ];
}

/**
 * Node fetch against GitLab REST — same stack as GitLabIntegration.fetch().
 * Exit 0 on any HTTP response (TLS completed); exit 1 on network/TLS failure.
 * Optional token is used when the peer requires auth for /api/v4/version.
 */
export function buildGitlabFetchProbeCommand(host: string, token?: string): string[] {
  const url = `https://${host}/api/v4/version`;
  const headers =
    token !== undefined && token !== ""
      ? `{ "PRIVATE-TOKEN": ${JSON.stringify(token)} }`
      : "{}";
  return [
    "node",
    "-e",
    `fetch(${JSON.stringify(url)}, { headers: ${headers} }).then((r) => { console.log(r.status); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); })`,
  ];
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}
