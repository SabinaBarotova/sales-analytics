# Rubytech Reputation Questionnaire

Веб-анкета для исследования восприятия нашей компании и её продуктов с автоматическим сохранением ответов и отдельным дашбордом аналитики.

Проект не использует сторонние npm-зависимости: сервер работает на стандартных модулях Node.js 20, интерфейс — на HTML, CSS и JavaScript. Production-развёртывание выполняется через Docker Compose.

## Возможности

- адаптивная анкета с условными ветками, матрицами и множественным выбором;
- фирменный интерфейс Rubytech с локальными SVG-ассетами и адаптацией от 320 px;
- отдельный парольный вход в анкету с ограничением частоты неудачных попыток;
- сохранение после каждого выбора и изменения текста;
- локальная копия заполнения в браузере;
- автоматическая повторная отправка после восстановления сети;
- отправка последнего изменения при закрытии или скрытии страницы;
- защита от перезаписи новых данных устаревшим запросом;
- атомарная и синхронизированная запись на диск;
- журнал всех принятых ревизий в формате NDJSON;
- защищённая Basic Auth панель аналитики;
- фильтры, диаграммы и выгрузка результатов;
- healthcheck, ротация Docker-логов и резервное копирование.

Интерфейс анкеты использует палитру брендбука Rubytech: Deep Navy `#0A1F41`, Digital Ruby `#F05023` и Silver `#A5A8AA`. Полный логотип, гранёный знак Rubytech и кириллические webfont-файлы Manrope лежат локально в `public/assets/`, поэтому внешний CDN для отображения бренда не требуется. Manrope распространяется по SIL Open Font License; текст лицензии находится в `public/assets/fonts/OFL.txt`.

## Архитектура и данные

```text
Браузер
  ├─ парольный вход → анкета
  ├─ localStorage — временная страховка
  └─ PUT /api/responses/:id
             │
             ▼
        Node.js-сервер
          ├─ /data/responses/*.json — актуальная версия каждой анкеты
          └─ /data/journal/*.ndjson — журнал принятых ревизий
             │
             ▼
   Docker volume reputation-survey-data
```

Каждая анкета хранится отдельным JSON-файлом. Запись выполняется во временный файл, принудительно синхронизируется с диском и затем атомарно переименовывается. Запрос с той же или меньшей ревизией не может затереть более свежий ответ.

Текущая анкета использует схему `v2` из 22 вопросов. Версия сохраняется вместе с каждым ответом. Дашборд по умолчанию показывает `v2`, а переключатель «Версия анкеты» позволяет отдельно анализировать сохранённые ответы прежней схемы `v1`; данные разных форматов не смешиваются.

Основные маршруты:

| Маршрут | Назначение |
|---|---|
| `/` | парольный вход, затем анкета |
| `/analytics/` | дашборд аналитики, защищённый Basic Auth |
| `/health` | проверка процесса и доступности хранилища |
| `POST /api/survey/unlock` | проверка пароля анкеты и выдача HttpOnly-cookie |
| `PUT /api/responses/:id` | автосохранение анкеты |
| `GET /api/analytics/responses` | данные для аналитики, защищены Basic Auth |

## Требования

- Linux-сервер;
- Docker Engine;
- Docker Compose v2;
- домен и reverse proxy для production;
- HTTPS-сертификат;
- минимум 1 ГБ свободной оперативной памяти и достаточно места под ответы/бэкапы.

## Быстрый локальный запуск

```bash
git clone git@github.com:Terenta/Skala-R-questionnaire.git
cd Skala-R-questionnaire
cp .env.example .env
```

Сгенерируйте два независимых пароля — для анкеты и для аналитики:

```bash
openssl rand -base64 36
```

Запишите собственные значения в `.env`:

```dotenv
ANALYTICS_USER=analytics
ANALYTICS_PASSWORD=replace-with-a-long-random-password
SURVEY_PASSWORD=replace-with-another-long-random-password
SURVEY_COOKIE_PATH=/
SURVEY_PORT=3000
```

Запустите приложение:

```bash
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1:3000/health
```

После запуска:

- анкета: `http://127.0.0.1:3000/`;
- аналитика: `http://127.0.0.1:3000/analytics/`.

Порт по умолчанию опубликован только на `127.0.0.1` и не доступен напрямую извне.

## Production-развёртывание

Рекомендуемый каталог:

