export * from "./opportunity-engine";

import { listInventory as listInventoryBase } from "./opportunity-engine";

export async function listInventory(filters: Record<string, string> = {}) {
  const rows = await listInventoryBase(filters);

  return rows.map((row) => {
    if (!row || typeof row !== "object") return row;

    const item = row as Record<string, unknown>;
    const existingSourceUrl = typeof item.source_url === "string" ? item.source_url.trim() : "";
    const publicSignalUrl = typeof item.public_signal_url === "string" ? item.public_signal_url.trim() : "";

    if (existingSourceUrl || !publicSignalUrl) return item;

    return {
      ...item,
      source_url: publicSignalUrl,
    };
  });
}
