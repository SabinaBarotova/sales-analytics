(() => {
  "use strict";

  const STATIC_DEMO = window.__GITHUB_PAGES__ === true;
  const schema = window.AnalyticsSchema;
  const statusLabels = {
    completed: "Завершён",
    in_progress: "В процессе",
    screened_out: "Завершено досрочно",
  };
  const filterIds = [
    "filter-status", "filter-brand", "filter-department", "filter-from", "filter-to",
    "filter-frequency", "filter-industry", "filter-company-negative", "filter-product-negative",
    "filter-search",
  ];

  const state = {
    records: [],
    filtered: [],
    rules: [],
    page: 1,
    pageSize: 25,
    sort: "updated_desc",
    generatedAt: "",
    sentTotal: null,
  };

  const el = (id) => document.getElementById(id);
  const activeVersion = () => 2;
  const activeQuestions = () => schema.questionsForVersion(2);
  const activeByKey = () => schema.byKeyForVersion(2);
  const questionPrompts = {
    a0: "С каким брендом вы в основном работаете?",
    a1: "В каком отделе вы работаете?",
    a2: "Как часто вы напрямую взаимодействуете с клиентами / представителями клиентов?",
    a3: "С клиентами / представителями клиентов из каких отраслей вы обычно работаете?",
    a4: "С представителями каких должностей со стороны клиента вы контактируете в своей работе?",
    a5: "Как часто за последние 6 месяцев вы контактировали с этими специалистами со стороны клиента?",
    a7: "Как вы думаете, на какие факторы опираются клиенты, когда выбирают поставщика инфраструктуры?",
    a8: "А какие факторы являются самыми ключевыми?",
    b1: "Какие отзывы вы получали / слышали в целом о Группе Rubytech со стороны клиентов / представителей клиентов за последний год?",
    b2: "От каких специалистов со стороны клиента обычно поступают негативные отзывы о Группе Rubytech?",
    b22: "От каких специалистов со стороны клиента обычно поступают позитивные отзывы о Группе Rubytech?",
    b3: "Как клиенты / представители клиентов оценивают Группу Rubytech по следующим параметрам?",
    b4: "Какие отзывы вы получали / слышали в целом о продукте Скала^р со стороны клиентов / представителей клиентов за последний год?",
    b5: "От каких специалистов со стороны клиента обычно поступают негативные отзывы о продукте Скала^р?",
    b55: "От каких специалистов со стороны клиента обычно поступают позитивные отзывы о продукте Скала^р?",
    b6: "Как клиенты / представители клиентов оценивают продукт Скала^р по следующим параметрам?",
    b7: "Что, по вашему мнению, вызывает недоверие клиентов к Группе Rubytech и продуктам Скала^р?",
    b8: "Что, по вашему мнению, могло бы снизить недоверие клиентов к Группе Rubytech и продуктам Скала^р?",
    c1: "Какими профессиональными источниками информации вы пользуетесь для получения отраслевых новостей и экспертных материалов? Укажите конкретные названия печатных и онлайн-СМИ, порталов, профессиональных сообществ, Telegram- и YouTube-каналов, подкастов.",
    c2: "Какими профессиональными источниками информации пользуются ваши клиенты для получения отраслевых новостей и экспертных материалов? Укажите конкретные названия печатных и онлайн-СМИ, порталов, профессиональных сообществ, Telegram- и YouTube-каналов, подкастов.",
    c3: "Какие форматы профессиональных мероприятий посещают ваши клиенты?",
    c4: "Есть ли другие наблюдения о восприятии нашей компании, которыми вы хотите поделиться?",
  };
  const sentimentColors = {
    "1": "#b82e47", "2": "#df7047", "3": "#b8dc3c",
    "4": "#6fae8d", "5": "#3154c8", "99": "#8695ba",
  };
  const sentimentColor = (value) => sentimentColors[String(value)] || "#8695ba";
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function plural(number, forms) {
    const mod10 = number % 10;
    const mod100 = number % 100;
    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return forms[1];
    return forms[2];
  }

  function percent(part, total) {
    return total ? Math.round((part / total) * 100) : 0;
  }

  function shortDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  }

  function shortDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(date);
  }

  function setSelectOptions(select, items, allLabel = "Все") {
    select.innerHTML = `<option value="all">${escapeHtml(allLabel)}</option>${items
      .map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`)
      .join("")}`;
  }

  function initializeExplorer() {
    el("explorer-question").innerHTML = activeQuestions()
      .map((question) => `<option value="${question.key}"${question.key === "b1" ? " selected" : ""}>${question.code} · ${escapeHtml(question.title)}</option>`)
      .join("");
  }


  function initializeSelects() {
    const collections = schema.collectionsForVersion(2);
    setSelectOptions(el("filter-brand"), collections.brands, "Любой бренд");
    setSelectOptions(el("filter-department"), collections.departments, "Любой отдел");
    setSelectOptions(el("filter-frequency"), collections.clientFrequency, "Любая частота");
    setSelectOptions(el("filter-industry"), collections.industries, "Любая отрасль");
    const sentimentOptions = collections.sentiment;
    setSelectOptions(el("filter-company-negative"), sentimentOptions, "Любой ответ");
    setSelectOptions(el("filter-product-negative"), sentimentOptions, "Любой ответ");
    initializeExplorer();
  }

  function answerValues(record, question) {
    if (!question) return [];
    if (question.type === "matrix") {
      return Object.entries(record.answers || {})
        .filter(([key, value]) => key.startsWith(question.prefix) && value !== "" && value != null)
        .map(([, value]) => String(value));
    }
    const value = record.answers?.[question.key];
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (value == null || value === "") return [];
    return [String(value)];
  }

  function recordHas(record, key, value) {
    const current = record.answers?.[key];
    if (Array.isArray(current)) return current.map(String).includes(String(value));
    return String(current ?? "") === String(value);
  }

  function sentimentMatch(value, filter, version) {
    if (filter === "all") return true;
    return String(value || "") === String(filter);
  }

  function searchableText(record) {
    const parts = [record.id, statusLabels[record.status] || record.status];
    for (const question of schema.questionsForVersion(record)) {
      parts.push(question.title);
      const values = answerValues(record, question);
      parts.push(...values);
      parts.push(...values.map((value) => schema.labelFor(question, value)));
    }
    return parts.filter((value) => value != null).join(" ").toLocaleLowerCase("ru");
  }

  function ruleMatches(record, rule) {
    const question = activeByKey().get(rule.question);
    if (!question) return true;
    const values = answerValues(record, question);
    if (rule.operator === "answered") return values.some((value) => value.trim());
    if (rule.operator === "unanswered") return !values.some((value) => value.trim());
    const needle = String(rule.value || "").toLocaleLowerCase("ru");
    if (!needle) return true;
    if (rule.operator === "has") return values.some((value) => value.toLocaleLowerCase("ru") === needle);
    if (rule.operator === "not_has") return !values.some((value) => value.toLocaleLowerCase("ru") === needle);
    if (rule.operator === "text") return values.some((value) => value.toLocaleLowerCase("ru").includes(needle));
    return true;
  }

  function applyFilters() {
    const status = el("filter-status").value;
    const brand = el("filter-brand").value;
    const department = el("filter-department").value;
    const from = el("filter-from").value;
    const to = el("filter-to").value;
    const frequency = el("filter-frequency").value;
    const industry = el("filter-industry").value;
    const companyNegative = el("filter-company-negative").value;
    const productNegative = el("filter-product-negative").value;
    const search = el("filter-search").value.trim().toLocaleLowerCase("ru");
    const rulesMode = el("rules-mode").value;

    state.filtered = state.records.filter((record) => {
      if (status !== "all" && record.status !== status) return false;
      if (brand !== "all" && !recordHas(record, "a0", brand)) return false;
      if (department !== "all" && !recordHas(record, "a1", department)) return false;
      if (frequency !== "all" && !recordHas(record, "a2", frequency)) return false;
      if (industry !== "all" && !recordHas(record, "a3", industry)) return false;
      if (!sentimentMatch(record.answers?.b1, companyNegative, 2)) return false;
      if (!sentimentMatch(record.answers?.b4, productNegative, 2)) return false;
      const created = String(record.createdAt || "").slice(0, 10);
      if (from && created < from) return false;
      if (to && created > to) return false;
      if (search && !searchableText(record).includes(search)) return false;
      if (state.rules.length) {
        const results = state.rules.map((rule) => ruleMatches(record, rule));
        if (rulesMode === "all" && !results.every(Boolean)) return false;
        if (rulesMode === "any" && !results.some(Boolean)) return false;
      }
      return true;
    });
    state.page = 1;
    syncUrl();
    renderAll();
  }

  function syncUrl() {
    const params = new URLSearchParams();
    for (const id of filterIds) {
      const control = el(id);
      const defaultValue = control.tagName === "SELECT" ? "all" : "";
      if (control.value && control.value !== defaultValue) params.set(id.replace("filter-", ""), control.value);
    }
    if (state.rules.length) params.set("rules", JSON.stringify(state.rules));
    if (el("rules-mode").value !== "all") params.set("mode", el("rules-mode").value);
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}`);
  }

  function restoreUrl() {
    const params = new URLSearchParams(location.search);
    for (const id of filterIds) {
      const control = el(id);
      const value = params.get(id.replace("filter-", ""));
      if (value != null && control.tagName === "SELECT" && [...control.options].some((option) => option.value === value)) control.value = value;
      if (value != null && control.tagName === "INPUT") control.value = value;
    }
    if (params.get("mode") === "any") el("rules-mode").value = "any";
    try {
      const parsed = JSON.parse(params.get("rules") || "[]");
      if (Array.isArray(parsed)) state.rules = parsed.slice(0, 12);
    } catch {
      state.rules = [];
    }
  }

  function completionPercent(record) {
    if (record.status === "completed") return 100;
    const questions = schema.questionsForVersion(record);
    const answered = questions.filter((question) => answerValues(record, question).length).length;
    return Math.min(96, Math.round((answered / questions.length) * 100));
  }

  function distribution(records, questionKey) {
    const question = activeByKey().get(questionKey);
    if (!question) return { items: [], base: 0 };
    const counts = new Map(question.options.map((item) => [item.value, 0]));
    let base = 0;

    for (const record of records) {
      const values = answerValues(record, question);
      if (!values.length) continue;
      base += question.type === "matrix" ? values.length : 1;
      const countableValues = question.type === "matrix" ? values : [...new Set(values)];
      for (const value of countableValues) counts.set(value, (counts.get(value) || 0) + 1);
    }

    const items = [...counts.entries()]
      .filter(([, count]) => count > 0)
      .map(([value, count]) => ({ value, label: schema.labelFor(question, value), count, pct: percent(count, base) }))
      .sort((left, right) => right.count - left.count);
    return { items, base };
  }

  function segmentPaletteIndex(type, key) {
    const normalized = String(key);
    const questionKey = type === "department" ? "a1" : type === "industry" ? "a3" : "";
    if (questionKey) {
      const question = activeByKey().get(questionKey);
      const index = (question?.options || []).findIndex((option) => String(option.value) === normalized);
      if (index >= 0) return index % 12;
    }
    if (type === "status") {
      const index = ["completed", "in_progress", "screened_out"].indexOf(normalized);
      if (index >= 0) return index;
    }
    return Array.from(normalized).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 12;
  }

  function segmentClass(type, key) {
    return `segment-${segmentPaletteIndex(type, key) + 1}`;
  }

  function barPaletteClass(questionKey, value) {
    if (questionKey === "a1") return segmentClass("department", value);
    if (questionKey === "a3") return segmentClass("industry", value);
    return "";
  }

  function renderBarChart(target, questionKey, limit = 7) {
    const { items, base } = distribution(state.filtered, questionKey);
    if (!items.length) {
      target.innerHTML = '<div class="bar-empty">Нет данных для выбранного среза</div>';
      return;
    }
    target.innerHTML = items.slice(0, limit).map((item) => {
      const paletteClass = barPaletteClass(questionKey, item.value);
      return `
      <div class="bar-row">
        <div class="bar-meta"><span title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span><strong>${item.pct}% (${item.count}/${base})</strong></div>
        <div class="bar-track"><div class="bar-fill ${paletteClass}" data-pct="${item.pct}"></div></div>
      </div>`;
    }).join("");
    target.querySelectorAll("[data-pct]").forEach((node) => node.style.setProperty("--value", node.dataset.pct));
    target.setAttribute("aria-label", `Распределение по ${base} ответам`);
  }

  function renderKpis() {
    const total = state.filtered.length;
    const completed = state.filtered.filter((record) => record.status === "completed").length;
    const validValues = ["1", "2", "3", "4", "5"];
    const negativeValues = ["1", "2"];
    const companyValues = state.filtered.map((record) => String(record.answers?.b1 || ""));
    const productValues = state.filtered.map((record) => String(record.answers?.b4 || ""));
    const companyBase = companyValues.filter((value) => validValues.includes(value)).length;
    const productBase = productValues.filter((value) => validValues.includes(value)).length;
    const companyNegative = companyValues.filter((value) => negativeValues.includes(value)).length;
    const productNegative = productValues.filter((value) => negativeValues.includes(value)).length;
    const companyUnknown = companyValues.filter((value) => value === "99").length;
    const productUnknown = productValues.filter((value) => value === "99").length;
    const companyNoAnswer = Math.max(0, total - companyBase - companyUnknown);
    const productNoAnswer = Math.max(0, total - productBase - productUnknown);

    el("kpi-total").textContent = total.toLocaleString("ru-RU");
    el("kpi-total-note").textContent = `из ${state.records.length.toLocaleString("ru-RU")} в наборе`;
    el("kpi-completed").textContent = completed.toLocaleString("ru-RU");
    el("kpi-completed-note").textContent = `${percent(completed, total)}% от среза`;
    el("kpi-company-negative").textContent = companyBase ? `${percent(companyNegative, companyBase)}%` : "—";
    el("kpi-company-negative-note").textContent = companyBase
      ? `${companyNegative}/${companyBase} валидных; ${companyUnknown} затруднились; ${companyNoAnswer} без ответа; всего ${total}`
      : `0/${companyBase} валидных; ${companyUnknown} затруднились; ${companyNoAnswer} без ответа; всего ${total}`;
    el("kpi-product-negative").textContent = productBase ? `${percent(productNegative, productBase)}%` : "—";
    el("kpi-product-negative-note").textContent = productBase
      ? `${productNegative}/${productBase} валидных; ${productUnknown} затруднились; ${productNoAnswer} без ответа; всего ${total}`
      : `0/${productBase} валидных; ${productUnknown} затруднились; ${productNoAnswer} без ответа; всего ${total}`;
    el("kpi-company-label").textContent = "Доля негативных оценок — Группа Rubytech";
    el("kpi-product-label").textContent = "Доля негативных оценок — Продукт Скала^р";
    el("filtered-count").textContent = `${total} ${plural(total, ["ответ", "ответа", "ответов"])}`;
  }

  function renderStatusSummary() {
    const target = el("status-summary");
    const total = state.filtered.length;
    const sent = Number.isSafeInteger(state.sentTotal) && state.sentTotal >= 0 ? state.sentTotal : null;
    const completed = state.filtered.filter((record) => record.status === "completed").length;
    const inProgress = state.filtered.filter((record) => record.status === "in_progress").length;
    const early = state.filtered.filter((record) => record.status === "screened_out").length;
    const rows = [
      { label: "Разослано всего", value: sent == null ? "—" : sent, detail: sent == null ? "укажите число слева" : "ручное значение" },
      { label: "Ответов получено", value: total, detail: sent == null ? "в текущем срезе" : `${percent(total, sent)}% (${total}/${sent}) от рассылки` },
      { label: "Завершено", value: completed, detail: total ? `${percent(completed, total)}% (${completed}/${total})` : "—" },
      { label: "В процессе", value: inProgress, detail: total ? `${percent(inProgress, total)}% (${inProgress}/${total})` : "—" },
      { label: "Завершено досрочно", value: early, detail: total ? `${percent(early, total)}% (${early}/${total})` : "—" },
    ];
    target.innerHTML = `${rows.map((row) => `<div class="status-card"><span class="status-card-label">${escapeHtml(row.label)}</span><strong>${row.value}</strong><small>${escapeHtml(row.detail)}</small></div>`).join("")}`;
    el("status-scope").textContent = `${total} ответов`;
  }

  function renderScopeSummary() {
    const target = el("scope-summary");
    const labels = {
      "filter-status": "Статус", "filter-brand": "Бренд", "filter-department": "Отдел",
      "filter-from": "Дата от", "filter-to": "Дата до", "filter-frequency": "Частота",
      "filter-industry": "Отрасль", "filter-company-negative": "Оценка: Группа Rubytech",
      "filter-product-negative": "Оценка: Продукт Скала^р", "filter-search": "Поиск",
    };
    const active = [];
    for (const id of filterIds) {
      const control = el(id);
      const defaultValue = control.tagName === "SELECT" ? "all" : "";
      if (!control.value || control.value === defaultValue) continue;
      const option = control.tagName === "SELECT" ? control.options[control.selectedIndex]?.textContent : control.value;
      active.push(`${labels[id]}: ${option || control.value}`);
    }
    target.innerHTML = `<strong>${state.filtered.length} ответов</strong><span>${active.length ? `Активные фильтры: ${escapeHtml(active.join("; "))}` : "Фильтры сброшены"}</span>`;
  }

  function mondayKey(value) {
    const date = new Date(`${value}T12:00:00Z`);
    const day = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - day);
    return date.toISOString().slice(0, 10);
  }

  function renderTrend() {
    renderStatusSummary();
  }

  function renderSentiment() {
    const target = el("sentiment-chart");
    const definitions = [
      { key: "b1", title: "Группа Rubytech" },
      { key: "b4", title: "Продукт Скала^р" },
    ];
    const negativeValues = ["1", "2"];
    target.innerHTML = definitions.map((definition) => {
      const question = activeByKey().get(definition.key);
      const records = state.filtered.filter((record) => answerValues(record, question).length);
      const counts = new Map(question.options.map((option) => [option.value, 0]));
      for (const record of records) {
        const value = String(record.answers?.[definition.key] || "");
        if (counts.has(value)) counts.set(value, counts.get(value) + 1);
      }
      const valid = question.options.filter((option) => option.value !== "99");
      const validCount = valid.reduce((sum, option) => sum + (counts.get(option.value) || 0), 0);
      const negative = valid.reduce((sum, option) => sum + (negativeValues.includes(option.value) ? (counts.get(option.value) || 0) : 0), 0);
      const unknown = counts.get("99") || 0;
      const noAnswer = state.filtered.length - records.length;
      return `<div class="sentiment-block">
        <div class="sentiment-title"><span>${escapeHtml(definition.title)}</span><strong>${validCount ? `${percent(negative, validCount)}% негативных оценок (${negative}/${validCount})` : "нет валидных оценок"}</strong></div>
        <div class="sentiment-stack">${valid.map((option) => `<i class="sentiment-segment sentiment-value-${option.value}" data-pct="${percent(counts.get(option.value) || 0, state.filtered.length)}" title="${escapeHtml(option.label)}: ${counts.get(option.value) || 0}"></i>`).join("")}${unknown ? `<i class="sentiment-segment sentiment-value-99" data-pct="${percent(unknown, state.filtered.length)}" title="Затруднились / не получали отзывы: ${unknown}"></i>` : ""}${noAnswer ? `<i class="sentiment-segment sentiment-missing" data-pct="${percent(noAnswer, state.filtered.length)}" title="Без ответа: ${noAnswer}"></i>` : ""}</div>
        <div class="sentiment-key">${valid.map((option) => `<span><i class="segment-color-${option.value}"></i>${escapeHtml(option.label)}: ${counts.get(option.value) || 0}</span>`).join("")}${unknown ? `<span><i class="segment-color-99"></i>Затруднились: ${unknown}</span>` : ""}${noAnswer ? `<span><i class="segment-color-missing"></i>Без ответа: ${noAnswer}</span>` : ""}</div>
        <p class="sentiment-note">Всего ${state.filtered.length}. Негативных: ${negative} из ${validCount} валидных оценок. Других валидных: ${Math.max(0, validCount - negative)}. Затруднились: ${unknown}. Без ответа: ${noAnswer}.</p>
      </div>`;
    }).join("");
    target.querySelectorAll("[data-pct]").forEach((node) => node.style.setProperty("--value", node.dataset.pct));
    el("sentiment-title").textContent = "Баланс отзывов";
  }

  function renderDistrust() {
    const target = el("distrust-chart");
    if (activeVersion() === 2) {
      const groups = [
        { title: "Группа Rubytech", key: "b3" },
        { title: "Продукт Скала^р", key: "b6" },
      ];
      target.innerHTML = groups.map((group) => {
        const question = activeByKey().get(group.key);
        const rows = question.rows.map((row) => {
          const values = state.filtered
            .map((record) => Number(record.answers?.[`${question.prefix}${row.value}`]))
            .filter((value) => value >= 1 && value <= 5);
          const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
          const ratingClass = average < 3 ? "rating-low" : average < 4 ? "rating-mid" : "rating-high";
          return { label: row.label, average, count: values.length, ratingClass };
        }).filter((row) => row.count);
        return `<div class="dual-group"><div class="dual-title">${escapeHtml(group.title)}</div>${rows.map((row) => `
          <div class="bar-row"><div class="bar-meta"><span>${escapeHtml(row.label)}</span><strong>${row.average.toFixed(1).replace(".", ",")} из 5 (${row.count} ${plural(row.count, ["оценка", "оценки", "оценок"])})</strong></div><div class="bar-track"><div class="bar-fill ${row.ratingClass}" data-pct="${Math.round((row.average / 5) * 100)}"></div></div></div>`).join("") || '<div class="bar-empty">Нет данных</div>'}</div>`;
      }).join("");
      el("risk-title").textContent = "Средние оценки";
      target.querySelectorAll("[data-pct]").forEach((node) => node.style.setProperty("--value", node.dataset.pct));
      return;
    }

    const groups = [
      { title: "Компания", key: "b3" },
      { title: "Продукт", key: "b6" },
    ];
    target.innerHTML = groups.map((group) => {
      const { items } = distribution(state.filtered, group.key);
      return `<div class="dual-group"><div class="dual-title">${group.title}</div>${items.slice(0, 4).map((item) => `
        <div class="bar-row"><div class="bar-meta"><span>${escapeHtml(item.label)}</span><strong>${item.pct}%</strong></div><div class="bar-track"><div class="bar-fill" data-pct="${item.pct}"></div></div></div>`).join("") || '<div class="bar-empty">Нет данных</div>'}</div>`;
    }).join("");
    el("risk-title").textContent = "Причины недоверия";
    target.querySelectorAll("[data-pct]").forEach((node) => node.style.setProperty("--value", node.dataset.pct));
  }

  function renderTextInsights(target, questionKey, limit = 8) {
    const question = activeByKey().get(questionKey);
    const values = state.filtered.flatMap((record) => answerValues(record, question)).filter((value) => value.trim());
    target.innerHTML = values.length
      ? `<div class="text-insights">${values.slice(0, limit).map((value) => `<div class="text-insight">${escapeHtml(value)}</div>`).join("")}</div>`
      : '<div class="bar-empty">Нет данных для выбранного среза</div>';
  }

  function renderRolePanel(targetId, groups) {
    const target = el(targetId);
    target.innerHTML = groups.map((group) => {
      const { items, base } = distribution(state.filtered, group.key);
      return `<div class="dual-group"><div class="dual-title">${escapeHtml(group.title)}</div>${items.slice(0, 6).map((item) => `
        <div class="bar-row"><div class="bar-meta"><span>${escapeHtml(item.label)}</span><strong>${item.pct}% (${item.count}/${base})</strong></div><div class="bar-track"><div class="bar-fill" data-pct="${item.pct}"></div></div></div>`).join("") || '<div class="bar-empty">Нет данных</div>'}</div>`;
    }).join("");
    target.querySelectorAll("[data-pct]").forEach((node) => node.style.setProperty("--value", node.dataset.pct));
  }

  function renderFeedbackRoles() {
    renderRolePanel("positive-roles-chart", [
      { title: "Группа Rubytech", key: "b22" },
      { title: "Продукт Скала^р", key: "b55" },
    ]);
    renderRolePanel("negative-roles-chart", [
      { title: "Группа Rubytech", key: "b2" },
      { title: "Продукт Скала^р", key: "b5" },
    ]);
  }

  function segmentDefinitions(type, record) {
    if (type === "department") {
      const value = String(record.answers?.a1 || "none");
      if (value === "none") return [];
      const question = schema.byKeyForVersion(record).get("a1");
      return [{ key: value, label: schema.labelFor(question, value) || "Нет ответа" }];
    }
    if (type === "industry") {
      const question = schema.byKeyForVersion(record).get("a3");
      const values = answerValues(record, question).filter((value) => value !== "none");
      if (!values.length) return [];
      return values.map((value) => ({ key: String(value), label: schema.labelFor(question, value) || "Нет ответа" }));
    }
    if (type === "status") return [{ key: record.status, label: statusLabels[record.status] || record.status }];
    return [{ key: "all", label: "Все ответы" }];
  }

  function renderExplorer() {
    const question = activeByKey().get(el("explorer-question").value) || activeByKey().get("b1");
    const segmentType = el("explorer-segment").value;
    const target = el("explorer-chart");
    const records = state.filtered;
    const answeredRecords = records.filter((record) => answerValues(record, question).length);
    el("explorer-prompt-text").textContent = `${question.code}. ${questionPrompts[question.key] || question.title}`;
    el("explorer-description").textContent = `Ответили ${answeredRecords.length}/${records.length}`;

    if (["text", "list"].includes(question.type)) {
      const values = answeredRecords.flatMap((record) => answerValues(record, question)).filter((value) => value.trim());
      target.innerHTML = values.length
        ? `<div class="text-insights">${values.slice(0, 16).map((value) => `<div class="text-insight">${escapeHtml(value)}</div>`).join("")}</div>`
        : '<div class="bar-empty">В выбранном срезе нет текстовых ответов</div>';
      return;
    }

    const { items, base } = distribution(records, question.key);
    if (!items.length) {
      target.innerHTML = '<div class="bar-empty">Нет данных для выбранного среза</div>';
      return;
    }

    const segments = new Map();
    for (const record of records) {
      for (const segment of segmentDefinitions(segmentType, record)) {
        if (!segments.has(segment.key)) segments.set(segment.key, segment.label);
      }
    }
    const segmentEntries = [...segments.entries()].slice(0, 12);
    const legend = segmentType === "none" ? "" : `<div class="segment-legend">${segmentEntries.map(([key, label]) => `<span><i class="segment-swatch ${segmentClass(segmentType, key)}"></i>${escapeHtml(label)}</span>`).join("")}</div>`;

    const rows = items.slice(0, 15).map((item) => {
      const pieces = segmentEntries.map(([segmentKey]) => {
        let count = 0;
        for (const record of records) {
          if (!segmentDefinitions(segmentType, record).some((segment) => segment.key === segmentKey)) continue;
          const values = answerValues(record, question);
          count += question.type === "matrix"
            ? values.filter((value) => value === item.value).length
            : Number(values.includes(item.value));
        }
        return { count, pct: percent(count, base), segmentKey };
      });
      return `<div class="explorer-row">
        <div class="explorer-label">${escapeHtml(item.label)}</div>
        <div class="segment-list">${pieces.map((piece) => `<i class="segment-fill ${segmentClass(segmentType, piece.segmentKey)}" data-pct="${piece.pct}"></i>`).join("")}</div>
        <div class="explorer-value">${item.pct}% (${item.count}/${base})</div>
      </div>`;
    }).join("");
    target.innerHTML = `${legend}${rows}`;
    target.querySelectorAll("[data-pct]").forEach((node) => node.style.setProperty("--value", node.dataset.pct));
  }

  function renderRules() {
    const target = el("advanced-rules");
    target.innerHTML = state.rules.map((rule, index) => {
      const question = activeByKey().get(rule.question) || activeQuestions()[0];
      const hasOptions = question.options.length > 0;
      const operators = hasOptions
        ? [["has", "содержит"], ["not_has", "не содержит"], ["answered", "заполнено"], ["unanswered", "не заполнено"]]
        : [["text", "текст содержит"], ["answered", "заполнено"], ["unanswered", "не заполнено"]];
      const needsValue = !["answered", "unanswered"].includes(rule.operator);
      return `<div class="rule" data-rule-index="${index}">
        <button class="rule-remove" type="button" data-remove-rule="${index}" aria-label="Удалить условие">×</button>
        <select data-rule-field="question">${activeQuestions().map((item) => `<option value="${item.key}"${item.key === question.key ? " selected" : ""}>${item.code} · ${escapeHtml(item.title)}</option>`).join("")}</select>
        <select data-rule-field="operator">${operators.map(([value, label]) => `<option value="${value}"${value === rule.operator ? " selected" : ""}>${label}</option>`).join("")}</select>
        ${needsValue ? (hasOptions
          ? `<select data-rule-field="value">${question.options.map((item) => `<option value="${escapeHtml(item.value)}"${String(item.value) === String(rule.value) ? " selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select>`
          : `<input data-rule-field="value" value="${escapeHtml(rule.value || "")}" placeholder="Введите фрагмент" />`) : ""}
      </div>`;
    }).join("");
  }

  function renderReputation() {
    const total = state.filtered.length;
    const valid = ["1", "2", "3", "4", "5"];
    const negative = ["1", "2"];
    const positive = ["4", "5"];
    const stats = (key) => {
      const values = state.filtered.map((record) => String(record.answers?.[key] || ""));
      const answered = values.filter((value) => valid.includes(value) || value === "99").length;
      const validCount = values.filter((value) => valid.includes(value)).length;
      return {
        answered,
        valid: validCount,
        negative: values.filter((value) => negative.includes(value)).length,
        positive: values.filter((value) => positive.includes(value)).length,
        unknown: values.filter((value) => value === "99").length,
        missing: Math.max(0, total - answered),
      };
    };
    const group = stats("b1");
    const product = stats("b4");
    const overallAnswered = group.answered + product.answered;
    const overallNegative = group.negative + product.negative;
    const overallPositive = group.positive + product.positive;
    const rate = (count, base) => base
      ? { percent: `${percent(count, base)}%`, fraction: `(${count}/${base})` }
      : { percent: "—", fraction: "" };
    const rateMarkup = (count, base) => {
      const value = rate(count, base);
      return `<span class="metric-percent">${value.percent}</span>${value.fraction ? ` <span class="metric-fraction">${value.fraction}</span>` : ""}`;
    };
    const metric = (title, overallCount, groupData, productData, groupCount, productCount) => `<div class="reputation-metric"><span class="metric-label">${title}</span><div class="metric-overall"><span>Общие</span><strong>${rateMarkup(overallCount, overallAnswered)}</strong></div><div class="metric-breakdown"><div><span>Rubytech</span><strong>${rateMarkup(groupCount, groupData.valid)}</strong></div><div><span>Скала^р</span><strong>${rateMarkup(productCount, productData.valid)}</strong></div></div></div>`;
    el("overall-reputation").innerHTML = `<div class="overall-reputation-grid">
      ${metric("Негативные оценки", overallNegative, group, product, group.negative, product.negative)}
      ${metric("Позитивные оценки", overallPositive, group, product, group.positive, product.positive)}
    </div>`;
  }

  function renderCharts() {
    renderStatusSummary();
    renderReputation();
    renderBarChart(el("department-chart"), "a1", 12);
    renderBarChart(el("industry-chart"), "a3", 12);
    renderBarChart(el("factor-chart"), "a8", 7);
    renderDistrust();
    renderTextInsights(el("media-chart"), "c2");
    renderTextInsights(el("sales-media-chart"), "c1");
    renderFeedbackRoles();
    renderExplorer();
  }

  function sortedRecords() {
    const records = [...state.filtered];
    if (state.sort === "updated_asc") records.sort((a, b) => String(a.updatedAt || "").localeCompare(String(b.updatedAt || "")));
    if (state.sort === "updated_desc") records.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    if (state.sort === "completion_desc") records.sort((a, b) => completionPercent(b) - completionPercent(a));
    return records;
  }

  function answerLabel(record, key) {
    const question = schema.byKeyForVersion(record).get(key);
    const value = record.answers?.[key];
    if (!value) return "—";
    const label = schema.labelFor(question, value);
    const other = record.answers?.[`${key}_other`];
    return other && ["98", "other"].includes(String(value)) ? `${label}: ${other}` : label;
  }

  function renderTable() {
    const records = sortedRecords();
    const pages = Math.max(1, Math.ceil(records.length / state.pageSize));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * state.pageSize;
    const pageRecords = records.slice(start, start + state.pageSize);

    el("responses-body").innerHTML = pageRecords.map((record) => {
      const completion = completionPercent(record);
      const sentimentValues = [record.answers?.b1, record.answers?.b4].map((value) => String(value || ""));
      const tone = sentimentValues.some((value) => ["1", "2"].includes(value)) ? "Негативный" : sentimentValues.some((value) => value === "3") ? "Смешанный" : sentimentValues.some((value) => ["4", "5"].includes(value)) ? "Позитивный" : "—";
      return `<tr>
        <td>${escapeHtml(shortDate(record.updatedAt))}</td>
        <td><span class="status-pill status-${escapeHtml(record.status)}">${escapeHtml(statusLabels[record.status] || record.status)}</span></td>
        <td>${escapeHtml(answerLabel(record, "a1"))}</td>
        <td>${escapeHtml(answerLabel(record, "a2"))}</td>
        <td>${tone}</td>
        <td><span class="completion"><i class="completion-track"><b class="completion-fill" data-pct="${completion}"></b></i>${completion}%</span></td>
        <td><button class="row-open" type="button" data-open-record="${escapeHtml(record.id)}">Открыть</button></td>
      </tr>`;
    }).join("") || '<tr><td colspan="7"><div class="bar-empty">Нет прохождений по выбранным условиям</div></td></tr>';
    el("responses-body").querySelectorAll("[data-pct]").forEach((node) => node.style.setProperty("--value", node.dataset.pct));
    el("page-info").textContent = records.length ? `${start + 1}–${Math.min(start + state.pageSize, records.length)} из ${records.length}` : "0 ответов";
    el("page-prev").disabled = state.page <= 1;
    el("page-next").disabled = state.page >= pages;
  }

  function formatQuestionAnswer(record, question) {
    if (question.type === "matrix") {
      return Object.entries(record.answers || {})
        .filter(([key, value]) => key.startsWith(question.prefix) && value)
        .map(([key, value]) => {
          const rowValue = key.slice(question.prefix.length);
          const rowLabel = question.rows?.find((item) => item.value === rowValue)?.label || rowValue;
          return `${rowLabel} — ${schema.labelFor(question, value)}`;
        }).join("\n");
    }
    const values = answerValues(record, question);
    if (!values.length) return "";
    if (["text", "list"].includes(question.type)) return values.join("\n");
    const custom = record.answers?.[`${question.key}_other`];
    return values.map((value) => {
      const label = schema.labelFor(question, value);
      return custom && ["98", "other"].includes(value) ? `${label}: ${custom}` : label;
    }).join(", ");
  }

  function openRecord(id) {
    const record = state.records.find((item) => item.id === id);
    if (!record) return;
    el("drawer-title").textContent = `Ответ от ${shortDate(record.updatedAt)}`;
    el("drawer-meta").innerHTML = `
      <span class="status-pill status-${escapeHtml(record.status)}">${escapeHtml(statusLabels[record.status] || record.status)}</span>
      <span class="status-pill status-screened_out">Заполнение ${completionPercent(record)}%</span>`;
    el("drawer-content").innerHTML = schema.questionsForVersion(record).map((question) => {
      const answer = formatQuestionAnswer(record, question);
      if (!answer) return "";
      return `<div class="answer-row"><div class="answer-question">${question.code} · ${escapeHtml(question.title)}</div><div class="answer-value">${escapeHtml(answer)}</div></div>`;
    }).join("");
    el("drawer-backdrop").hidden = false;
    el("response-drawer").classList.add("is-open");
    el("response-drawer").setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    el("response-drawer").classList.remove("is-open");
    el("response-drawer").setAttribute("aria-hidden", "true");
    window.setTimeout(() => { el("drawer-backdrop").hidden = true; }, 320);
  }

  function renderPresets() {
    document.querySelectorAll("[data-preset]").forEach((button) => {
      const active = button.dataset.preset === "completed" && el("filter-status").value === "completed";
      button.classList.toggle("is-active", active);
    });
  }

  function renderAll() {
    renderScopeSummary();
    renderCharts();
    renderTable();
    renderPresets();
  }

  function showToast(message) {
    const toast = el("toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function csvCell(value) {
    const text = String(value ?? "").replaceAll('"', '""');
    return `"${text}"`;
  }

  function exportCsv() {
    const answerKeys = [...new Set(state.filtered.flatMap((record) => Object.keys(record.answers || {})))].sort();
    const header = ["id", "status", "createdAt", "updatedAt", ...answerKeys];
    const rows = state.filtered.map((record) => [
      record.id,
      record.status,
      record.createdAt,
      record.updatedAt,
      ...answerKeys.map((key) => {
        const question = schema.questionForAnswerKey(key, record);
        const value = record.answers?.[key];
        if (Array.isArray(value)) return value.map((item) => schema.labelFor(question, item)).join(" | ");
        return question && question.options?.length ? schema.labelFor(question, value) : value ?? "";
      }),
    ]);
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
    const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = `reputation-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(href);
    showToast(`Экспортировано: ${state.filtered.length} ответов`);
  }

  function resetFilters() {
    for (const id of filterIds) {
      const control = el(id);
      control.value = control.tagName === "SELECT" ? "all" : "";
    }
    state.rules = [];
    el("rules-mode").value = "all";
    initializeSelects();
    renderRules();
    applyFilters();
  }

  function addRule() {
    const question = activeQuestions()[0];
    state.rules.push({ question: question.key, operator: "has", value: question.options[0]?.value || "" });
    renderRules();
    applyFilters();
  }

  async function copyView() {
    try {
      await navigator.clipboard.writeText(location.href);
      showToast("Ссылка на текущий срез скопирована");
    } catch {
      showToast("Не удалось скопировать ссылку");
    }
  }

  function bindEvents() {
    for (const id of filterIds) {
      const control = el(id);
      control.addEventListener(control.type === "search" ? "input" : "change", applyFilters);
    }
    el("rules-mode").addEventListener("change", applyFilters);
    el("add-rule").addEventListener("click", addRule);
    el("reset-filters").addEventListener("click", resetFilters);
    el("explorer-question").addEventListener("change", renderExplorer);
    el("explorer-segment").addEventListener("change", renderExplorer);
    el("page-size").addEventListener("change", () => { state.pageSize = Number(el("page-size").value); state.page = 1; renderTable(); });
    el("table-sort").addEventListener("change", () => { state.sort = el("table-sort").value; renderTable(); });
    el("page-prev").addEventListener("click", () => { state.page = Math.max(1, state.page - 1); renderTable(); });
    el("page-next").addEventListener("click", () => { state.page += 1; renderTable(); });
    el("export-csv").addEventListener("click", exportCsv);
    el("copy-view").addEventListener("click", copyView);
    el("close-drawer").addEventListener("click", closeDrawer);
    el("drawer-backdrop").addEventListener("click", closeDrawer);
    el("mobile-filter-toggle").addEventListener("click", () => el("filters").classList.add("is-open"));
    el("close-filters").addEventListener("click", () => el("filters").classList.remove("is-open"));
    el("retry-load").addEventListener("click", loadData);
    el("save-sent-total").addEventListener("click", saveSentTotal);

    document.addEventListener("click", (event) => {
      const preset = event.target.closest("[data-preset]");
      if (preset) {
        if (preset.dataset.preset === "completed") el("filter-status").value = el("filter-status").value === "completed" ? "all" : "completed";
        applyFilters();
      }
      const open = event.target.closest("[data-open-record]");
      if (open) openRecord(open.dataset.openRecord);
      const remove = event.target.closest("[data-remove-rule]");
      if (remove) {
        state.rules.splice(Number(remove.dataset.removeRule), 1);
        renderRules();
        applyFilters();
      }
    });

    el("advanced-rules").addEventListener("change", (event) => {
      const row = event.target.closest("[data-rule-index]");
      if (!row || !event.target.dataset.ruleField) return;
      const index = Number(row.dataset.ruleIndex);
      const field = event.target.dataset.ruleField;
      state.rules[index][field] = event.target.value;
      if (field === "question") {
        const question = activeByKey().get(event.target.value);
        state.rules[index].operator = question.options.length ? "has" : "text";
        state.rules[index].value = question.options[0]?.value || "";
      }
      if (field === "operator" && ["answered", "unanswered"].includes(event.target.value)) state.rules[index].value = "";
      renderRules();
      applyFilters();
    });
    el("advanced-rules").addEventListener("input", (event) => {
      const row = event.target.closest("[data-rule-index]");
      if (!row || event.target.dataset.ruleField !== "value") return;
      state.rules[Number(row.dataset.ruleIndex)].value = event.target.value;
      window.clearTimeout(bindEvents.ruleTimer);
      bindEvents.ruleTimer = window.setTimeout(applyFilters, 180);
    });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDrawer(); });
  }

  async function loadSettings() {
    try {
      const response = await fetch(STATIC_DEMO ? "../demo-data/settings.json" : "../api/analytics/settings", { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error(`Сервер вернул статус ${response.status}`);
      const payload = await response.json();
      const localSent = null;
      const rawSent = localSent === null ? payload.sent_total : localSent;
      state.sentTotal = rawSent == null || rawSent === "" ? null : (Number.isSafeInteger(Number(rawSent)) ? Number(rawSent) : null);
      el("sent-total").value = state.sentTotal == null ? "" : state.sentTotal;
      el("sent-total-status").textContent = state.sentTotal == null ? "Задайте число для расчёта доли ответов." : `Сохранено: ${state.sentTotal}`;
      renderAll();
    } catch (error) {
      el("sent-total-status").textContent = "Не удалось загрузить настройку рассылки.";
    }
  }

  async function saveSentTotal() {
    const raw = el("sent-total").value.trim();
    const value = raw === "" ? null : Number(raw);
    if (value !== null && (!Number.isSafeInteger(value) || value < 0)) {
      el("sent-total-status").textContent = "Введите целое неотрицательное число.";
      return;
    }
    try {
      if (STATIC_DEMO) {
        state.sentTotal = value;
        el("sent-total-status").textContent = state.sentTotal == null ? "Значение очищено в браузере." : `Сохранено в браузере: ${state.sentTotal}`;
        showToast("Число рассылки сохранено в браузере");
        renderAll();
        return;
      }
      const response = await fetch("../api/analytics/settings", { method: "PUT", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ sent_total: value }) });
      if (!response.ok) throw new Error(`Сервер вернул статус ${response.status}`);
      const payload = await response.json();
      state.sentTotal = payload.sent_total == null ? null : Number(payload.sent_total);
      el("sent-total-status").textContent = state.sentTotal == null ? "Значение очищено." : `Сохранено: ${state.sentTotal}`;
      showToast("Число рассылки сохранено");
      renderAll();
    } catch (error) {
      el("sent-total-status").textContent = "Не удалось сохранить настройку.";
    }
  }

  async function loadData() {
    el("loading").hidden = false;
    el("error-screen").hidden = true;
    try {
      const response = await fetch(STATIC_DEMO ? "../demo-data/responses.json" : "../api/analytics/responses", { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error(`Сервер вернул статус ${response.status}`);
      const payload = await response.json();
      state.records = (payload.records || []).map((record) => ({
        ...record,
        isTest: Boolean(record.isTest || String(record.id || "").startsWith("test-")),
        answers: record.answers || {},
      }));
      state.generatedAt = payload.generatedAt;
      el("freshness").textContent = `Обновлено ${shortDateTime(payload.generatedAt)}`;
      applyFilters();
    } catch (error) {
      el("error-message").textContent = error?.message || "Обновите страницу и попробуйте снова.";
      el("error-screen").hidden = false;
    } finally {
      el("loading").hidden = true;
    }
  }

  initializeSelects();
  restoreUrl();
  renderRules();
  bindEvents();
  loadSettings();
  loadData();
})();