```bash
sudo mkdir -p /opt/reputation-survey
sudo chown "$USER":"$USER" /opt/reputation-survey
git clone git@github.com:Terenta/Skala-R-questionnaire.git /opt/reputation-survey
cd /opt/reputation-survey
cp .env.example .env
chmod 600 .env
```

Укажите собственные секреты в `.env`. Не добавляйте этот файл в Git и передавайте пароли отдельно от репозитория. Затем выполните:

```bash
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1:3000/health
```

Ожидаемый healthcheck:

```json
{"ok":true,"storage":"writable"}
```

### Reverse proxy на хосте

Готовые примеры находятся в:

- `deploy/Caddyfile.example`;
- `deploy/nginx.conf.example`.

Для отдельного домена проксируйте все запросы на `127.0.0.1:3000`.

Для размещения по пути `/reputation/` reverse proxy должен удалить этот префикс перед передачей запроса приложению:

- Caddy: `handle_path /reputation/*`;
- Nginx: `location /reputation/` и `proxy_pass http://127.0.0.1:3000/`.

Путь cookie должен совпадать с внешним URL. Для отдельного домена оставьте `SURVEY_COOKIE_PATH=/`, а для текущего варианта по префиксу задайте в production `.env`:

```dotenv
SURVEY_COOKIE_PATH=/reputation/
```

Пароль анкеты и Basic Auth аналитики должны использоваться только через HTTPS: при обычном HTTP секреты передаются по сети без шифрования.

После настройки проверьте:

```bash
curl -fsS https://survey.example.ru/health
```

или:

```bash
curl -fsS https://example.ru/reputation/health
```

### Reverse proxy в Docker

Если Nginx/Caddy работает в контейнере, подключите приложение к той же внешней сети:

```bash
REVERSE_PROXY_NETWORK=proxy \
docker compose \
  -f docker-compose.yml \
  -f docker-compose.shared-network.yml \
  up -d --build
```

Замените `proxy` на фактическое имя сети. В конфигурации reverse proxy используйте upstream `reputation-survey:3000`.

Чтобы общий сетевой профиль не потерялся при следующем обычном обновлении, рекомендуется закрепить его в production `.env`:

```dotenv
COMPOSE_FILE=docker-compose.yml:docker-compose.shared-network.yml
REVERSE_PROXY_NETWORK=proxy
```

После этого достаточно выполнять `docker compose up -d --build`: Compose автоматически применит оба файла. Без `COMPOSE_FILE` запуск только с базовым `docker-compose.yml` пересоздаст контейнер без общей сети reverse proxy.

## Хранение данных

Production-данные находятся в именованном Docker volume:

```text
reputation-survey-data
```

Внутри контейнера:

```text
/data/responses
/data/journal
```

Никогда не выполняйте `docker compose down -v` и не удаляйте volume при обычном обновлении.

Проверка целостности:

```bash
docker exec reputation-survey node /app/scripts/audit-data.js
```

Успешная проверка содержит:

```json
{"invalidJson":0,"invalidShape":0,"temporaryFiles":0,"ok":true}
```

## Резервное копирование

Скрипт создаёт сжатый снимок всего volume, проверяет архив и хранит его с правами `600`:

```bash
sudo /opt/reputation-survey/scripts/backup-responses.sh
```

Установка почасового cron-задания:

```bash
sudo chmod 755 /opt/reputation-survey/scripts/backup-responses.sh
sudo install -m 0644 \
  /opt/reputation-survey/ops/reputation-survey-backup.cron \
  /etc/cron.d/reputation-survey-backup
sudo systemctl reload cron
sudo systemctl is-active cron
```

По умолчанию бэкапы создаются в `/opt/reputation-survey/backups` каждый час и хранятся 30 дней.

Проверка последнего архива через изолированное временное восстановление:

```bash
sudo /opt/reputation-survey/scripts/verify-backup.sh
```

Проверка конкретного файла:

```bash
sudo /opt/reputation-survey/scripts/verify-backup.sh \
  /opt/reputation-survey/backups/responses-YYYYMMDDTHHMMSSZ.tar.gz
```

Бэкапы на том же сервере не защищают от потери всего VDS. Настройте регулярную выгрузку во внешнее объектное хранилище, на другой сервер или в систему резервного копирования провайдера.

## Безопасное восстановление

Сначала проверьте архив командой `verify-backup.sh`. Затем восстановите его в новый временный volume, не перезаписывая рабочие данные:

