export * from "./opportunity-engine";

import { listInventory as listInventoryBase } from "./opportunity-engine";

type OpportunityRow = Record<string, unknown>;

const nestedKeys = [
  "raw_payload",
  "metadata",
  "source_metadata",
  "source_data",
  "evidence",
  "signal",
  "website_scan",
];

function objectsFor(row: OpportunityRow) {
  const objects: OpportunityRow[] = [row];

  for (const key of nestedKeys) {
    const value = row[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      objects.push(value as OpportunityRow);
    }
  }

  return objects;
}

function firstText(row: OpportunityRow, keys: string[]) {
  for (const object of objectsFor(row)) {
    for (const key of keys) {
      const value = object[key];
      if (typeof value === "string" && value.trim()) {
        return value.replace(/\s+/g, " ").trim();
      }
    }
  }

  return "";
}

function normalizeInventoryRow(row: unknown) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return row;

  const item = row as OpportunityRow;
  const sourceUrl = firstText(item, [
    "source_url",
    "public_signal_url",
    "public_source_url",
    "evidence_url",
    "original_url",
    "source_link",
    "signal_url",
    "url",
  ]);
  const signalText = firstText(item, [
    "public_signal_text",
    "signal_text",
    "signal_summary",
    "source_text",
    "source_title",
    "source_evidence",
    "evidence_summary",
    "opportunity_summary",
    "problem_summary",
    "pain_point",
    "intent_reason",
    "match_reason",
    "source_note",
    "internal_notes",
    "recommended_action",
    "summary",
    "description",
    "title",
  ]);
  const inventoryStatus = firstText(item, ["inventory_status"]).toUpperCase();
  const currentEvidenceStatus = firstText(item, ["evidence_status"]).toLowerCase();

  const normalizedEvidenceStatus =
    inventoryStatus === "IN_INVENTORY" && sourceUrl && signalText
      ? "verified"
      : currentEvidenceStatus || undefined;

  return {
    ...item,
    ...(sourceUrl ? { source_url: sourceUrl } : {}),
    ...(signalText ? { public_signal_text: signalText } : {}),
    ...(normalizedEvidenceStatus ? { evidence_status: normalizedEvidenceStatus } : {}),
  };
}

export async function listInventory(filters: Record<string, string> = {}) {
  const rows = await listInventoryBase(filters);
  return rows.map(normalizeInventoryRow) as Array<Record<string, unknown>>;
}
