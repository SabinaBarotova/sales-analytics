(() => {
  "use strict";

  const options = (items) => items.map(([value, label]) => ({ value: String(value), label }));

  const brands = options([
    [1, "Скала^р"], [2, "Rubytech"], [3, "В равной степени с обоими"],
  ]);
  const departments = options([
    [1, "Дивизион ключевых заказчиков"], [2, "Дивизион по развитию бизнеса"],
    [3, "Проектная группа внутри заказчика"], [4, "Другое"],
  ]);
  const clientFrequency = options([
    [1, "Каждый или почти каждый рабочий день"], [2, "Несколько раз в неделю"],
    [3, "Несколько раз в месяц"], [4, "Несколько раз в квартал"],
    [5, "Реже одного раза в квартал"], [97, "Не общаюсь напрямую с клиентами"],
  ]);
  const industries = options([
    [1, "Банки, финансовый сектор, страхование"], [2, "Розничная торговля"],
    [3, "Госсектор"], [4, "Промышленность"], [5, "Транспорт, логистика"], [98, "Другое"],
  ]);
  const roles = options([
    [1, "Генеральный директор"], [2, "ИТ-директор / руководитель ИТ-отдела"],
    [3, "Директор / руководитель отдела информационной безопасности"], [4, "Руководитель отдела закупок"],
    [5, "Другая управленческая должность"], [6, "Системный администратор"],
    [7, "Специалист по информационной безопасности"], [8, "DevOps-специалист"],
    [9, "Другой специалист ИТ-отдела"], [10, "Специалист по закупкам"],
    [11, "Юрист"], [98, "Другое"],
  ]);
  const contactFrequency = options([
    [1, "Примерно раз в две недели"], [2, "Раз в 1–2 месяца"],
    [3, "Раз в полгода"], [4, "Реже, чем раз в полгода"],
  ]);
  const supplierFactors = options([
    [1, "Надежность компании как поставщика"], [2, "Репутация компании на рынке"],
    [3, "Наличие успешных кейсов"], [4, "Соответствие требованиям информационной безопасности"],
    [5, "Соответствие регуляторным требованиям / наличие сертификатов"],
    [6, "Совместимость с текущей инфраструктурой клиента"], [7, "Стоимость закупки"],
    [8, "Сроки предоставления услуг"], [9, "Качество технической поддержки"],
    [10, "Возможность пилота / тестирования решения"], [11, "Рекомендации коллег по рынку"],
    [12, "Независимые рейтинги и аналитические обзоры"], [13, "Совокупная стоимость владения (TCO)"],
    [14, "Технические особенности продукта"], [15, "Личный опыт взаимодействия / профессиональная экспертиза"],
    [98, "Другое"], [99, "Затрудняюсь ответить"],
  ]);
  const sentiment = options([
    [1, "Только негативные"], [2, "Больше негативные"],
    [3, "В равном количестве негативные и позитивные"], [4, "Больше позитивные"],
    [5, "Только позитивные"], [99, "Затрудняюсь ответить / не получал отзывы"],
  ]);
  const ratingScale = options([
    [1, "Негативно"], [2, "Скорее негативно"], [3, "Нейтрально"],
    [4, "Скорее позитивно"], [5, "Позитивно"], [99, "Не знаю"],
  ]);
  const companyRatingCriteria = options([
    [1, "Известность на рынке"], [2, "Технологическая экспертиза"],
    [3, "Финансовая устойчивость компании"], [4, "Качество технической поддержки"],
    [5, "Количество публичных кейсов внедрений"], [6, "Соблюдение сроков поставки"],
    [7, "Отзывы от коллег / в СМИ"], [8, "Соответствие регуляторным требованиям"],
    [9, "Репутация компании / руководства"],
  ]);
  const productRatingCriteria = options([
    [1, "Известность продукта"], [2, "Совместимость с текущей инфраструктурой клиента"],
    [3, "Безопасность решения"], [4, "Надежность и отсутствие сбоев в работе"],
    [5, "Количество публичных кейсов внедрений"], [6, "Уровень сложности внедрения или эксплуатации"],
    [7, "Функциональность по сравнению с конкурентами"], [8, "Стоимость"],
  ]);
  const eventFormats = options([
    [1, "Отраслевые конференции ведомств (ЦИПР, «Цифровые решения», Уральский форум и др.)"],
    [2, "Собственные мероприятия ведущих игроков рынка (Postgres Conf, ИТ/Ритм и др.)"],
    [3, "Форумы и конференции федерального значения (ПМЭФ, ЦИПР, Дальневосточный экономический форум)"],
    [4, "Онлайн-конференции / форумы"],
    [5, "Семинары и воркшопы"], [98, "Вебинары"], [99, "Другое"],
  ]);

  const questions = [
    { key: "a0", code: "A0", title: "Основной бренд", type: "single", options: brands },
    { key: "a1", code: "A1", title: "Подразделение респондента", type: "single", options: departments },
    { key: "a2", code: "A2", title: "Частота общения с клиентами", type: "single", options: clientFrequency },
    { key: "a3", code: "A3", title: "Отрасли клиентов", type: "multi", options: industries },
    { key: "a4", code: "A4", title: "Должности со стороны клиента", type: "multi", options: roles },
    { key: "a5", prefix: "a5_", code: "A5", title: "Частота контакта по должностям", type: "matrix", rows: roles, options: contactFrequency },
    { key: "a7", code: "A7", title: "Факторы выбора поставщика", type: "multi", options: supplierFactors },
    { key: "a8", code: "A8", title: "Ключевые факторы выбора", type: "multi", options: supplierFactors },
    { key: "b1", code: "B1", title: "Отзывы о Группе Rubytech", type: "single", options: sentiment },
    { key: "b2", code: "B2", title: "Кто сообщает негатив о Группе Rubytech", type: "multi", options: roles },
    { key: "b22", code: "B22", title: "Кто сообщает позитив о Группе Rubytech", type: "multi", options: roles },
    { key: "b3", prefix: "b3_", code: "B3", title: "Оценка Группы Rubytech", type: "matrix", rows: companyRatingCriteria, options: ratingScale },
    { key: "b4", code: "B4", title: "Отзывы о продукте Скала^р", type: "single", options: sentiment },
    { key: "b5", code: "B5", title: "Кто сообщает негатив о продукте", type: "multi", options: roles },
    { key: "b55", code: "B55", title: "Кто сообщает позитив о продукте", type: "multi", options: roles },
    { key: "b6", prefix: "b6_", code: "B6", title: "Оценка продукта Скала^р", type: "matrix", rows: productRatingCriteria, options: ratingScale },
    { key: "b7", code: "B7", title: "Причины недоверия", type: "text", options: [] },
    { key: "b8", code: "B8", title: "Как снизить недоверие", type: "text", options: [] },
    { key: "c1", code: "C1", title: "Источники информации респондента", type: "text", options: [] },
    { key: "c2", code: "C2", title: "Источники информации клиентов", type: "text", options: [] },
    { key: "c3", code: "C3", title: "Форматы профессиональных мероприятий", type: "multi", options: eventFormats },
    { key: "c4", code: "C4", title: "Дополнительные наблюдения", type: "text", options: [] },
  ];

  const legacyDepartments = options([[1, "Отдел продаж"], [2, "Пресейл"], [3, "Маркетинг"], ["other", "Другое"]]);
  const legacyContactFrequency = options([[1, "Часто"], [2, "Иногда"], [3, "Редко / эпизодически"], [4, "Контактировали один раз"]]);
  const legacySupplierFactors = options([
    [1, "Надёжность и репутация поставщика"], [2, "Успешные кейсы"], [3, "Соответствие требованиям ИБ"],
    [4, "Сертификаты и регуляторные требования"], [5, "Совместимость с инфраструктурой"],
    [6, "Стоимость закупки"], [7, "Сроки предоставления услуг"], [8, "Качество техподдержки"],
    [9, "Пилот / тестирование"], [10, "Рекомендации коллег"], [11, "Независимые рейтинги и обзоры"],
    [98, "Другое"], [99, "Затрудняюсь ответить"],
  ]);
  const legacyNegativeFrequency = options([[1, "Да, часто"], [2, "Да, иногда"], [3, "Да, редко"], [4, "Не встречали ни разу"]]);
  const legacyCompanyDistrust = options([
    [1, "Недостаточная известность компании"], [2, "Недостаток публичных кейсов"],
    [3, "Сомнения в технологической экспертизе"], [4, "Сомнения в финансовой устойчивости"],
    [5, "Сомнения в качестве техподдержки"], [6, "Опасения по срокам"], [7, "Непонимание преимуществ"],
    [8, "Негативный прошлый опыт"], [9, "Негативные отзывы коллег / СМИ"],
    [10, "Сомнения в соответствии требованиям"], [11, "Кейс, связанный с делом основателя"],
    [98, "Другое"], [99, "Затрудняюсь ответить"],
  ]);
  const legacyProductDistrust = options([
    [1, "Недостаточная известность продукта"], [2, "Недостаток отраслевых кейсов"],
    [3, "Сомнения в совместимости"], [4, "Сомнения в безопасности"], [5, "Сомнения в надёжности"],
    [6, "Сложность внедрения / эксплуатации"], [7, "Недостаток функциональности"], [8, "Высокая стоимость"],
    [9, "Недоверие к российским решениям"], [10, "Негативный прошлый опыт"], [98, "Другое"], [99, "Затрудняюсь ответить"],
  ]);
  const legacyMediaSources = options([
    [1, "Деловые СМИ"], [2, "ИТ-СМИ и профессиональные сообщества"], [3, "Telegram-каналы"],
    [4, "YouTube-каналы"], [5, "Подкасты"], [98, "Другое"], [99, "Затрудняюсь ответить"],
  ]);
  const legacyBusinessMedia = options([
    [1, "РБК"], [2, "Ведомости"], [3, "Коммерсантъ"], [4, "Forbes Russia"], [5, "Эксперт"],
    [6, "Секрет фирмы"], [7, "Профиль"], [8, "Inc."], [9, "Тинькофф Журнал"], [10, "RB.ru"],
    [98, "Другое"], [99, "Затрудняюсь ответить"],
  ]);
  const legacyItMedia = options([
    [1, "Хабр"], [2, "VC.ru"], [3, "Skillbox Media"], [4, "Яндекс Практикум"], [5, "GeekBrains"],
    [6, "Tproger"], [7, "IT-World"], [8, "Hi-Tech Mail.ru"], [9, "SecurityLab"],
    [10, "Anti-Malware.ru"], [11, "Код ИБ"], [12, "CNews"], [13, "TAdviser"],
    [98, "Другое"], [99, "Затрудняюсь ответить"],
  ]);
  const legacyEventAttendance = options([[1, "Да"], [2, "Нет"], [3, "Не владею информацией"]]);
  const legacyEventFormats = options([
    [1, "Оффлайн-конференции / форумы"], [2, "Онлайн-конференции / форумы"],
    [3, "Семинары / воркшопы"], [4, "Круглые столы / дискуссии"], [5, "Вебинары"],
    [98, "Другое"], [99, "Затрудняюсь ответить"],
  ]);
  const legacyAttendanceDecision = options([[1, "Планируют на год вперёд"], [2, "Решают за несколько месяцев"], [3, "Решают за несколько недель"], [99, "Затрудняюсь ответить"]]);
  const legacyMaterials = options([
    [1, "Отраслевые кейсы внедрения"], [2, "Кейсы по типовым задачам"], [3, "Независимые рейтинги и обзоры"],
    [4, "Сравнение с конкурентами"], [5, "Вебинары для клиентов"], [6, "Материалы для технических специалистов"],
    [98, "Другое"], [97, "Дополнительные материалы не нужны"],
  ]);
  const legacyClientTasks = options([
    [1, "Замена устаревающего оборудования"], [2, "Рост уровня киберугроз"], [3, "Новые регуляторные требования"],
    [4, "Масштабирование инфраструктуры"], [5, "Импортозамещение"], [6, "Повышение надёжности инфраструктуры"],
    [7, "Оптимизация затрат"], [8, "Запуск цифровых продуктов"], [98, "Другое"],
  ]);

  const legacyQuestions = [
    { key: "a1", code: "A1", title: "Отдел респондента", type: "single", options: legacyDepartments },
    { key: "a2", code: "A2", title: "Частота общения с клиентами", type: "single", options: clientFrequency },
    { key: "a3", code: "A3", title: "Отрасли клиентов", type: "multi", options: industries },
    { key: "a4", code: "A4", title: "Должности со стороны клиента", type: "multi", options: roles },
    { key: "a5", prefix: "a5_", code: "A5", title: "Частота контакта по должностям", type: "matrix", rows: roles, options: legacyContactFrequency },
    { key: "a6", code: "A6", title: "Задачи клиентов", type: "multi", options: legacyClientTasks },
    { key: "a7", code: "A7", title: "Факторы выбора поставщика", type: "multi", options: legacySupplierFactors },
    { key: "a8", code: "A8", title: "Ключевые факторы выбора", type: "multi", options: legacySupplierFactors },
    { key: "b1", code: "B1", title: "Негатив о компании", type: "single", options: legacyNegativeFrequency },
    { key: "b2", code: "B2", title: "Кто сообщает негатив о компании", type: "multi", options: roles },
    { key: "b3", code: "B3", title: "Причины недоверия к компании", type: "multi", options: legacyCompanyDistrust },
    { key: "b4", code: "B4", title: "Негатив о продукте", type: "single", options: legacyNegativeFrequency },
    { key: "b5", code: "B5", title: "Кто сообщает негатив о продукте", type: "multi", options: roles },
    { key: "b6", code: "B6", title: "Причины недоверия к продукту", type: "multi", options: legacyProductDistrust },
    { key: "b7", code: "B7", title: "Как снизить недоверие", type: "text", options: [] },
    { key: "c1", code: "C1", title: "Источники информации респондента", type: "multi", options: legacyMediaSources },
    { key: "c2", code: "C2", title: "Деловые СМИ респондента", type: "multi", options: legacyBusinessMedia },
    { key: "c3", code: "C3", title: "ИТ-СМИ респондента", type: "multi", options: legacyItMedia },
    { key: "c4", code: "C4", title: "Telegram-каналы респондента", type: "list", options: [] },
    { key: "c5", code: "C5", title: "YouTube-каналы респондента", type: "list", options: [] },
    { key: "c6", code: "C6", title: "Подкасты респондента", type: "list", options: [] },
    { key: "c7", code: "C7", title: "Источники информации клиентов", type: "multi", options: legacyMediaSources },
    { key: "c8", code: "C8", title: "Деловые СМИ клиентов", type: "multi", options: legacyBusinessMedia },
    { key: "c9", code: "C9", title: "ИТ-СМИ клиентов", type: "multi", options: legacyItMedia },
    { key: "c10", code: "C10", title: "Telegram-каналы клиентов", type: "list", options: [] },
    { key: "c11", code: "C11", title: "YouTube-каналы клиентов", type: "list", options: [] },
    { key: "c12", code: "C12", title: "Подкасты клиентов", type: "list", options: [] },
    { key: "c13", code: "C13", title: "Посещение профмероприятий", type: "single", options: legacyEventAttendance },
    { key: "c14", code: "C14", title: "Форматы мероприятий", type: "multi", options: legacyEventFormats },
    { key: "c15", prefix: "c15_", code: "C15", title: "Горизонт решения об участии", type: "matrix", rows: legacyEventFormats, options: legacyAttendanceDecision },
    { key: "c16", code: "C16", title: "Недостающие маркетинговые материалы", type: "multi", options: legacyMaterials },
    { key: "c17", code: "C17", title: "Дополнительные наблюдения", type: "text", options: [] },
  ];

  const maps = {
    1: new Map(legacyQuestions.map((question) => [question.key, question])),
    2: new Map(questions.map((question) => [question.key, question])),
  };
  const versionNumber = (value) => Number(value?.schemaVersion ?? value) === 1 ? 1 : 2;
  const questionsForVersion = (value) => versionNumber(value) === 1 ? legacyQuestions : questions;
  const byKeyForVersion = (value) => maps[versionNumber(value)];
  const labelFor = (question, value) => question?.options?.find((item) => item.value === String(value))?.label || String(value);
  const questionForAnswerKey = (key, version = 2) => questionsForVersion(version)
    .find((question) => question.key === key || (question.prefix && key.startsWith(question.prefix)));
  const collectionsForVersion = (value) => versionNumber(value) === 1
    ? { brands: [], departments: legacyDepartments, clientFrequency, industries, sentiment: legacyNegativeFrequency, eventFormats: legacyEventAttendance }
    : { brands, departments, clientFrequency, industries, sentiment, eventFormats };

  window.AnalyticsSchema = {
    currentVersion: 2,
    questions,
    legacyQuestions,
    byKey: maps[2],
    labelFor,
    questionForAnswerKey,
    questionsForVersion,
    byKeyForVersion,
    collectionsForVersion,
    versionNumber,
    brands,
    departments,
    clientFrequency,
    industries,
    sentiment,
    eventFormats,
  };
})();