```bash
docker volume create reputation-survey-restore
docker run --rm \
  -v reputation-survey-restore:/target \
  -v /opt/reputation-survey/backups:/backups:ro \
  node:20-alpine \
  sh -c 'tar -xzf /backups/responses-YYYYMMDDTHHMMSSZ.tar.gz -C /target'
```

Проверьте восстановленные данные:

```bash
docker run --rm \
  -e DATA_DIR=/data/responses \
  -e JOURNAL_DIR=/data/journal \
  -v reputation-survey-restore:/data:ro \
  -v "$PWD/scripts":/audit-scripts:ro \
  node:20-alpine \
  node /audit-scripts/audit-data.js
```

Переключение production на восстановленный volume выполняйте только после успешного аудита и отдельного резервного снимка текущего volume.

## Обновление

Используйте тот же Compose-профиль, с которым выполнялось первоначальное production-развёртывание. Для Docker reverse proxy заранее задайте `COMPOSE_FILE` и `REVERSE_PROXY_NETWORK` в `.env`, как описано выше.

```bash
cd /opt/reputation-survey
git pull --ff-only
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1:3000/health
docker exec reputation-survey node /app/scripts/audit-data.js
```

Команда `docker compose up -d --build` пересоздаёт контейнер, но сохраняет именованный volume.

## Тестирование

Проверка синтаксиса и основных маршрутов:

```bash
node --check server.js
node --check public/app.js
node --check public/access.js
node scripts/questionnaire-contract-test.js
node scripts/smoke-test.js
```

Тест конкурентных записей, устаревших ревизий, журнала и перезапуска:

```bash
node scripts/reliability-test.js
```

Он использует временный локальный каталог и не затрагивает production.

`scripts/seed-test-responses.js` создаёт или обновляет ровно 50 демонстрационных ответов с зарезервированными идентификаторами `test-reputation-analytics-*`. Скрипт отказывается перезаписывать запись, если она не помечена как тестовая. На production запускайте его только осознанно и после резервного снимка.

`scripts/remote-reliability-test.js` создаёт запись на указанном удалённом сервере и требует `BASE_URL`, `SURVEY_PASSWORD`, `ANALYTICS_USER`, `ANALYTICS_PASSWORD`. Используйте его только на staging или удаляйте созданную тестовую запись после проверки.

## Приёмочный чек-лист

- [ ] без пароля по production URL показывается только экран входа;
- [ ] неверный пароль отклоняется, корректный открывает анкету;
- [ ] API автосохранения без cookie возвращает `401`;
- [ ] после каждого выбора revision на сервере увеличивается;
- [ ] текст сохраняется после короткой паузы;
- [ ] заполнение восстанавливается после перезагрузки;
- [ ] выбор, сделанный без сети, отправляется после её восстановления;
- [ ] работают полное и досрочное завершение;
- [ ] дашборд без авторизации возвращает `401`;
- [ ] дашборд с корректными данными открывается;
- [ ] `/health` возвращает `storage: writable`;
- [ ] контейнер имеет статус `healthy`;
- [ ] данные сохраняются после пересоздания контейнера;
- [ ] аудит данных возвращает `ok: true`;
- [ ] создан и успешно проверен резервный архив;
- [ ] настроено внешнее резервное копирование;
- [ ] включён HTTPS.

## Эксплуатационные команды

```bash
docker compose ps
docker compose logs --tail=200 reputation-survey
docker inspect --format '{{.State.Health.Status}}' reputation-survey
docker exec reputation-survey node /app/scripts/audit-data.js
docker volume inspect reputation-survey-data
df -h
```

## Структура репозитория

```text
public/                         анкета и аналитический дашборд
scripts/                        тесты, аудит и резервное копирование
ops/                            cron-конфигурация
deploy/                         примеры Caddy и Nginx
server.js                       HTTP-сервер и сохранение данных
Dockerfile                      production-образ
docker-compose.yml              стандартный запуск
docker-compose.shared-network.yml  подключение к Docker reverse proxy
```

## Важные ограничения

- Пароль анкеты и Basic Auth аналитики безопасно использовать только через HTTPS.
- Локальный `localStorage` — страховка, а не основное хранилище.
- Основное хранилище — Docker volume; его нельзя удалять при обновлении.
- Для защиты от полной потери сервера нужен внешний бэкап.
- Изменения механики ревизий, атомарной записи и автосохранения требуют повторного нагрузочного и аварийного тестирования.

Готовый текст передачи проекта разработчикам находится в [`docs/HANDOFF.md`](docs/HANDOFF.md).
