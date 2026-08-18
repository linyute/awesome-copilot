export const NODE_TYPES = new Set(["position", "claim", "evidence", "unknown"]);
export const RELATIONS = new Set(["supports", "contradicts", "qualifies", "missing"]);

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_UTC_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?Z$/;
const LOCATOR_PATTERNS = [
  /\bp(?:age)?\.?\s*\d+(?:\s*[-–]\s*\d+)?\b/i,
  /§\s*[\p{L}\p{N}][\p{L}\p{N}._-]*/u,
  /\bL\d+(?:\s*[-–]\s*L?\d+)?\b/i,
  /\blines?\s+\d+(?:\s*[-–]\s*\d+)?\b/i,
  /\b(?:\d{1,2}:)?\d{2}:\d{2}(?:\s*[-–]\s*(?:\d{1,2}:)?\d{2}:\d{2})?\b/,
  /^(?:section|chapter|heading)\s*(?::|§)\s*\S.{1,}$/i,
];

export class MapValidationError extends Error {
  constructor(findings) {
    super(`證據圖無效（發現 ${findings.length} 個問題）。`);
    this.name = "MapValidationError";
    this.findings = findings;
  }
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonical(value[key])]),
  );
}

export function canonicalJson(map) {
  return JSON.stringify(canonical(map));
}

export function receiptPayload(map, sourceSnapshots) {
  return {
    contract: "doubt-evidence-receipt-v1",
    map,
    sourceSnapshots,
  };
}

function finding(path, rule, message) {
  return { path, rule, message };
}

function parseIsoDate(value) {
  if (typeof value !== "string") return null;
  const match = value.match(ISO_DATE);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return null;
  return time;
}

function retrievalDate(value) {
  const date = parseIsoDate(value);
  if (date !== null) return date;
  if (typeof value !== "string") return null;
  const match = value.match(ISO_UTC_TIMESTAMP);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  if (hour > 23 || minute > 59 || second > 59) return null;
  const dayValue = parseIsoDate(
    `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  );
  return dayValue === null ? null : dayValue;
}

function validUtcTimestamp(value) {
  if (typeof value !== "string") return false;
  const match = value.match(ISO_UTC_TIMESTAMP);
  if (!match) return false;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  if (hour > 23 || minute > 59 || second > 59) return false;
  return parseIsoDate(
    `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  ) !== null;
}

function boundedLocator(value) {
  return typeof value === "string" && LOCATOR_PATTERNS.some((pattern) => pattern.test(value.trim()));
}

function sourceLocation(value) {
  return typeof value === "string" && /^(?:https?:\/\/|file:\/\/|\.\.?[\\/]|[\\/]|[A-Za-z]:[\\/])/.test(value);
}

function substantiveExcerpt(value) {
  if (typeof value !== "string") return false;
  const symbols = value.toLowerCase().match(/[\p{L}\p{N}]/gu) || [];
  return new Set(symbols).size >= 6;
}

function reaches(start, target, adjacency, seen = new Set()) {
  if (start === target) return true;
  if (seen.has(start)) return false;
  seen.add(start);
  return (adjacency.get(start) || []).some((next) => reaches(next, target, adjacency, seen));
}

