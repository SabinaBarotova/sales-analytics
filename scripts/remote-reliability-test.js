"use strict";

const baseUrl = String(process.env.BASE_URL || "").replace(/\/$/, "");
const user = String(process.env.ANALYTICS_USER || "");
const password = String(process.env.ANALYTICS_PASSWORD || "");
const surveyPassword = String(process.env.SURVEY_PASSWORD || "");
const responseId = `test-production-reliability-${Date.now()}`;
let surveyCookie = "";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function put(revision, marker, status = "in_progress") {
  const response = await fetch(`${baseUrl}/api/responses/${responseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: surveyCookie },
    body: JSON.stringify({ schemaVersion: 2, revision, status, answers: { a0: "2", a1: "1", a2: "2", marker } }),
  });
  const body = await response.json();
  assert(response.status === 200, `put_${revision}_${response.status}`);
  return body;
}

async function getRecord() {
  const auth = Buffer.from(`${user}:${password}`).toString("base64");
  const response = await fetch(`${baseUrl}/api/analytics/responses`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  assert(response.status === 200, `analytics_${response.status}`);
  const payload = await response.json();
  return payload.records.find((record) => record.id === responseId);
}

async function main() {
  assert(baseUrl && user && password && surveyPassword, "missing_configuration");
  const health = await fetch(`${baseUrl}/health`).then((response) => response.json());
  assert(health.ok && health.storage === "writable", "storage_health_failed");

  const lockedSurvey = await fetch(`${baseUrl}/`);
  const lockedSurveyHtml = await lockedSurvey.text();
  assert(lockedSurvey.status === 200 && lockedSurveyHtml.includes("Введите пароль"), "survey_gate_failed");

  const lockedWrite = await fetch(`${baseUrl}/api/responses/${responseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schemaVersion: 2, revision: 1, status: "in_progress", answers: { a0: "2" } }),
  });
  assert(lockedWrite.status === 401, `survey_api_gate_${lockedWrite.status}`);

  const unlock = await fetch(`${baseUrl}/api/survey/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: surveyPassword }),
  });
  const setCookie = unlock.headers.get("set-cookie") || "";
  surveyCookie = setCookie.split(";", 1)[0];
  assert(unlock.status === 200 && surveyCookie && setCookie.includes("HttpOnly") && setCookie.includes("SameSite=Strict"), "survey_unlock_failed");

  const survey = await fetch(`${baseUrl}/`, { headers: { Cookie: surveyCookie } });
  const surveyHtml = await survey.text();
  const app = await fetch(`${baseUrl}/app.js?v=20260903-1`);
  assert(survey.status === 200 && surveyHtml.includes('id="app"') && app.status === 200, "static_assets_failed");

  const invalid = await fetch(`${baseUrl}/api/responses/${responseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: surveyCookie },
    body: "{",
  });
  assert(invalid.status === 400, `invalid_payload_${invalid.status}`);

  await put(1, "revision-1");
  await put(1, "same-revision-must-not-win");
  await put(0, "stale-must-not-win");

  const revisions = Array.from({ length: 30 }, (_, index) => index + 2);
  revisions.sort(() => Math.random() - 0.5);
  await Promise.all(revisions.map((revision) => put(revision, `revision-${revision}`)));
  let record = await getRecord();
  assert(record?.revision === 31, `concurrent_final_revision_${record?.revision}`);
  assert(record?.schemaVersion === 2, `schema_version_${record?.schemaVersion}`);
  assert(record?.answers?.marker === "revision-31", "concurrent_payload_lost");
  assert(record?.isTest === true, "production_test_not_marked");

  await put(32, "completed", "completed");
  record = await getRecord();
  assert(record?.revision === 32 && record?.status === "completed", "completion_save_failed");

  console.log(JSON.stringify({
    ok: true,
    responseId,
    finalRevision: record.revision,
    status: record.status,
    concurrentWrites: revisions.length,
    staleProtected: true,
    storage: health.storage,
  }));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
