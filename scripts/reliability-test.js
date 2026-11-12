"use strict";

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const projectDir = path.resolve(__dirname, "..");
const port = 39124;
const baseUrl = `http://127.0.0.1:${port}`;
const auth = `Basic ${Buffer.from("analytics:local-reliability-test").toString("base64")}`;
const responseId = "test-reliability-concurrent-001";
let server;

async function startServer(dataRoot) {
  server = spawn(process.execPath, ["server.js"], {
    cwd: projectDir,
    env: {
      ...process.env,
      DATA_DIR: path.join(dataRoot, "responses"),
      JOURNAL_DIR: path.join(dataRoot, "journal"),
      PORT: String(port),
      ANALYTICS_USER: "analytics",
      ANALYTICS_PASSWORD: "local-reliability-test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return response.json();
    } catch {
      // Waiting for the port to become available.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("server_start_timeout");
}

async function stopServer() {
  if (!server || server.exitCode != null) return;
  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);
  if (server.exitCode == null) server.kill();
}

async function put(revision, marker, status = "in_progress") {
  const response = await fetch(`${baseUrl}/api/responses/${responseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schemaVersion: 2, revision, status, answers: { a0: "2", a1: "1", marker } }),
  });
  return { status: response.status, body: await response.json() };
}

async function analytics() {
  const response = await fetch(`${baseUrl}/api/analytics/responses`, { headers: { Authorization: auth } });
  const payload = await response.json();
  return { response, payload, record: payload.records.find((item) => item.id === responseId) };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), "reputation-reliability-"));
  const results = {};
  try {
    const health = await startServer(dataRoot);
    assert(health.ok && health.storage === "writable", "health_storage_failed");

    const survey = await fetch(`${baseUrl}/`);
    const unauthorized = await fetch(`${baseUrl}/analytics/`);
    const dashboard = await fetch(`${baseUrl}/analytics/`, { headers: { Authorization: auth } });
    results.routes = { survey: survey.status, analyticsUnauthorized: unauthorized.status, analyticsAuthorized: dashboard.status };
    assert(survey.status === 200 && unauthorized.status === 401 && dashboard.status === 200, "route_or_auth_failed");

    const invalidJson = await fetch(`${baseUrl}/api/responses/${responseId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: "{",
    });
    const invalidShape = await fetch(`${baseUrl}/api/responses/${responseId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: 1, answers: [] }),
    });
    results.validation = { invalidJson: invalidJson.status, invalidShape: invalidShape.status };
    assert(invalidJson.status === 400 && invalidShape.status === 400, "payload_validation_failed");

    const first = await put(1, "revision-1");
    const sameRevision = await put(1, "must-not-overwrite");
    const stale = await put(0, "stale");
    assert(first.body.revision === 1 && sameRevision.body.revision === 1 && stale.body.revision === 1, "revision_idempotency_failed");
    let current = await analytics();
    assert(current.record?.answers?.marker === "revision-1", "same_or_stale_revision_overwrote_data");

    await put(2, "revision-2");
    const revisions = Array.from({ length: 40 }, (_, index) => index + 3);
    revisions.sort(() => Math.random() - 0.5);
    const concurrent = await Promise.all(revisions.map((revision) => put(revision, `revision-${revision}`)));
    assert(concurrent.every((item) => item.status === 200), "concurrent_request_failed");
    current = await analytics();
    assert(current.record?.revision === 42, `highest_revision_lost_${current.record?.revision}`);
    assert(current.record?.answers?.marker === "revision-42", "highest_revision_payload_lost");
    assert(current.record?.schemaVersion === 2, `schema_version_${current.record?.schemaVersion}`);
    assert(current.record?.isTest === true, "test_record_not_marked");
    results.revisions = { finalRevision: current.record.revision, concurrentWrites: concurrent.length, staleProtected: true };

    const journalDir = path.join(dataRoot, "journal");
    const journalFiles = await fs.readdir(journalDir);
    const journalLines = (await Promise.all(journalFiles.map((name) => fs.readFile(path.join(journalDir, name), "utf8"))))
      .join("")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    assert(journalLines.length >= 3, "journal_missing_revisions");
    assert(journalLines.at(-1).revision === 42, "journal_latest_revision_missing");
    results.journal = { files: journalFiles.length, entries: journalLines.length, latestRevision: journalLines.at(-1).revision };

    await stopServer();
    const restartedHealth = await startServer(dataRoot);
    current = await analytics();
    assert(restartedHealth.ok && current.record?.revision === 42 && current.record?.answers?.marker === "revision-42", "restart_persistence_failed");
    results.restart = { persisted: true, revision: current.record.revision };

    console.log(JSON.stringify({ ok: true, ...results }));
  } finally {
    await stopServer();
    const resolved = path.resolve(dataRoot);
    const tempRoot = path.resolve(os.tmpdir());
    if (resolved.startsWith(`${tempRoot}${path.sep}`)) await fs.rm(resolved, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
