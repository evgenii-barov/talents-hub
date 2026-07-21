# Talents Hub

**Talents Hub** — цифровая платформа для поиска специалистов, проектных команд и карьерных возможностей в молодёжном треке ШОС.

Репозиторий начинает разработку MVP с нуля. Демонстрационный сайт сохранён в ветке `prototype_for_sco` как источник пользовательских сценариев, контента и функциональных требований; он не является основой production-кода.

## Статус

Ветка `main` содержит документацию и технический фундамент backend. Прикладные модули будут добавляться по вертикальным срезам после утверждения дизайна, модели ролей и границ первого релиза.

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
| Авторизация | django-allauth: email, Google, Yandex, VK |
| Данные и поиск | PostgreSQL, Full Text Search, `pg_trgm` |
| Фоновые задачи | Celery, Redis |
| Файлы | S3-совместимое объектное хранилище |
| Почта | Yandex Cloud Postbox по SMTP |
| Развёртывание | Docker, managed PostgreSQL, reverse proxy/CDN, CI/CD |

Подробнее — в [архитектурном решении](docs/architecture.md).

## Документация

- [MVP: продуктовые границы](docs/mvp.md)
- [Целевая архитектура](docs/architecture.md)
- [План старта разработки](docs/roadmap.md)

## Ветки

- `main` — документация и будущая разработка MVP;
- `prototype_for_sco` — сохранённый статический демонстрационный прототип.

## Быстрый старт backend

Подробные команды находятся в [README backend](backend/README.md). Коротко:

```powershell
cd backend
Copy-Item .env.example .env
.\.venv\Scripts\Activate.ps1
python manage.py runserver
```

Или поднимите полный локальный стек (Django, PostgreSQL, Redis и Celery):

```powershell
Copy-Item backend\.env.example backend\.env
docker compose up --build
```
