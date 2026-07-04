const baseUrl = process.env.MARKETVIBE_BASE_URL || "http://127.0.0.1:3000";

async function readJson(path) {
  const response = await fetch(new URL(path, baseUrl));
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`${path} did not return JSON: ${text.slice(0, 200)}`);
  }
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}: ${JSON.stringify(payload).slice(0, 300)}`);
  }
  return payload;
}

const autopilot = await readJson("/api/cron/autopilot");
if (autopilot.ok !== true || autopilot.message !== "Autopilot completed" || !autopilot.result) {
  throw new Error(`/api/cron/autopilot returned an unexpected payload: ${JSON.stringify(autopilot).slice(0, 300)}`);
}

const leadHunt = await readJson("/api/cron/lead-hunt?markets=1&leads=2");
if (typeof leadHunt.ok !== "boolean" || typeof leadHunt.savedLeadCount !== "number" || !Array.isArray(leadHunt.results)) {
  throw new Error(`/api/cron/lead-hunt returned an unexpected payload: ${JSON.stringify(leadHunt).slice(0, 300)}`);
}

console.log("Cron route smoke checks passed.");
