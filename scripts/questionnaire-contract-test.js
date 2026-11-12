"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectDir = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(projectDir, "public", "app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(projectDir, "public", "index.html"), "utf8");
const accessSource = fs.readFileSync(path.join(projectDir, "public", "access.html"), "utf8");
const analyticsSource = fs.readFileSync(path.join(projectDir, "public", "analytics", "schema.js"), "utf8");
const serverSource = fs.readFileSync(path.join(projectDir, "server.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(analyticsSource, context, { filename: "analytics/schema.js" });
const schema = context.window.AnalyticsSchema;
const legacyCompanyHeader = ["Группа", "компаний", "Rubytech"].join(" ");
const removedAccessCopy = ["Доступ к исследованию открыт", "только для приглашённых участников."].join(" ");
const removedAccessEyebrow = ["Закрытая", "анкета"].join(" ");
const removedAccessOverline = ["Защищённый", "доступ"].join(" ");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const expectedCodes = [
  "A0", "A1", "A2", "A3", "A4", "A5", "A7", "A8",
  "B1", "B2", "B22", "B3", "B4", "B5", "B55", "B6", "B7", "B8",
  "C1", "C2", "C3", "C4",
];
assert(JSON.stringify(schema.questions.map((question) => question.code)) === JSON.stringify(expectedCodes), "question_order_mismatch");
assert(schema.questions.length === 22, `question_count_${schema.questions.length}`);
assert(schema.byKey.get("a0")?.options?.length === 3, "brand_options_mismatch");
assert(schema.byKey.get("a1")?.options?.find((option) => option.value === "3")?.label === "Проектная группа внутри заказчика", "department_option_3_mismatch");
assert(schema.byKey.get("a7")?.options?.length === 17, "supplier_factor_options_mismatch");
assert(schema.byKey.get("b1")?.options?.length === 6, "company_sentiment_options_mismatch");
assert(schema.byKey.get("b3")?.rows?.length === 9, "company_matrix_rows_mismatch");
assert(schema.byKey.get("b6")?.rows?.length === 8, "product_matrix_rows_mismatch");
assert(schema.byKey.get("b3")?.options?.length === 6, "rating_scale_mismatch");
assert(schema.byKey.get("c3")?.options?.length === 7, "event_format_options_mismatch");
assert(schema.legacyQuestions.length === 32, `legacy_question_count_${schema.legacyQuestions.length}`);
assert(schema.versionNumber({ schemaVersion: 1 }) === 1, "legacy_version_detection_failed");
assert(schema.versionNumber({ schemaVersion: 2 }) === 2, "current_version_detection_failed");
assert(schema.byKeyForVersion(1).get("b3")?.type === "multi", "legacy_b3_schema_changed");
assert(schema.byKeyForVersion(2).get("b3")?.type === "matrix", "current_b3_schema_mismatch");
assert(schema.byKeyForVersion(1).get("c2")?.type === "multi", "legacy_c2_schema_changed");
assert(schema.byKeyForVersion(2).get("c2")?.type === "text", "current_c2_schema_mismatch");
assert(schema.questionForAnswerKey("b3_1", 2)?.key === "b3", "matrix_answer_mapping_failed");

const appContracts = [
  'const SCHEMA_VERSION = 2;',
  'state.currentStepId = "a0";',
  'visible: () => hasNegativeFeedback("b1")',
  'visible: () => hasPositiveFeedback("b1")',
  'visible: () => hasNegativeFeedback("b4")',
  'visible: () => hasPositiveFeedback("b4")',
  'clearUnless(hasNegativeFeedback("b1") || hasNegativeFeedback("b4"), ["b7", "b8"]);',
  'max: 3,',
  'sourceKey: "a7",',
  'if (a7Values.length === 1)',
  'state.answers.a8 = [...a7Values];',
  'rotateExcept(supplierFactors, [98, 99], "a7")',
  'rotateExcept(eventFormats, [98, 99], "c3")',
  'rows: companyRatingCriteria',
  'rows: productRatingCriteria',
  'schemaVersion: SCHEMA_VERSION',
];
for (const contract of appContracts) assert(appSource.includes(contract), `missing_app_contract:${contract}`);
assert(!appSource.includes('code: "A6"'), "removed_a6_still_present");
assert(!appSource.includes('code: "C5"'), "removed_c5_still_present");
assert(!indexSource.includes(legacyCompanyHeader), "legacy_company_header_in_survey");
assert(!accessSource.includes(legacyCompanyHeader), "legacy_company_header_in_access");
assert(indexSource.includes("Группа Rubytech"), "company_header_missing_in_survey");
assert(accessSource.includes("Группа Rubytech"), "company_header_missing_in_access");
assert(accessSource.includes("Введите пароль"), "survey_access_screen_missing");
assert(accessSource.includes("Внутренняя анкета для сотрудников"), "internal_survey_label_missing");
assert(!accessSource.includes(removedAccessCopy), "removed_access_copy_returned");
assert(!accessSource.includes(removedAccessEyebrow), "old_access_eyebrow_returned");
assert(!accessSource.includes(removedAccessOverline), "old_access_overline_returned");
assert(serverSource.includes('url.pathname === "/api/survey/unlock"'), "survey_unlock_route_missing");
assert(serverSource.includes('"HttpOnly"') && serverSource.includes('"SameSite=Strict"'), "survey_cookie_policy_missing");
assert(serverSource.includes("if (!hasSurveyAccess(req))"), "survey_write_gate_missing");

console.log(JSON.stringify({
  ok: true,
  schemaVersion: schema.currentVersion,
  questions: schema.questions.length,
  companyMatrixRows: schema.byKey.get("b3").rows.length,
  productMatrixRows: schema.byKey.get("b6").rows.length,
}));
