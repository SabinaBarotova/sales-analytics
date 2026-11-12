"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_DIR = path.resolve(process.env.DATA_DIR || "/data/responses");
const TEST_BATCH = "analytics-demo-v2";
const TOTAL = 50;
let seed = 0x5ca1a203;

function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000;
}

function integer(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function weighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return String(item.value);
  }
  return String(items.at(-1).value);
}

function sample(values, min, max) {
  const pool = values.map(String);
  const count = Math.min(pool.length, integer(min, Math.min(max, pool.length)));
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [pool[index], pool[next]] = [pool[next], pool[index]];
  }
  return pool.slice(0, count);
}

function maybe(probability) {
  return random() < probability;
}

function dateFor(index) {
  const now = Date.now();
  const daysAgo = Math.round((index / (TOTAL - 1)) * 48 + random() * 3);
  const created = new Date(now - daysAgo * 86400000 - integer(0, 18) * 3600000);
  const updated = new Date(created.getTime() + integer(4, 48) * 60000);
  return { createdAt: created.toISOString(), updatedAt: updated.toISOString() };
}

function rating(center = 4) {
  const profiles = center >= 4
    ? [{ value: 2, weight: 5 }, { value: 3, weight: 24 }, { value: 4, weight: 44 }, { value: 5, weight: 24 }, { value: 99, weight: 3 }]
    : [{ value: 1, weight: 7 }, { value: 2, weight: 22 }, { value: 3, weight: 40 }, { value: 4, weight: 25 }, { value: 5, weight: 4 }, { value: 99, weight: 2 }];
  return weighted(profiles);
}

