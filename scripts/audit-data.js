"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_DIR = path.resolve(process.env.DATA_DIR || "/data/responses");
const JOURNAL_DIR = path.resolve(process.env.JOURNAL_DIR || path.join(DATA_DIR, "..", "journal"));

async function main() {
  const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
  const summary = {
    files: 0,
    valid: 0,
    invalidJson: 0,
    invalidShape: 0,
    idMismatch: 0,
    invalidRevision: 0,
    invalidStatus: 0,
    temporaryFiles: 0,
    loosePermissions: 0,
    test: 0,
    real: 0,
    statuses: {},
    oldestUpdatedAt: null,
    newestUpdatedAt: null,
    journalFiles: 0,
    journalLines: 0,
  };

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name.startsWith(".") && entry.name.endsWith(".tmp")) {
      summary.temporaryFiles += 1;
      continue;
    }
    if (!entry.name.endsWith(".json")) continue;
    summary.files += 1;
    const filePath = path.join(DATA_DIR, entry.name);
    try {
      const stat = await fs.stat(filePath);
      if ((stat.mode & 0o077) !== 0) summary.loosePermissions += 1;
      const record = JSON.parse(await fs.readFile(filePath, "utf8"));
      if (!record || typeof record !== "object" || Array.isArray(record) || !record.answers || typeof record.answers !== "object" || Array.isArray(record.answers)) {
        summary.invalidShape += 1;
        continue;
      }
      summary.valid += 1;
      if (`${record.id}.json` !== entry.name) summary.idMismatch += 1;
      if (!Number.isSafeInteger(Number(record.revision)) || Number(record.revision) < 0) summary.invalidRevision += 1;
      if (!["in_progress", "completed", "screened_out"].includes(record.status)) summary.invalidStatus += 1;
      if (record.isTest || String(record.id || "").startsWith("test-")) summary.test += 1;
      else summary.real += 1;
      summary.statuses[record.status] = (summary.statuses[record.status] || 0) + 1;
      if (record.updatedAt) {
        if (!summary.oldestUpdatedAt || record.updatedAt < summary.oldestUpdatedAt) summary.oldestUpdatedAt = record.updatedAt;
        if (!summary.newestUpdatedAt || record.updatedAt > summary.newestUpdatedAt) summary.newestUpdatedAt = record.updatedAt;
      }
    } catch (error) {
      if (error instanceof SyntaxError) summary.invalidJson += 1;
      else throw error;
    }
  }

  try {
    const journals = (await fs.readdir(JOURNAL_DIR, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".ndjson"));
    summary.journalFiles = journals.length;
    for (const journal of journals) {
      const content = await fs.readFile(path.join(JOURNAL_DIR, journal.name), "utf8");
      summary.journalLines += content.split("\n").filter(Boolean).length;
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  summary.ok = summary.files === summary.valid
    && summary.invalidJson === 0
    && summary.invalidShape === 0
    && summary.idMismatch === 0
    && summary.invalidRevision === 0
    && summary.invalidStatus === 0
    && summary.temporaryFiles === 0
    && summary.loosePermissions === 0;
  console.log(JSON.stringify(summary));
}

main().catch((error) => {
  console.error("audit_failed", error);
  process.exit(1);
});
