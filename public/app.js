(() => {
  "use strict";

  const SCHEMA_VERSION = 2;
  const STATIC_DEMO = window.__GITHUB_PAGES__ === true;
  const STORAGE_KEY = `reputation-survey:state:v${SCHEMA_VERSION}`;
  const SAVE_TIMEOUT_MS = 12000;
  const app = document.getElementById("app");
  const progressWrap = document.getElementById("progress-wrap");
  const progressBar = document.getElementById("progress-bar");
  const progressValue = document.getElementById("progress-value");
  const stepLabel = document.getElementById("step-label");
  const progressTrack = document.getElementById("progress-track");
  const saveStatus = document.getElementById("save-status");
  const railIndex = document.getElementById("rail-index");
  const railTitle = document.getElementById("rail-title");

  const option = (value, label, extras = {}) => ({ value: String(value), label, ...extras });

  const brands = [
    option(1, "Скала^р"),
    option(2, "Rubytech"),
    option(3, "В равной степени с обоими"),
  ];

  const departments = [
    option(1, "Дивизион ключевых заказчиков"),
    option(2, "Дивизион по развитию бизнеса"),
    option(3, "Проектная группа внутри заказчика"),
    option(4, "Другое", { other: true }),
  ];

  const clientFrequency = [
    option(1, "Каждый или почти каждый рабочий день"),
    option(2, "Несколько раз в неделю"),
    option(3, "Несколько раз в месяц"),
    option(4, "Несколько раз в квартал"),
    option(5, "Реже одного раза в квартал"),
    option(97, "Не общаюсь напрямую с клиентами", { exclusive: true }),
  ];

  const industries = [
    option(1, "Банки, финансовый сектор, страхование"),
    option(2, "Розничная торговля"),
    option(3, "Госсектор"),
    option(4, "Промышленность"),
    option(5, "Транспорт, логистика"),
    option(98, "Другое", { other: true }),
  ];

  const roles = [
    option(1, "Генеральный директор"),
    option(2, "ИТ-директор / руководитель ИТ-отдела"),
    option(3, "Директор / руководитель отдела информационной безопасности"),
    option(4, "Руководитель отдела закупок"),
    option(5, "Другая управленческая должность"),
    option(6, "Системный администратор"),
    option(7, "Специалист по информационной безопасности"),
    option(8, "DevOps-специалист"),
    option(9, "Другой специалист ИТ-отдела"),
    option(10, "Специалист по закупкам"),
    option(11, "Юрист"),
    option(98, "Другое", { other: true }),
  ];

  const contactFrequency = [
    option(1, "Примерно раз в две недели"),
    option(2, "Раз в 1–2 месяца"),
    option(3, "Раз в полгода"),
    option(4, "Реже, чем раз в полгода"),
  ];

  const supplierFactors = [
    option(1, "Надежность компании как поставщика"),
    option(2, "Репутация компании на рынке"),
    option(3, "Наличие успешных кейсов"),
    option(4, "Соответствие требованиям информационной безопасности"),
    option(5, "Соответствие регуляторным требованиям / наличие сертификатов"),
    option(6, "Совместимость с текущей инфраструктурой клиента"),
    option(7, "Стоимость закупки"),
    option(8, "Сроки предоставления услуг"),
    option(9, "Качество технической поддержки"),
    option(10, "Возможность пилота / тестирования решения"),
    option(11, "Рекомендации коллег по рынку"),
    option(12, "Независимые рейтинги и аналитические обзоры"),
    option(13, "Совокупная стоимость владения (TCO)"),
    option(14, "Технические особенности продукта"),
    option(15, "Личный опыт взаимодействия / профессиональная экспертиза"),
    option(98, "Другое", { other: true }),
    option(99, "Затрудняюсь ответить", { exclusive: true }),
  ];

  const sentiment = [
    option(1, "Только негативные"),
    option(2, "Больше негативные"),
    option(3, "В равном количестве негативные и позитивные"),
    option(4, "Больше позитивные"),
    option(5, "Только позитивные"),
    option(99, "Затрудняюсь ответить / не получал отзывы"),
  ];

  const ratingScale = [
    option(1, "Негативно"),
    option(2, "Скорее негативно"),
    option(3, "Нейтрально"),
    option(4, "Скорее позитивно"),
    option(5, "Позитивно"),
    option(99, "Не знаю"),
  ];

  const companyRatingCriteria = [
    option(1, "Известность на рынке"),
    option(2, "Технологическая экспертиза"),
    option(3, "Финансовая устойчивость компании"),
    option(4, "Качество технической поддержки"),
    option(5, "Количество публичных кейсов внедрений"),
    option(6, "Соблюдение сроков поставки"),
    option(7, "Отзывы от коллег / в СМИ"),
    option(8, "Соответствие регуляторным требованиям"),
    option(9, "Репутация компании / руководства"),
  ];

  const productRatingCriteria = [
    option(1, "Известность продукта"),
    option(2, "Совместимость с текущей инфраструктурой клиента"),
    option(3, "Безопасность решения"),
    option(4, "Надежность и отсутствие сбоев в работе"),
    option(5, "Количество публичных кейсов внедрений"),
    option(6, "Уровень сложности внедрения или эксплуатации"),
    option(7, "Функциональность по сравнению с конкурентами"),
    option(8, "Стоимость"),
  ];

  const eventFormats = [
    option(1, "Отраслевые конференции ведомств (ЦИПР, «Цифровые решения», Уральский форум и др.)"),
    option(2, "Собственные мероприятия ведущих игроков рынка (Postgres Conf, ИТ/Ритм и др.)"),
    option(3, "Форумы и конференции федерального значения (ПМЭФ, ЦИПР, Дальневосточный экономический форум)"),
    option(4, "Онлайн-конференции / форумы"),
    option(5, "Семинары и воркшопы"),
    option(98, "Вебинары"),
    option(99, "Другое", { other: true }),
  ];

  const hasNegativeFeedback = (key) => ["1", "2", "3", "4"].includes(answer(key));
  const hasPositiveFeedback = (key) => ["2", "3", "4", "5"].includes(answer(key));

  function hashString(value) {
    let hash = 2166136261;
    for (const character of String(value)) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function shuffled(items, salt) {
    const copy = [...items];
    let seed = hashString(`${state?.id || "survey"}:${salt}`);
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const next = Math.floor(random() * (index + 1));
      [copy[index], copy[next]] = [copy[next], copy[index]];
    }
    return copy;
  }

  function rotateExcept(options, fixedValues, salt) {
    const fixed = new Set(fixedValues.map(String));
    return [...shuffled(options.filter((item) => !fixed.has(item.value)), salt), ...options.filter((item) => fixed.has(item.value))];
  }

  function rotatedRoles(salt) {
    const byValue = (value) => roles.find((item) => item.value === String(value));
    return [
      ...shuffled([1, 2, 3, 4].map(byValue), `${salt}:leaders`),
      byValue(5),
      ...shuffled([6, 7, 8].map(byValue), `${salt}:specialists`),
      byValue(9),
      ...shuffled([10, 11].map(byValue), `${salt}:other-specialists`),
      byValue(98),
    ];
  }

  const ALL_STEPS = [
    { id: "welcome", type: "welcome" },
    {
      id: "a0",
      type: "single",
      code: "A0",
      key: "a0",
      question: "С каким брендом вы в основном работаете?",
      options: brands,
    },
    {
      id: "a1",
      type: "single",
      code: "A1",
      key: "a1",
      question: "В каком отделе вы работаете?",
      options: departments,
    },
    {
      id: "a2",
      type: "single",
      code: "A2",
      key: "a2",
      question: "Как часто вы напрямую взаимодействуете с клиентами / представителями клиентов?",
      options: clientFrequency,
    },
    {
      id: "screened",
      type: "screened",
      visible: () => answer("a2") === "97",
    },
    {
      id: "a3",
      type: "multi",
      code: "A3",
      key: "a3",
      question: "С клиентами / представителями клиентов из каких отраслей вы обычно работаете?",
      help: "Можно выбрать несколько вариантов.",
      dynamicOptions: () => rotateExcept(industries, [98], "a3"),
    },
    {
      id: "a4",
      type: "multi",
      code: "A4",
      key: "a4",
      question: "С представителями каких должностей со стороны клиента вы контактируете в своей работе?",
      help: "Можно выбрать несколько вариантов.",
      dynamicOptions: () => rotatedRoles("a4"),
    },
    {
      id: "a5",
      type: "matrix",
      code: "A5",
      key: "a5",
      sourceKey: "a4",
      rowOptions: roles,
      question: "Как часто за последние 6 месяцев вы контактировали с этими специалистами со стороны клиента?",
      help: "Дайте один ответ для каждой выбранной должности.",
      options: contactFrequency,
    },
    {
      id: "a7",
      type: "multi",
      code: "A7",
      key: "a7",
      question: "Как вы думаете, на какие факторы опираются клиенты, когда выбирают поставщика инфраструктуры?",
      help: "Можно выбрать несколько вариантов.",
      dynamicOptions: () => rotateExcept(supplierFactors, [98, 99], "a7"),
    },
    {
      id: "a8",
      type: "multi",
      code: "A8",
      key: "a8",
      question: "А какие факторы являются самыми ключевыми?",
      help: "Выберите не более трех из отмеченных в предыдущем вопросе.",
      max: 3,
      sourceKey: "a7",
      dynamicOptions: () => selectedOptions("a7", supplierFactors),
    },
    {
      id: "b-intro",
      type: "section",
      eyebrow: "Блок B",
      title: "Восприятие клиента",
      text: "Переходим к блоку вопросов об отношении клиентов к Группе Rubytech и ее продуктам. Отвечайте, опираясь на ваш опыт взаимодействия с действующими или потенциальными клиентами и их представителями, а также на обратную связь, которую вы получали от них.",
      icon: "dialog",
    },
    {
      id: "b1",
      type: "single",
      code: "B1",
      key: "b1",
      question: "Какие отзывы вы получали / слышали в целом о Группе Rubytech со стороны клиентов / представителей клиентов за последний год?",
      options: sentiment,
    },
    {
      id: "b2",
      type: "multi",
      code: "B2",
      key: "b2",
      question: "От каких специалистов со стороны клиента обычно поступают негативные отзывы о Группе Rubytech?",
      help: "Можно выбрать несколько вариантов.",
      dynamicOptions: () => rotatedRoles("b2"),
      visible: () => hasNegativeFeedback("b1"),
    },
    {
      id: "b22",
      type: "multi",
      code: "B22",
      key: "b22",
      question: "От каких специалистов со стороны клиента обычно поступают позитивные отзывы о Группе Rubytech?",
      help: "Можно выбрать несколько вариантов.",
      dynamicOptions: () => rotatedRoles("b22"),
      visible: () => hasPositiveFeedback("b1"),
    },
    {
      id: "b3",
      type: "matrix",
      code: "B3",
      key: "b3",
      rows: companyRatingCriteria,
      rowOptions: companyRatingCriteria,
      question: "Как клиенты / представители клиентов оценивают Группу Rubytech по следующим параметрам?",
      help: "Оцените каждый параметр по пятибалльной шкале или выберите «Не знаю».",
      options: ratingScale,
    },
    {
      id: "b4",
      type: "single",
      code: "B4",
      key: "b4",
      question: "Какие отзывы вы получали / слышали в целом о продукте Скала^р со стороны клиентов / представителей клиентов за последний год?",
      options: sentiment,
    },
    {
      id: "b5",
      type: "multi",
      code: "B5",
      key: "b5",
      question: "От каких специалистов со стороны клиента обычно поступают негативные отзывы о продукте Скала^р?",
      help: "Можно выбрать несколько вариантов.",
      dynamicOptions: () => rotatedRoles("b5"),
      visible: () => hasNegativeFeedback("b4"),
    },
    {
      id: "b55",
      type: "multi",
      code: "B55",
      key: "b55",
      question: "От каких специалистов со стороны клиента обычно поступают позитивные отзывы о продукте Скала^р?",
      help: "Можно выбрать несколько вариантов.",
      dynamicOptions: () => rotatedRoles("b55"),
      visible: () => hasPositiveFeedback("b4"),
    },
    {
      id: "b6",
      type: "matrix",
      code: "B6",
      key: "b6",
      rows: productRatingCriteria,
      rowOptions: productRatingCriteria,
      question: "Как клиенты / представители клиентов оценивают продукт Скала^р по следующим параметрам?",
      help: "Оцените каждый параметр по пятибалльной шкале или выберите «Не знаю».",
      options: ratingScale,
    },
    {
      id: "b7",
      type: "text",
      code: "B7",
      key: "b7",
      question: "Что, по вашему мнению, вызывает недоверие клиентов к Группе Rubytech и продуктам Скала^р?",
      placeholder: "Перечислите возможные причины недоверия клиентов",
      visible: () => hasNegativeFeedback("b1") || hasNegativeFeedback("b4"),
    },
    {
      id: "b8",
      type: "text",
      code: "B8",
      key: "b8",
      question: "Что, по вашему мнению, могло бы снизить недоверие клиентов к Группе Rubytech и продуктам Скала^р?",
      placeholder: "Опишите ваши наблюдения и предложения…",
      visible: () => hasNegativeFeedback("b1") || hasNegativeFeedback("b4"),
    },
    {
      id: "c-intro",
      type: "section",
      eyebrow: "Блок C",
      title: "Медиапотребление",
      text: "В последнем блоке вопросов поговорим о медиаконтенте и обучающих материалах, которые интересны лично вам и могут быть интересны клиенту.",
      icon: "compass",
    },
    {
      id: "c1",
      type: "text",
      code: "C1",
      key: "c1",
      question: "Какими профессиональными источниками информации вы пользуетесь для получения отраслевых новостей и экспертных материалов? Укажите конкретные названия печатных и онлайн-СМИ, порталов, профессиональных сообществ, Telegram- и YouTube-каналов, подкастов.",
      placeholder: "Перечислите конкретные названия источников…",
    },
    {
      id: "c2",
      type: "text",
      code: "C2",
      key: "c2",
      question: "Какими профессиональными источниками информации пользуются ваши клиенты для получения отраслевых новостей и экспертных материалов? Укажите конкретные названия печатных и онлайн-СМИ, порталов, профессиональных сообществ, Telegram- и YouTube-каналов, подкастов.",
      placeholder: "Перечислите конкретные названия источников клиентов…",
    },
    {
      id: "c3",
      type: "multi",
      code: "C3",
      key: "c3",
      question: "Какие форматы профессиональных мероприятий посещают ваши клиенты?",
      help: "Можно выбрать несколько вариантов.",
      dynamicOptions: () => rotateExcept(eventFormats, [98, 99], "c3"),
    },
    {
      id: "c4",
      type: "text",
      code: "C4",
      key: "c4",
      question: "Есть ли другие наблюдения о восприятии нашей компании, которыми вы хотите поделиться?",
      placeholder: "Необязательное поле для дополнительных наблюдений…",
      optional: true,
    },
    { id: "finish", type: "finish" },
  ];

  const STEP_INDEX = new Map(ALL_STEPS.map((step) => [step.id, step]));
  let state = loadState();
  let validationMessage = "";
  let textSaveTimer = null;
  let retryTimer = null;
  let saveChain = Promise.resolve();

  function createResponseId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    const random = new Uint32Array(4);
    window.crypto.getRandomValues(random);
    return Array.from(random, (part) => part.toString(36)).join("-");
  }

  function blankState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      id: createResponseId(),
      answers: {},
      revision: 0,
      status: "in_progress",
      currentStepId: "welcome",
      lastSavedRevision: -1,
    };
  }

  function loadState() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (
        stored &&
        typeof stored.id === "string" &&
        stored.id.length >= 20 &&
        stored.answers &&
        typeof stored.answers === "object" &&
        !Array.isArray(stored.answers)
      ) {
        return {
          schemaVersion: SCHEMA_VERSION,
          id: stored.id,
          answers: stored.answers,
          revision: Number.isSafeInteger(stored.revision) ? stored.revision : 0,
          status: ["in_progress", "completed", "screened_out"].includes(stored.status)
            ? stored.status
            : "in_progress",
          currentStepId: typeof stored.currentStepId === "string" ? stored.currentStepId : "welcome",
          lastSavedRevision: Number.isSafeInteger(stored.lastSavedRevision)
            ? stored.lastSavedRevision
            : -1,
        };
      }
    } catch {
      // A corrupt browser draft should not prevent a new anonymous response.
    }
    return blankState();
  }

  function stashLocal() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Server save remains available even when browser storage is unavailable.
    }
  }

  function answer(key) {
    const value = state.answers[key];
    return typeof value === "string" ? value : "";
  }

  function answerArray(key) {
    const value = state.answers[key];
    return Array.isArray(value) ? value.map(String) : [];
  }

  function textAnswer(key) {
    const value = state.answers[key];
    return typeof value === "string" ? value : "";
  }

  function selectedOptions(key, options) {
    const values = answerArray(key);
    return options.filter((item) => values.includes(item.value));
  }

  function getSteps() {
    if (answer("a2") === "97") {
      return ALL_STEPS.filter((step) => ["welcome", "a0", "a1", "a2", "screened"].includes(step.id));
    }
    return ALL_STEPS.filter((step) => !step.visible || step.visible());
  }

  function getCurrentStep() {
    const steps = getSteps();
    let step = steps.find((item) => item.id === state.currentStepId);
    if (!step) {
      step = steps[0];
      state.currentStepId = step.id;
      stashLocal();
    }
    return step;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setSaveStatus(kind, label) {
    saveStatus.dataset.state = kind;
    if (kind === "offline" || kind === "error") {
      saveStatus.dataset.hadIssue = "true";
      saveStatus.textContent = label;
      return;
    }
    if (kind === "saved" && saveStatus.dataset.hadIssue === "true") {
      delete saveStatus.dataset.hadIssue;
      saveStatus.textContent = label;
      return;
    }
    saveStatus.textContent = "";
  }

  function snapshot() {
    return {
      schemaVersion: SCHEMA_VERSION,
      revision: state.revision,
      status: state.status,
      answers: JSON.parse(JSON.stringify(state.answers)),
    };
  }

  function responseUrl() {
    return `api/responses/${encodeURIComponent(state.id)}`;
  }

  async function sendPayload(payload) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), SAVE_TIMEOUT_MS);
    try {
      return await fetch(responseUrl(), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function scheduleRetry() {
    window.clearTimeout(retryTimer);
    retryTimer = window.setTimeout(() => {
      if (navigator.onLine && state.lastSavedRevision < state.revision) {
        saveNow();
      }
    }, 3500);
  }

  function saveNow() {
    window.clearTimeout(textSaveTimer);
    stashLocal();

    if (STATIC_DEMO) {
      state.lastSavedRevision = state.revision;
      stashLocal();
      setSaveStatus("saved", "Ответ сохранён в браузере");
      return;
    }

    if (!navigator.onLine) {
      setSaveStatus("offline", "Нет связи — ответ сохранён на устройстве");
      return;
    }

    const payload = snapshot();
    setSaveStatus("saving", "Сохраняем ответ…");
    saveChain = saveChain
      .catch(() => undefined)
      .then(async () => {
        const response = await sendPayload(payload);
        if (response.status === 401) {
          window.location.reload();
          throw new Error("survey_access_required");
        }
        if (!response.ok) throw new Error(`save_failed_${response.status}`);
        const result = await response.json();
        if (Number(result.revision) >= state.lastSavedRevision) {
          state.lastSavedRevision = Number(result.revision);
          stashLocal();
        }
        if (state.lastSavedRevision >= state.revision) {
          setSaveStatus("saved", "Ответ сохранён на сервере");
        }
      })
      .catch(() => {
        setSaveStatus("error", "Сохраним автоматически, когда связь восстановится");
        scheduleRetry();
      });
  }

  function saveTextSoon() {
    stashLocal();
    window.clearTimeout(textSaveTimer);
    textSaveTimer = window.setTimeout(saveNow, 450);
  }

  function flushBeforeLeaving() {
    window.clearTimeout(textSaveTimer);
    stashLocal();
    if (STATIC_DEMO || !navigator.onLine || state.lastSavedRevision >= state.revision) return;
    const payload = snapshot();
    fetch(responseUrl(), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  }

  function bumpRevision() {
    state.revision += 1;
    stashLocal();
  }

  function clearAnswer(key) {
    if (Object.hasOwn(state.answers, key)) {
      delete state.answers[key];
      return true;
    }
    return false;
  }

  function clearStartsWith(prefix, allowedSuffixes = null) {
    let changed = false;
    Object.keys(state.answers).forEach((key) => {
      if (!key.startsWith(prefix)) return;
      const suffix = key.slice(prefix.length);
      if (!allowedSuffixes || !allowedSuffixes.includes(suffix)) {
        delete state.answers[key];
        changed = true;
      }
    });
    return changed;
  }

  function normalizeAnswers() {
    const clearUnless = (condition, keys) => {
      if (!condition) keys.forEach(clearAnswer);
    };
    const clearOther = (choiceKey, code, inputKey) => {
      if (!answerArray(choiceKey).includes(String(code)) && answer(choiceKey) !== String(code)) clearAnswer(inputKey);
    };

    clearOther("a1", "4", "a1_other");
    clearOther("a3", "98", "a3_other");
    clearOther("a4", "98", "a4_other");
    clearOther("a7", "98", "a7_other");
    clearOther("b2", "98", "b2_other");
    clearOther("b22", "98", "b22_other");
    clearOther("b5", "98", "b5_other");
    clearOther("b55", "98", "b55_other");
    clearOther("c3", "99", "c3_other");

    const a4Values = answerArray("a4");
    clearStartsWith("a5_", a4Values);

    const a7Values = answerArray("a7");
    if (a7Values.length === 1) {
      state.answers.a8 = [...a7Values];
    } else {
      const filtered = answerArray("a8").filter((value) => a7Values.includes(value));
      if (filtered.length) state.answers.a8 = filtered;
      else clearAnswer("a8");
    }
    clearOther("a8", "98", "a8_other");

    clearUnless(hasNegativeFeedback("b1"), ["b2", "b2_other"]);
    clearUnless(hasPositiveFeedback("b1"), ["b22", "b22_other"]);
    clearUnless(hasNegativeFeedback("b4"), ["b5", "b5_other"]);
    clearUnless(hasPositiveFeedback("b4"), ["b55", "b55_other"]);
    clearUnless(hasNegativeFeedback("b1") || hasNegativeFeedback("b4"), ["b7", "b8"]);

    clearStartsWith("b3_", companyRatingCriteria.map((item) => item.value));
    clearStartsWith("b6_", productRatingCriteria.map((item) => item.value));
  }

  function otherInputKey(step) {
    return `${step.key}_other`;
  }

  function getOptions(step) {
    return typeof step.dynamicOptions === "function" ? step.dynamicOptions() : step.options || [];
  }

  function optionListNeedsRender(options, before, after) {
    const valuesThatChangeTheLayout = new Set(
      options.filter((item) => item.other || item.exclusive).map((item) => item.value)
    );
    return [...before, ...after].some((value) => valuesThatChangeTheLayout.has(value));
  }

  function validationAttributes() {
    return `aria-describedby="validation-message"${validationMessage ? ' aria-invalid="true"' : ""}`;
  }

  function clearValidation() {
    validationMessage = "";
    const message = document.getElementById("validation-message");
    if (message) {
      message.textContent = "";
      message.classList.remove("is-visible");
    }
    app.querySelectorAll('[aria-invalid="true"]').forEach((element) => {
      element.removeAttribute("aria-invalid");
    });
  }

  function focusAnswerControl(key, value) {
    window.requestAnimationFrame(() => {
      const step = STEP_INDEX.get(key);
      const selected = step ? getOptions(step).find((item) => item.value === String(value)) : null;
      let target = null;

      if (step && selected?.other) {
        const textKey = otherInputKey(step);
        target = Array.from(app.querySelectorAll("[data-text-key]"))
          .find((element) => element.dataset.textKey === textKey);
      }

      if (!target) {
        target = Array.from(app.querySelectorAll("[data-answer-key]"))
          .find((element) => element.dataset.answerKey === key && element.value === String(value));
      }

      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
    });
  }

  function focusStepHeading() {
    window.requestAnimationFrame(() => {
      const heading = app.querySelector("h1, h2");
      if (!(heading instanceof HTMLElement)) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    });
  }

  function focusFirstControl() {
    window.requestAnimationFrame(() => {
      const control = app.querySelector("input, textarea");
      if (control instanceof HTMLElement) control.focus({ preventScroll: true });
    });
  }

  function scrollToStart() {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function optionLabelForRow(step, value) {
    const raw = (step.rowOptions || []).find((item) => item.value === value);
    if (!raw) return value;
    if (raw.other) {
      const sourceStep = STEP_INDEX.get(step.sourceKey);
      const custom = sourceStep ? textAnswer(otherInputKey(sourceStep)).trim() : "";
      return custom ? `Другое: ${custom}` : raw.label;
    }
    return raw.label;
  }

  function matrixRows(step) {
    const values = step.sourceKey
      ? answerArray(step.sourceKey)
      : (step.rows || step.rowOptions || []).map((item) => item.value);
    return values.filter((value) => !step.excludeRows?.includes(value));
  }

  function renderOptionList(step, inputType) {
    const options = getOptions(step);
    const currentSingle = answer(step.key);
    const currentMany = answerArray(step.key);
    const isMulti = inputType === "checkbox";
    const other = options.find((item) => item.other);

    const cards = options
      .map((item, index) => {
        const checked = isMulti ? currentMany.includes(item.value) : currentSingle === item.value;
        return `
          <label class="option-card" style="--option-index:${index}">
            <input
              type="${inputType}"
              name="${escapeHtml(step.key)}"
              value="${escapeHtml(item.value)}"
              ${checked ? "checked" : ""}
              data-step-id="${escapeHtml(step.id)}"
              data-answer-key="${escapeHtml(step.key)}"
              ${isMulti ? 'data-kind="multi"' : 'data-kind="single"'}
            />
            <span class="option-card__label">${escapeHtml(item.label)}</span>
            <span class="option-check" aria-hidden="true">✓</span>
          </label>`;
      })
      .join("");

    const isOtherSelected = other && (isMulti ? currentMany.includes(other.value) : currentSingle === other.value);
    const otherField = isOtherSelected
      ? `
        <label class="other-input-wrap">
          <span class="sr-only">Свой вариант ответа</span>
          <input
            class="text-input"
            type="text"
            maxlength="500"
            value="${escapeHtml(textAnswer(otherInputKey(step)))}"
            placeholder="Укажите, что именно"
            data-text-key="${escapeHtml(otherInputKey(step))}"
            ${validationAttributes()}
            autocomplete="off"
          />
        </label>`
      : "";

    return `<fieldset class="option-list" ${validationAttributes()}><legend class="sr-only">${escapeHtml(step.question)}</legend>${cards}</fieldset>${otherField}`;
  }

  function renderMatrix(step) {
    const rows = matrixRows(step)
      .map((rowValue, rowIndex) => {
        const key = `${step.key}_${rowValue}`;
        const current = answer(key);
        const controls = step.options
          .map(
            (item) => `
              <label class="matrix-option">
                <input
                  type="radio"
                  name="${escapeHtml(key)}"
                  value="${escapeHtml(item.value)}"
                  ${current === item.value ? "checked" : ""}
                  data-kind="matrix"
                  data-answer-key="${escapeHtml(key)}"
                />
                <span>${escapeHtml(item.label)}</span>
              </label>`,
          )
          .join("");
        return `
          <fieldset class="matrix-row" style="--row-index:${rowIndex}" ${validationAttributes()}>
            <legend class="matrix-title">${escapeHtml(optionLabelForRow(step, rowValue))}</legend>
            <div class="matrix-options">${controls}</div>
          </fieldset>`;
      })
      .join("");
    return `<div class="matrix">${rows}</div>`;
  }

  function renderText(step) {
    return `
      <textarea
        class="text-area"
        maxlength="4000"
        data-text-key="${escapeHtml(step.key)}"
        aria-labelledby="question-title"
        ${validationAttributes()}
        placeholder="${escapeHtml(step.placeholder || "Введите ответ…") }"
      >${escapeHtml(textAnswer(step.key))}</textarea>
      <div class="limit-note"><span>${step.optional ? "Необязательное поле" : "Развернутый ответ"}</span><span>До 4 000 знаков</span></div>`;
  }

  function renderList(step) {
    const values = Array.isArray(state.answers[step.key]) ? state.answers[step.key] : [];
    const fields = Array.from({ length: 10 }, (_, index) => `
      <label class="list-field">
        <span class="list-field__number" id="list-${escapeHtml(step.key)}-${index}">${index + 1}</span>
        <input
          class="text-input"
          type="text"
          maxlength="500"
          value="${escapeHtml(typeof values[index] === "string" ? values[index] : "")}"
          placeholder="${escapeHtml(step.placeholder)}"
          data-list-key="${escapeHtml(step.key)}"
          data-list-index="${index}"
          aria-labelledby="question-title list-${escapeHtml(step.key)}-${index}"
          ${validationAttributes()}
          autocomplete="off"
        />
      </label>`,
    ).join("");
    return `<div class="list-fields" ${validationAttributes()}>${fields}</div><div class="limit-note"><span>Укажите хотя бы один источник</span><span>До 10 вариантов</span></div>`;
  }

  function arrowIcon() {
    return '<span class="button-symbol" aria-hidden="true">→</span>';
  }

  function checkIcon() {
    return '<span class="button-symbol" aria-hidden="true">✓</span>';
  }

  function renderWelcome() {
    return `
      <section class="step welcome">
        <span class="eyebrow">Исследование репутации</span>
        <h1>Уважаемый(ая) коллега!</h1>
        <p class="lead">Мы проводим внутренний опрос, чтобы лучше понять, как клиенты воспринимают нашу компанию. Просим опираться на личный опыт коммуникации с действующими и потенциальными клиентами за последний год.</p>
        <p class="lead">Опрос полностью анонимный и займёт не более 10 минут. Будем благодарны за полные ответы.</p>
        ${renderActions({ primaryLabel: "Начать опрос", primaryAction: "start", back: false })}
      </section>`;
  }

  function renderSection(step) {
    return `
      <section class="step section-screen">
        <span class="eyebrow">${escapeHtml(step.eyebrow)}</span>
        <h1>${escapeHtml(step.title)}</h1>
        <p class="lead">${escapeHtml(step.text)}</p>
        ${renderActions({ primaryLabel: "Перейти к вопросам", primaryAction: "next" })}
      </section>`;
  }

  function renderScreened() {
    const done = state.status === "screened_out";
    return `
      <section class="step complete">
        <h1>${done ? "Спасибо за ответ" : "Спасибо, вы уже помогли"}</h1>
        <p class="lead">Этот опрос предназначен для коллег, которые напрямую взаимодействуют с клиентами. Ответ зафиксирован; при нестабильной связи отправка завершится автоматически.</p>
        ${done ? "" : renderActions({ primaryLabel: "Завершить", primaryAction: "screened" })}
      </section>`;
  }

  function renderFinish() {
    const done = state.status === "completed";
    return `
      <section class="step complete">
        <h1>${done ? "Спасибо за участие!" : "Готово к отправке"}</h1>
        <p class="lead">${done ? "Ответ принят. Если в момент завершения связь была нестабильной, отправка продолжится автоматически." : "Проверьте, что всё сказано, и завершите опрос. Все введённые ответы уже зафиксированы в защищённом черновике."}</p>
        ${done ? "" : renderActions({ primaryLabel: "Завершить опрос", primaryAction: "finish", back: true })}
      </section>`;
  }

  function renderQuestion(step) {
    let control = "";
    if (step.type === "single") control = renderOptionList(step, "radio");
    if (step.type === "multi") control = renderOptionList(step, "checkbox");
    if (step.type === "matrix") control = renderMatrix(step);
    if (step.type === "text") control = renderText(step);
    if (step.type === "list") control = renderList(step);

    return `
      <section class="step question-step" aria-labelledby="question-title">
        <div class="question-code">Вопрос ${escapeHtml(step.code)}</div>
        <h2 id="question-title">${escapeHtml(step.question)}${step.optional ? "" : ' <span class="question-required" aria-label="обязательный вопрос">*</span>'}</h2>
        ${step.help ? `<p class="question-help">${escapeHtml(step.help)}</p>` : ""}
        ${control}
        <div class="validation-message${validationMessage ? " is-visible" : ""}" id="validation-message" role="alert">${escapeHtml(validationMessage)}</div>
        ${renderActions({ primaryLabel: "Продолжить", primaryAction: "next", back: true })}
      </section>`;
  }

  function renderActions({ primaryLabel, primaryAction, back = true }) {
    return `
      <div class="actions">
        ${back ? '<button class="button button-secondary" type="button" data-action="back">Назад</button>' : ""}
        <div class="actions-right">
          <button class="button button-primary" type="button" data-action="${primaryAction}">${escapeHtml(primaryLabel)}${primaryAction === "finish" || primaryAction === "screened" ? checkIcon() : arrowIcon()}</button>
        </div>
      </div>`;
  }

  function updateProgress(step) {
    const nonQuestion = new Set(["welcome", "section", "finish", "screened"]);
    const questionSteps = getSteps().filter((item) => !nonQuestion.has(item.type));
    const index = questionSteps.findIndex((item) => item.id === step.id);
    const shouldShow = index >= 0;
    progressWrap.hidden = !shouldShow;
    if (!shouldShow) return;

    const percent = questionSteps.length <= 1 ? 100 : Math.round((index / (questionSteps.length - 1)) * 100);
    progressBar.style.width = `${percent}%`;
    progressValue.textContent = `${percent}%`;
    stepLabel.textContent = `Вопрос ${step.code} · ${index + 1} из ${questionSteps.length}`;
    progressTrack.setAttribute("aria-valuenow", String(percent));
  }

  function updateRail(step) {
    let index = "00";
    let title = "Исследование репутации";

    if (step.id === "a-intro" || /^a\d/.test(step.id)) {
      index = "01";
      title = "Контекст взаимодействия";
    } else if (step.id === "b-intro" || /^b\d/.test(step.id)) {
      index = "02";
      title = "Восприятие клиентов";
    } else if (step.id === "c-intro" || /^c\d/.test(step.id)) {
      index = "03";
      title = "Медиапотребление";
    } else if (step.type === "finish" || step.type === "screened") {
      index = state.status === "completed" || state.status === "screened_out" ? "✓" : "04";
      title = state.status === "completed" || state.status === "screened_out"
        ? "Ответ принят"
        : "Завершение";
    }

    railIndex.textContent = index;
    railTitle.textContent = title;
  }

  function render(animate = true, focusHeading = false) {
    normalizeAnswers();
    const step = getCurrentStep();
    updateProgress(step);
    updateRail(step);
    app.classList.toggle("is-static-render", !animate);

    if (step.type === "welcome") app.innerHTML = renderWelcome();
    else if (step.type === "section") app.innerHTML = renderSection(step);
    else if (step.type === "screened") app.innerHTML = renderScreened();
    else if (step.type === "finish") app.innerHTML = renderFinish();
    else app.innerHTML = renderQuestion(step);

    if (focusHeading) focusStepHeading();
  }

  function validateCurrentStep() {
    const step = getCurrentStep();
    if (["welcome", "section", "finish", "screened"].includes(step.type)) return "";

    if (step.type === "single") {
      if (!answer(step.key)) return "Выберите один вариант, чтобы продолжить.";
      const selected = getOptions(step).find((item) => item.value === answer(step.key));
      if (selected?.other && !textAnswer(otherInputKey(step)).trim()) return "Укажите свой вариант ответа.";
    }

    if (step.type === "multi") {
      const values = answerArray(step.key);
      if (!values.length) return "Выберите хотя бы один вариант, чтобы продолжить.";
      if (step.max && values.length > step.max) return `Можно выбрать не более ${step.max} вариантов.`;
      const selectedOther = getOptions(step).find((item) => item.other && values.includes(item.value));
      if (selectedOther && !textAnswer(otherInputKey(step)).trim()) return "Укажите свой вариант ответа.";
    }

    if (step.type === "matrix") {
      const rows = matrixRows(step);
      if (rows.some((row) => !answer(`${step.key}_${row}`))) return "Ответьте, пожалуйста, для каждого выбранного варианта.";
    }

    if (step.type === "text" && !step.optional && !textAnswer(step.key).trim()) {
      return "Введите ответ, чтобы продолжить.";
    }

    if (step.type === "list") {
      const values = Array.isArray(state.answers[step.key]) ? state.answers[step.key] : [];
      if (!values.some((value) => typeof value === "string" && value.trim())) {
        return "Укажите хотя бы один вариант, чтобы продолжить.";
      }
    }

    return "";
  }

  function move(direction) {
    const message = direction > 0 ? validateCurrentStep() : "";
    if (message) {
      validationMessage = message;
      render(false);
      focusFirstControl();
      return;
    }

    const steps = getSteps();
    const index = steps.findIndex((step) => step.id === state.currentStepId);
    const next = steps[Math.max(0, Math.min(steps.length - 1, index + direction))];
    if (next) {
      clearValidation();
      state.currentStepId = next.id;
      stashLocal();
      render(true, true);
      scrollToStart();
    }
  }

  function setSingle(key, value, rerender = false) {
    state.answers[key] = String(value);
    normalizeAnswers();
    bumpRevision();
    clearValidation();
    if (rerender) {
      render(false);
      focusAnswerControl(key, value);
    }
    saveNow();
  }

  function setMulti(step, value, checked) {
    const key = step.key;
    const values = answerArray(key);
    const options = getOptions(step);
    const selectedOption = options.find((item) => item.value === value);
    const exclusive = options.filter((item) => item.exclusive).map((item) => item.value);
    let next;

    if (checked) {
      if (selectedOption?.exclusive) {
        next = [value];
      } else {
        next = [...values.filter((item) => !exclusive.includes(item)), value];
      }
    } else {
      next = values.filter((item) => item !== value);
    }

    next = [...new Set(next)];
    if (step.max && next.length > step.max) {
      validationMessage = `Можно выбрать не более ${step.max} вариантов.`;
      render(false);
      focusAnswerControl(key, value);
      return;
    }

    const shouldRerender = optionListNeedsRender(options, values, next);
    state.answers[key] = next;
    normalizeAnswers();
    bumpRevision();
    clearValidation();
    if (shouldRerender) {
      render(false);
      focusAnswerControl(key, value);
    }
    saveNow();
  }

  function setText(key, value) {
    state.answers[key] = value.slice(0, 4000);
    bumpRevision();
    clearValidation();
    saveTextSoon();
  }

  function setListValue(key, index, value) {
    const previous = Array.isArray(state.answers[key]) ? [...state.answers[key]] : [];
    previous[index] = value.slice(0, 500);
    state.answers[key] = previous;
    bumpRevision();
    clearValidation();
    saveTextSoon();
  }

  function startSurvey() {
    clearValidation();
    state.currentStepId = "a0";
    state.status = "in_progress";
    stashLocal();
    render(true, true);
    scrollToStart();
  }

  function complete(status) {
    state.status = status;
    bumpRevision();
    saveNow();
    render(true, true);
  }

  app.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "start") startSurvey();
    if (action === "next") move(1);
    if (action === "back") move(-1);
    if (action === "finish") complete("completed");
    if (action === "screened") complete("screened_out");
  });

  app.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const kind = input.dataset.kind;
    if (kind === "single") {
      const step = STEP_INDEX.get(input.dataset.stepId);
      const previous = answer(input.dataset.answerKey);
      const shouldRerender = step
        ? optionListNeedsRender(getOptions(step), [previous], [input.value])
        : false;
      setSingle(input.dataset.answerKey, input.value, shouldRerender);
    }
    if (kind === "multi") {
      const step = STEP_INDEX.get(input.dataset.stepId);
      if (step) setMulti(step, input.value, input.checked);
    }
    if (kind === "matrix") setSingle(input.dataset.answerKey, input.value, false);
  });

  app.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return;
    if (input.dataset.textKey) setText(input.dataset.textKey, input.value);
    if (input instanceof HTMLInputElement && input.dataset.listKey) {
      setListValue(input.dataset.listKey, Number(input.dataset.listIndex), input.value);
    }
  });

  window.addEventListener("online", () => {
    if (state.lastSavedRevision < state.revision) saveNow();
  });

  window.addEventListener("offline", () => {
    setSaveStatus("offline", "Нет связи — ответ сохранён на устройстве");
  });

  window.addEventListener("pagehide", flushBeforeLeaving);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushBeforeLeaving();
  });

  if (state.lastSavedRevision >= state.revision && state.revision > 0) {
    setSaveStatus("saved", STATIC_DEMO ? "Черновик сохранён в браузере" : "Черновик сохранён на сервере");
  } else if (state.revision > 0) {
    setSaveStatus("saving", "Восстанавливаем черновик…");
    saveNow();
  } else {
    setSaveStatus("saved", "Ответы будут сохраняться автоматически");
  }

  render();
})();