export function inspectMapContract(map) {
  const findings = [];
  if (!map || typeof map !== "object" || Array.isArray(map)) {
    return {
      findings: [finding("$", "map-type", "地圖必須是 JSON 物件。")],
      metrics: { claims: 0, contradictions: 0, evidence: 0, sources: 0, unknowns: 0 },
      receipt: null,
      valid: false,
    };
  }

  for (const key of ["title", "question", "verdict", "updatedAt"]) {
    if (!map[key] || typeof map[key] !== "string") {
      findings.push(finding(`$.${key}`, "required-field", `${key} 必須是非空字串。`));
    }
  }
  const updatedAt = parseIsoDate(map.updatedAt);
  if (typeof map.updatedAt === "string" && updatedAt === null) {
    findings.push(
      finding("$.updatedAt", "map-date", "updatedAt 必須是 YYYY-MM-DD 格式的真實曆法日期。"),
    );
  }
  if (!Array.isArray(map.nodes) || map.nodes.length === 0) {
    findings.push(finding("$.nodes", "required-nodes", "nodes 必須是非空陣列。"));
  }
  if (!Array.isArray(map.edges)) {
    findings.push(finding("$.edges", "required-edges", "edges 必須是陣列。"));
  }
  if (!Array.isArray(map.sources)) {
    findings.push(finding("$.sources", "required-sources", "sources 必須是陣列。"));
  }

  const nodes = Array.isArray(map.nodes) ? map.nodes : [];
  const edges = Array.isArray(map.edges) ? map.edges : [];
  const sources = Array.isArray(map.sources) ? map.sources : [];
  const nodeIds = new Set();
  const sourceIds = new Set();

  for (const [index, node] of nodes.entries()) {
    const base = `$.nodes[${index}]`;
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      findings.push(finding(base, "node-type", "每個節點必須是物件。"));
      continue;
    }
    if (!node.id || typeof node.id !== "string") {
      findings.push(finding(`${base}.id`, "node-id", "每個節點都需要一個字串 id。"));
    } else if (nodeIds.has(node.id)) {
      findings.push(finding(`${base}.id`, "duplicate-node", `重複的節點 id：${node.id}。`));
    } else {
      nodeIds.add(node.id);
    }
    if (!NODE_TYPES.has(node.type)) {
      findings.push(
        finding(
          `${base}.type`,
          "node-type",
          `節點類型必須是以下之一：${[...NODE_TYPES].join(", ")}。`,
        ),
      );
    }
    for (const key of ["label", "text"]) {
      if (!node[key] || typeof node[key] !== "string") {
        findings.push(finding(`${base}.${key}`, "node-copy", `${key} 必須是非空字串。`));
      }
    }
    if (node.confidence != null) {
      findings.push(
        finding(
          `${base}.confidence`,
          "false-precision",
          "不支援信心百分比；請改用未知 (unknown) 或有限定的主張 (claim)。",
        ),
      );
    }
  }

  for (const [index, source] of sources.entries()) {
    const base = `$.sources[${index}]`;
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      findings.push(finding(base, "source-type", "每個來源必須是物件。"));
      continue;
    }
    if (!source.id || typeof source.id !== "string") {
      findings.push(finding(`${base}.id`, "source-id", "每個來源都需要一個字串 id。"));
    } else if (sourceIds.has(source.id)) {
      findings.push(finding(`${base}.id`, "duplicate-source", `重複的來源 id：${source.id}。`));
    } else {
      sourceIds.add(source.id);
    }
    for (const key of ["title", "publisher", "date", "retrievedAt", "url", "locator", "excerpt"]) {
      if (!source[key] || typeof source[key] !== "string") {
        findings.push(
          finding(`${base}.${key}`, "source-field", `${key} 必須是非空字串。`),
        );
      }
    }
    const sourceDate = parseIsoDate(source.date);
    if (typeof source.date === "string" && sourceDate === null) {
      findings.push(
        finding(`${base}.date`, "source-date", "來源日期必須是 YYYY-MM-DD 格式的真實曆法日期。"),
      );
    } else if (sourceDate !== null && updatedAt !== null && sourceDate > updatedAt) {
      findings.push(
        finding(`${base}.date`, "future-source-date", "來源日期不能晚於 map.updatedAt。"),
      );
    }
    const retrievedAt = retrievalDate(source.retrievedAt);
    if (typeof source.retrievedAt === "string" && retrievedAt === null) {
      findings.push(
        finding(
          `${base}.retrievedAt`,
          "retrieval-date",
          "retrievedAt 必須是 YYYY-MM-DD 或以 Z 結尾的 ISO UTC 時間戳記。",
        ),
      );
    } else if (retrievedAt !== null && updatedAt !== null && retrievedAt > updatedAt) {
      findings.push(
        finding(`${base}.retrievedAt`, "future-retrieval", "retrievedAt 不能晚於 map.updatedAt。"),
      );
    } else if (retrievedAt !== null && sourceDate !== null && retrievedAt < sourceDate) {
      findings.push(
        finding(`${base}.retrievedAt`, "retrieval-before-source", "retrievedAt 不能早於來源日期。"),
      );
    }
    if (typeof source.url === "string" && !sourceLocation(source.url)) {
      findings.push(
        finding(
          `${base}.url`,
          "source-url",
          "來源位置必須是 http(s)、file:// 或相對/絕對本機路徑。",
        ),
      );
    }
    if (typeof source.locator === "string" && !boundedLocator(source.locator)) {
      findings.push(
        finding(
          `${base}.locator`,
          "source-locator",
          "定位器必須指出明確的頁碼、章節、行號範圍或時間戳記（例如 p. 7、§ 2.1、L12-L18、Section: Results 或 00:04:31）。",
        ),
      );
    }
    if (typeof source.excerpt === "string" && source.excerpt.trim().length < 40) {
      findings.push(
        finding(
          `${base}.excerpt`,
          "thin-excerpt",
          "來源摘錄必須包含至少 40 個字元的可檢查上下文。",
        ),
      );
    }
    if (typeof source.excerpt === "string" && source.excerpt.trim().length > 500) {
      findings.push(
        finding(
          `${base}.excerpt`,
          "oversized-excerpt",
          "來源摘錄請保持在 500 個字元以下，並連結至完整來源。",
        ),
      );
    }
    if (
      typeof source.excerpt === "string"
      && source.excerpt.trim().length >= 40
      && source.excerpt.trim().length <= 500
      && !substantiveExcerpt(source.excerpt)
    ) {
      findings.push(
        finding(
          `${base}.excerpt`,
          "low-information-excerpt",
          "來源摘錄必須包含具體多樣且可檢查的內容，而非重複的填充文字。",
        ),
      );
    }
    if (source.verification != null) {
      const verification = source.verification;
      const verificationBase = `${base}.verification`;
      if (!verification || typeof verification !== "object" || Array.isArray(verification)) {
        findings.push(
          finding(verificationBase, "verification-type", "verification 必須是物件。"),
        );
      } else {
        if (verification.status !== "verified") {
          findings.push(
            finding(`${verificationBase}.status`, "verification-status", "驗證狀態必須是 verified。"),
          );
        }
        if (verification.method !== "normalized-excerpt-match") {
          findings.push(
            finding(
              `${verificationBase}.method`,
              "verification-method",
              "驗證方法必須是 normalized-excerpt-match。",
            ),
          );
        }
        if (!validUtcTimestamp(verification.checkedAt)) {
          findings.push(
            finding(
              `${verificationBase}.checkedAt`,
              "verification-time",
              "驗證 checkedAt 必須是以 Z 結尾的 ISO UTC 時間戳記。",
            ),
          );
        } else if (source.retrievedAt !== verification.checkedAt.slice(0, 10)) {
          findings.push(
            finding(
              `${verificationBase}.checkedAt`,
              "verification-retrieval-mismatch",
              "已驗證來源的 retrievedAt 必須等於 verification.checkedAt 中的 UTC 日期。",
            ),
          );
        }
        for (const key of ["contentSha256", "excerptSha256"]) {
          if (typeof verification[key] !== "string" || !/^[a-f0-9]{64}$/.test(verification[key])) {
            findings.push(
              finding(
                `${verificationBase}.${key}`,
                "verification-digest",
                `${key} 必須是小寫的 SHA-256 摘要。`,
              ),
            );
          }
        }
        if (!["matched", "not-machine-checked"].includes(verification.locatorStatus)) {
          findings.push(
            finding(
              `${verificationBase}.locatorStatus`,
              "verification-locator",
              "locatorStatus 必須是 matched 或 not-machine-checked。",
            ),
          );
        }
        if (typeof verification.finalUrl !== "string" || !sourceLocation(verification.finalUrl)) {
          findings.push(
            finding(
              `${verificationBase}.finalUrl`,
              "verification-url",
              "finalUrl 必須是 http(s)、file:// 或本機路徑來源位置。",
            ),
          );
        }
      }
    }
  }

  const incoming = new Map(nodes.filter((node) => node?.id).map((node) => [node.id, 0]));
  const adjacency = new Map(nodes.filter((node) => node?.id).map((node) => [node.id, []]));
  const uniqueEdges = new Set();
  for (const [index, edge] of edges.entries()) {
    const base = `$.edges[${index}]`;
    if (!edge || typeof edge !== "object" || Array.isArray(edge)) {
      findings.push(finding(base, "edge-type", "每條邊必須是物件。"));
      continue;
    }
    if (!nodeIds.has(edge.from)) {
      findings.push(finding(`${base}.from`, "unknown-node", `未知的起始節點：${edge.from}。`));
    }
    if (!nodeIds.has(edge.to)) {
      findings.push(finding(`${base}.to`, "unknown-node", `未知的目標節點：${edge.to}。`));
    }
    if (edge.from && edge.from === edge.to) {
      findings.push(finding(base, "self-edge", `節點 ${edge.from} 不能指向自身。`));
    }
    const edgeKey = `${edge.from}\0${edge.to}\0${edge.relation}`;
    if (uniqueEdges.has(edgeKey)) {
      findings.push(
        finding(base, "duplicate-edge", "不允許重複的 from/to/relation 邊。"),
      );
    } else {
      uniqueEdges.add(edgeKey);
    }
    if (!RELATIONS.has(edge.relation)) {
      findings.push(
        finding(
          `${base}.relation`,
          "edge-relation",
          `關聯必須是以下之一：${[...RELATIONS].join(", ")}。`,
        ),
      );
    }
    if (!edge.note || typeof edge.note !== "string") {
      findings.push(
        finding(`${base}.note`, "edge-note", "每條推理邊都需要純文字註記。"),
      );
    }
    if (nodeIds.has(edge.to)) incoming.set(edge.to, (incoming.get(edge.to) || 0) + 1);
    if (nodeIds.has(edge.from) && nodeIds.has(edge.to) && edge.from !== edge.to) {
      adjacency.get(edge.from).push(edge.to);
    }
  }

  for (const [index, node] of nodes.entries()) {
    if (!node || typeof node !== "object") continue;
    const base = `$.nodes[${index}]`;
    if (node.type === "evidence" && !node.sourceId) {
      findings.push(
        finding(`${base}.sourceId`, "unsourced-evidence", "證據節點需要 sourceId。"),
      );
    }
    if (node.sourceId && !sourceIds.has(node.sourceId)) {
      findings.push(
        finding(
          `${base}.sourceId`,
          "unknown-source",
          `節點參照了未知的來源：${node.sourceId}。`,
        ),
      );
    }
    if (
      node.type === "evidence" &&
      node.id &&
      !edges.some((edge) => edge?.from === node.id)
    ) {
      findings.push(
        finding(base, "unused-evidence", "證據必須參與至少一條推理邊。"),
      );
    }
  }

  for (const [index, source] of sources.entries()) {
    if (
      source?.id &&
      !nodes.some((node) => node?.type === "evidence" && node.sourceId === source.id)
    ) {
      findings.push(
        finding(
          `$.sources[${index}]`,
          "unused-source",
          "每個來源都必須附加到至少一個證據節點。",
        ),
      );
    }
  }

  const positions = nodes.filter((node) => node?.type === "position");
  if (positions.length !== 1) {
    findings.push(
      finding("$.nodes", "position-count", "圖中必須恰好包含一個立場 (position) 節點。"),
    );
  } else if (!incoming.get(positions[0].id)) {
    findings.push(
      finding(
        `$.nodes[${nodes.indexOf(positions[0])}]`,
        "unsupported-position",
        "立場節點需要至少一條連入的推理邊。",
      ),
    );
  } else {
    for (const [index, node] of nodes.entries()) {
      if (!node?.id || node.id === positions[0].id) continue;
      if (!reaches(node.id, positions[0].id, adjacency)) {
        findings.push(
          finding(
            `$.nodes[${index}]`,
            "disconnected-node",
            `節點 ${node.id} 必須有一條指向立場節點的導向推理路徑。`,
          ),
        );
      }
    }
  }

  const visitState = new Map();
  const cyclicNodes = new Set();
  function visit(nodeId, stack = []) {
    const state = visitState.get(nodeId) || 0;
    if (state === 1) {
      for (const member of stack.slice(stack.indexOf(nodeId))) cyclicNodes.add(member);
      return;
    }
    if (state === 2) return;
    visitState.set(nodeId, 1);
    for (const next of adjacency.get(nodeId) || []) visit(next, [...stack, nodeId]);
    visitState.set(nodeId, 2);
  }
  for (const nodeId of nodeIds) visit(nodeId);
  for (const nodeId of cyclicNodes) {
    const index = nodes.findIndex((node) => node?.id === nodeId);
    findings.push(
      finding(`$.nodes[${index}]`, "reasoning-cycle", `節點 ${nodeId} 參與了循環推理。`),
    );
  }

  const metrics = {
    claims: nodes.filter((node) => node?.type === "claim").length,
    contradictions: new Set(
      edges
        .filter((edge) => edge?.relation === "contradicts")
        .map((edge) => `${edge.from}\0${edge.to}\0${edge.relation}`),
    ).size,
    evidence: nodes.filter((node) => node?.type === "evidence").length,
    sources: sources.length,
    unknowns: nodes.filter((node) => node?.type === "unknown").length,
  };
  return {
    findings,
    metrics,
    receipt: null,
    valid: findings.length === 0,
  };
}

export function validateMapContract(map) {
  const result = inspectMapContract(map);
  if (!result.valid) throw new MapValidationError(result.findings);
  return result;
}
