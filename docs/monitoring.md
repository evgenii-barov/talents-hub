# Мониторинг MVP

## Sentry

Backend уже готов к Sentry. Интеграция охватывает Django и Celery, поэтому в одном проекте будут видны HTTP-ошибки, фоновые задачи и их stack trace.

1. Создайте в Sentry проект **Python / Django** с именем `talents-hub-backend`.
2. Скопируйте его DSN в неотслеживаемый `backend/.env` или в секреты окружения deployment.
3. Для production задайте:

```dotenv
SENTRY_DSN=https://…
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=backend@<git-sha>
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.0
```

`SENTRY_DSN` оставляют пустым в локальной разработке. SDK не инициализируется, не делает сетевых запросов и не мешает тестам. В staging можно временно поставить `SENTRY_TRACES_SAMPLE_RATE=1.0`, чтобы увидеть все запросы; в production достаточно 0.1 на старте.

В коде выключена отправка PII (`send_default_pii=False`): SDK не прикладывает IP, cookies или стандартные персональные данные к событиям.

## Что настроить в Sentry

- Alert: новая ошибка (`first seen`) в `production`.
- Alert: любая нерешённая ошибка с уровнем `error` в течение 10 минут.
- Alert: падение или повторные ошибки Celery-задачи `apps.notifications.tasks.process_outbox_event`.
- Release health и performance для релизов, в которых задан `SENTRY_RELEASE`.

## Frontend

При следующем этапе создайте отдельный проект **JavaScript / Next.js**: `talents-hub-frontend`. Его публичный DSN будет храниться в `NEXT_PUBLIC_SENTRY_DSN`; sourcemaps и release будут подключены во время frontend-интеграции. Backend и frontend не должны использовать один Sentry-проект: так проще разделять владельцев ошибок, алерты и релизы.

## Локальная проверка состояния

- `GET /api/health/` — доступность Django;
- `docker compose ps` — статусы Django, Celery, PostgreSQL, Redis и frontend;
- `/api/docs/` — доступность API-схемы.
