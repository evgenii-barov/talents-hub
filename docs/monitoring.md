# Мониторинг MVP

## Self-hosted GlitchTip

Production использует [GlitchTip](https://glitchtip.com/documentation/install/) — свободный
Sentry-совместимый сервер ошибок. Он доступен только через `errors.talents-hub.online`, хранит
данные в отдельных PostgreSQL и Valkey и не публикует их порты наружу.

Контейнер запускается в all-in-one режиме. В production отключены открытая регистрация после
создания первого пользователя, social signup, OpenAPI, MCP, cold storage и сбор логов. Ошибки
хранятся 30 дней, транзакции — 14 дней. SMTP не требуется: уведомления можно позднее направить
в webhook.

После первого запуска создайте администратора GlitchTip:

```bash
docker compose --env-file .env.production -f compose.production.yaml \
  exec glitchtip ./manage.py createsuperuser
```

Затем войдите на `https://errors.talents-hub.online`, создайте организацию и проект
`talents-hub-backend`, скопируйте DSN проекта в `.env.production`:

```dotenv
SENTRY_DSN=https://<public-key>@errors.talents-hub.online/<project-id>
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=backend@<git-sha>
SENTRY_TRACES_SAMPLE_RATE=0.01
SENTRY_PROFILES_SAMPLE_RATE=0.0
```

После изменения DSN пересоздайте backend и Celery:

```bash
docker compose --env-file .env.production -f compose.production.yaml \
  up -d --force-recreate backend celery
```

SDK охватывает Django и Celery. Отправка PII и автоматическое отслеживание сессий отключены;
GlitchTip не получает стандартные персональные данные, IP и cookies. Пустой `SENTRY_DSN`
полностью отключает SDK.

## Проверка события

Отправьте контролируемое событие из Django shell:

```bash
docker compose --env-file .env.production -f compose.production.yaml exec backend \
  python manage.py shell -c "import sentry_sdk; sentry_sdk.capture_message('Talents Hub production test')"
```

Убедитесь, что событие появилось в проекте с окружением `production`, после чего пометьте его
resolved. Не создавайте намеренно HTTP 500 на публичном endpoint.

## Алерты

В проекте GlitchTip создайте alert для новой ошибки и добавьте webhook-получателя. SMTP пока не
настроен, поэтому email-уведомления GlitchTip будут только выводиться в логи контейнера.

## Локальные health-checks

- `GET /api/health/` — доступность Django;
- `GET /api/ready/` — готовность Django и его зависимостей;
- `docker compose ... ps` — состояние приложения и мониторинга;
- `https://errors.talents-hub.online` — интерфейс GlitchTip.
