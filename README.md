# Talents Hub

[![CI](https://github.com/pudgewithmom/talents-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/pudgewithmom/talents-hub/actions/workflows/ci.yml)

**Talents Hub** — международное молодёжное профессиональное сообщество для поиска специалистов, проектных команд и возможностей сотрудничества.

Production-код MVP развивается в `main`. Ранний статический прототип сохранён в ветке `prototype_for_sco` как источник пользовательских сценариев и функциональных требований.

## Статус

Ветка `main` содержит полнофункциональный MVP: Next.js-интерфейс, Django/DRF API, регистрацию и OAuth, профили, организации, проекты и отклики, модерацию, уведомления, загрузку медиа и WebSocket-чат. Локальный стек воспроизводится через Docker Compose, а frontend и backend проходят автоматические проверки в CI.

## Цель MVP

Дать пользователям возможность:

- зарегистрироваться и безопасно войти в систему;
- создать и опубликовать профиль специалиста;
- находить специалистов и проекты с помощью поиска и фильтров;
- создавать проект, собирать команду и обрабатывать отклики;
- получать уведомления и проходить необходимую модерацию.

Подробные границы релиза находятся в [документе MVP](docs/mvp.md).

## Принятый технологический стек

| Область | Решение |
| --- | --- |
| Frontend | Next.js, React, TypeScript |
| UI | shadcn/ui, Tailwind CSS |
| Backend | Django 5.2 LTS, Django REST Framework |
| Авторизация | email+пароль, Google OAuth, GitHub OAuth; django-allauth |
| Данные и поиск | PostgreSQL, Full Text Search, `pg_trgm` |
| Фоновые задачи | Celery, Redis |
| Файлы | S3-совместимое объектное хранилище |
| Почта | Yandex Cloud Postbox API, SPF/DKIM/DMARC |
| Аналитика | Self-hosted Umami, consent-based product events |
| Развёртывание | Docker, managed PostgreSQL, reverse proxy/CDN, CI/CD |

Подробнее — в [архитектурном решении](docs/architecture.md).

## Документация

- [MVP: продуктовые границы](docs/mvp.md)
- [Целевая архитектура](docs/architecture.md)
- [План старта разработки](docs/roadmap.md)
- [Основная модель данных](docs/data-model.md)
- [API-контракт MVP](docs/api.md)
- [Мониторинг и Sentry](docs/monitoring.md)
- [Продуктовая аналитика Umami](docs/analytics.md)
- [Frontend: запуск и соглашения](frontend/README.md)
- [Production deployment](docs/deployment.md)

## Ветки

- `main` — актуальная реализация MVP и документация;
- `prototype_for_sco` — сохранённый статический демонстрационный прототип.

## Быстрый старт backend

Подробные команды находятся в [README backend](backend/README.md). Коротко:

```powershell
cd backend
Copy-Item .env.example .env
.\.venv\Scripts\Activate.ps1
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

Или поднимите полный локальный стек (Django, PostgreSQL, Redis и Celery):

```powershell
Copy-Item backend\.env.example backend\.env
docker compose up --build
```
