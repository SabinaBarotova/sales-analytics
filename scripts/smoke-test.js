"use strict";

const fs = require("node:fs");
const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");
const os = require("node:os");

const projectDir = path.resolve(__dirname, "..");
const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), "reputation-smoke-"));
const dataDir = path.join(dataRoot, "responses");
const journalDir = path.join(dataRoot, "journal");
const port = 39123;
const baseUrl = `http://127.0.0.1:${port}`;
const credentials = Buffer.from("analytics:local-test-only").toString("base64");
const surveyPassword = "local-survey-access";
let server;

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // The process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Server did not start");
}

async function main() {
  try {
    const seeded = spawnSync(process.execPath, ["scripts/seed-test-responses.js"], {
      cwd: projectDir,
      env: { ...process.env, DATA_DIR: dataDir },
      encoding: "utf8",
    });
    if (seeded.status !== 0) {
      throw new Error(`Unable to prepare smoke data: ${seeded.stderr || seeded.stdout}`);
    }
    const reseeded = spawnSync(process.execPath, ["scripts/seed-test-responses.js"], {
      cwd: projectDir,
      env: { ...process.env, DATA_DIR: dataDir },
      encoding: "utf8",
    });
    if (reseeded.status !== 0 || !reseeded.stdout.includes('"replaced":50')) {
      throw new Error(`Unable to refresh smoke data safely: ${reseeded.stderr || reseeded.stdout}`);
    }

    server = spawn(process.execPath, ["server.js"], {
      cwd: projectDir,
      env: {
        ...process.env,
        DATA_DIR: dataDir,
        JOURNAL_DIR: journalDir,
        PORT: String(port),
        ANALYTICS_USER: "analytics",
        ANALYTICS_PASSWORD: "local-test-only",
        SURVEY_PASSWORD: surveyPassword,
        SURVEY_COOKIE_PATH: "/",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    await waitForServer();
    const lockedSurvey = await fetch(`${baseUrl}/`);
    const lockedSurveyHtml = await lockedSurvey.text();
    const encodedIndex = await fetch(`${baseUrl}/%69ndex.html`);
    const encodedIndexHtml = await encodedIndex.text();
    const wrongUnlock = await fetch(`${baseUrl}/api/survey/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong-password" }),
    });
    const unauthorizedWrite = await fetch(`${baseUrl}/api/responses/test-reputation-analytics-001`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schemaVersion: 2, revision: 999, status: "in_progress", answers: { a0: "1" } }),
    });
    const unlock = await fetch(`${baseUrl}/api/survey/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: surveyPassword }),
    });
    const setCookie = unlock.headers.get("set-cookie") || "";
    const surveyCookie = setCookie.split(";", 1)[0];
    const secureUnlock = await fetch(`${baseUrl}/api/survey/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-Proto": "https" },
      body: JSON.stringify({ password: surveyPassword }),
    });
    const secureSetCookie = secureUnlock.headers.get("set-cookie") || "";
    let rateLimitedStatus = 0;
    for (let attempt = 0; attempt <= 10; attempt += 1) {
      const limitedUnlock = await fetch(`${baseUrl}/api/survey/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.42" },
        body: JSON.stringify({ password: "still-wrong" }),
      });
      if (attempt < 10 && limitedUnlock.status !== 401) {
        throw new Error(`Rate limit activated too early: ${limitedUnlock.status}`);
      }
      rateLimitedStatus = limitedUnlock.status;
    }
    const authenticatedWrite = await fetch(`${baseUrl}/api/responses/test-reputation-analytics-001`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: surveyCookie },
      body: JSON.stringify({ schemaVersion: 2, revision: 999, status: "in_progress", answers: { a0: "1", a1: "1", a2: "2" } }),
    });
    const unauthorized = await fetch(`${baseUrl}/analytics/`);
    const headers = { Authorization: `Basic ${credentials}` };
    const dashboard = await fetch(`${baseUrl}/analytics/`, { headers });
    const api = await fetch(`${baseUrl}/api/analytics/responses`, { headers });
    const payload = await api.json();
    const survey = await fetch(`${baseUrl}/`, { headers: { Cookie: surveyCookie } });
    const surveyHtml = await survey.text();
    const surveyApp = await fetch(`${baseUrl}/app.js`).then((response) => response.text());
    const analyticsSchema = await fetch(`${baseUrl}/analytics/schema.js`, { headers }).then((response) => response.text());
    const font = await fetch(`${baseUrl}/assets/fonts/manrope-cyrillic.woff2`);
    const fontBytes = (await font.arrayBuffer()).byteLength;
    const contentSecurityPolicy = survey.headers.get("content-security-policy") || "";

    const result = {
      unauthorized: unauthorized.status,
      dashboard: dashboard.status,
      api: api.status,
      records: payload.total,
      testRecords: payload.records?.filter((record) => record.isTest).length,
      lockedSurvey: lockedSurvey.status,
      lockedScreen: lockedSurveyHtml.includes("Введите пароль") && !lockedSurveyHtml.includes('id="app"'),
      encodedIndexLocked: encodedIndex.status === 200
        && encodedIndexHtml.includes("Введите пароль")
        && !encodedIndexHtml.includes('id="app"'),
      wrongUnlock: wrongUnlock.status,
      unauthorizedWrite: unauthorizedWrite.status,
      unlock: unlock.status,
      authenticatedWrite: authenticatedWrite.status,
      cookiePolicy: setCookie.includes("Path=/")
        && setCookie.includes("HttpOnly")
        && setCookie.includes("SameSite=Strict")
        && setCookie.includes("Max-Age=2592000"),
      secureCookie: secureSetCookie.includes("Secure"),
      rateLimited: rateLimitedStatus,
      survey: survey.status,
      questionnaireShell: surveyHtml.includes('id="app"') && !surveyHtml.includes("Введите пароль"),
      font: font.status,
      fontType: font.headers.get("content-type"),
      fontBytes,
      fontPolicy: contentSecurityPolicy.includes("font-src 'self'"),
      questionnaireV2: surveyApp.includes('code: "A0"')
        && surveyApp.includes('code: "B22"')
        && surveyApp.includes('code: "B55"')
        && surveyApp.includes('code: "B8"')
        && surveyApp.includes("schemaVersion: SCHEMA_VERSION"),
      analyticsV2: analyticsSchema.includes("currentVersion: 2")
        && analyticsSchema.includes('prefix: "b3_"')
        && analyticsSchema.includes('prefix: "b6_"'),
    };
    if (
      result.unauthorized !== 401
      || result.dashboard !== 200
      || result.api !== 200
      || result.records !== 50
      || result.testRecords !== 50
      || result.lockedSurvey !== 200
      || !result.lockedScreen
      || !result.encodedIndexLocked
      || result.wrongUnlock !== 401
      || result.unauthorizedWrite !== 401
      || result.unlock !== 200
      || result.authenticatedWrite !== 200
      || !result.cookiePolicy
      || !result.secureCookie
      || result.rateLimited !== 429
      || result.survey !== 200
      || !result.questionnaireShell
      || result.font !== 200
      || result.fontType !== "font/woff2"
      || result.fontBytes < 10_000
      || !result.fontPolicy
      || !result.questionnaireV2
      || !result.analyticsV2
    ) {
      throw new Error(`Smoke test failed: ${JSON.stringify(result)}`);
    }
    console.log(JSON.stringify({ ok: true, ...result }));
  } finally {
    server?.kill();
    fs.rmSync(dataRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