function makeCompleteAnswers(index) {
  const answers = {};
  answers.a0 = weighted([{ value: 1, weight: 42 }, { value: 2, weight: 34 }, { value: 3, weight: 24 }]);
  answers.a1 = weighted([{ value: 1, weight: 48 }, { value: 2, weight: 35 }, { value: 3, weight: 13 }, { value: 4, weight: 4 }]);
  if (answers.a1 === "4") answers.a1_other = index % 2 ? "Проектный офис" : "Сервисное направление";
  answers.a2 = weighted([
    { value: 1, weight: 24 }, { value: 2, weight: 32 }, { value: 3, weight: 25 },
    { value: 4, weight: 13 }, { value: 5, weight: 6 },
  ]);
  answers.a3 = sample(["1", "2", "3", "4", "5"], 1, 3);
  if (maybe(0.12)) {
    answers.a3.push("98");
    answers.a3_other = index % 2 ? "Телеком" : "Энергетика";
  }

  answers.a4 = sample(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"], 2, 5);
  for (const role of answers.a4) {
    answers[`a5_${role}`] = weighted([
      { value: 1, weight: 22 }, { value: 2, weight: 38 }, { value: 3, weight: 29 }, { value: 4, weight: 11 },
    ]);
  }

  answers.a7 = sample(Array.from({ length: 15 }, (_, offset) => String(offset + 1)), 4, 7);
  if (maybe(0.08)) {
    answers.a7.push("98");
    answers.a7_other = "Условия финансирования";
  }
  answers.a8 = sample(answers.a7, 1, Math.min(3, answers.a7.length));

  answers.b1 = weighted([
    { value: 1, weight: 5 }, { value: 2, weight: 18 }, { value: 3, weight: 26 },
    { value: 4, weight: 34 }, { value: 5, weight: 13 }, { value: 99, weight: 4 },
  ]);
  if (["1", "2", "3", "4"].includes(answers.b1)) answers.b2 = sample(answers.a4, 1, Math.min(3, answers.a4.length));
  if (["2", "3", "4", "5"].includes(answers.b1)) answers.b22 = sample(answers.a4, 1, Math.min(3, answers.a4.length));
  for (let criterion = 1; criterion <= 9; criterion += 1) answers[`b3_${criterion}`] = rating(criterion === 5 || criterion === 7 ? 3 : 4);

  answers.b4 = weighted([
    { value: 1, weight: 4 }, { value: 2, weight: 20 }, { value: 3, weight: 29 },
    { value: 4, weight: 31 }, { value: 5, weight: 12 }, { value: 99, weight: 4 },
  ]);
  if (["1", "2", "3", "4"].includes(answers.b4)) answers.b5 = sample(answers.a4, 1, Math.min(3, answers.a4.length));
  if (["2", "3", "4", "5"].includes(answers.b4)) answers.b55 = sample(answers.a4, 1, Math.min(3, answers.a4.length));
  for (let criterion = 1; criterion <= 8; criterion += 1) answers[`b6_${criterion}`] = rating(criterion === 6 || criterion === 8 ? 3 : 4);

  if (["1", "2", "3", "4"].includes(answers.b1) || ["1", "2", "3", "4"].includes(answers.b4)) {
    const distrust = [
      "Недостаточно публичных кейсов с измеримыми результатами и отзывами заказчиков.",
      "Клиентам не всегда понятны отличия от конкурентов и совокупная стоимость владения.",
      "Есть вопросы к срокам поставки, сложности внедрения и доступности технической поддержки.",
      "Не хватает подтверждений надёжности, совместимости и соответствия требованиям регуляторов.",
    ];
    const trustIdeas = [
      "Показывать отраслевые кейсы, экономический эффект, сертификаты и отзывы действующих заказчиков.",
      "Чаще проводить пилоты и технические демонстрации для команды клиента.",
      "Давать прозрачное сравнение с конкурентами, дорожную карту продукта и SLA поддержки.",
      "Усилить публичность экспертов и дать клиентам возможность общаться с референсными заказчиками.",
    ];
    answers.b7 = distrust[index % distrust.length];
    answers.b8 = trustIdeas[index % trustIdeas.length];
  }

  const ownSources = [
    "CNews, TAdviser, РБК, Хабр, Код ИБ, Telegram-каналы по инфраструктуре и информационной безопасности.",
    "Коммерсантъ, Ведомости, SecurityLab, Anti-Malware.ru, отраслевые Telegram-каналы и подкасты.",
    "Хабр, IT-World, CNews, профильные сообщества, YouTube-каналы вендоров и вебинары экспертов.",
  ];
  const clientSources = [
    "CNews, TAdviser, РБК, Хабр, отраслевые Telegram-каналы и рекомендации коллег по рынку.",
    "Ведомости, Коммерсантъ, SecurityLab, профессиональные сообщества и материалы регуляторов.",
    "ИТ-СМИ, независимые обзоры, кейсы поставщиков, конференции и закрытые отраслевые сообщества.",
  ];
  answers.c1 = ownSources[index % ownSources.length];
  answers.c2 = clientSources[index % clientSources.length];
  answers.c3 = sample(["1", "2", "3", "4", "5", "98"], 1, 4);
  if (maybe(0.1)) {
    answers.c3.push("99");
    answers.c3_other = "Закрытые встречи ИТ-директоров";
  }
  if (maybe(0.35)) {
    const notes = [
      "Клиентам важно видеть не только характеристики, но и экономический эффект внедрения.",
      "Хорошо работают живые референсы и возможность поговорить с действующим заказчиком.",
      "Нужны короткие материалы для руководителей и отдельные технические разборы для команды.",
    ];
    answers.c4 = notes[index % notes.length];
  }
  return answers;
}

function keepKeysThrough(answers, stage) {
  const allowed = new Set(["a", "b", "c"].slice(0, ["a", "b", "c"].indexOf(stage) + 1));
  for (const key of Object.keys(answers)) if (!allowed.has(key[0])) delete answers[key];
}

async function writeRecord(record) {
  const filePath = path.join(DATA_DIR, `${record.id}.json`);
  let existing = null;
  try {
    existing = JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (existing && !(existing.isTest || String(existing.id || "").startsWith("test-"))) {
    throw new Error(`refusing_to_replace_real_response:${record.id}`);
  }
  const tempPath = path.join(DATA_DIR, `.${record.id}.${Date.now()}.tmp`);
  await fs.writeFile(tempPath, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await fs.rename(tempPath, filePath);
  await fs.chmod(filePath, 0o600);
  return existing ? "replaced" : "created";
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
  let created = 0;
  let replaced = 0;

  for (let index = 1; index <= TOTAL; index += 1) {
    const id = `test-reputation-analytics-${String(index).padStart(3, "0")}`;
    const dates = dateFor(index);
    let status = "completed";
    let answers = makeCompleteAnswers(index);

    if (index >= 45 && index <= 48) {
      status = "in_progress";
      keepKeysThrough(answers, index <= 46 ? "a" : "b");
    }
    if (index >= 49) {
      status = "screened_out";
      answers = { a0: answers.a0, a1: answers.a1, a2: "97" };
    }

    const result = await writeRecord({
      schemaVersion: 2,
      id,
      createdAt: dates.createdAt,
      updatedAt: dates.updatedAt,
      revision: Object.keys(answers).length + integer(4, 12),
      status,
      answers,
      isTest: true,
      testBatch: TEST_BATCH,
    });
    if (result === "created") created += 1;
    else replaced += 1;
  }

  console.log(JSON.stringify({ ok: true, batch: TEST_BATCH, requested: TOTAL, created, replaced }));
}

main().catch((error) => {
  console.error("seed_failed", error);
  process.exit(1);
});
