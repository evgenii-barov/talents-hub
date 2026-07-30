# MVP: запуск и недостающие интеграции

## Email

Регистрация создаёт неактивную учётную запись и отправляет письмо со ссылкой на `/verify-email`. Сброс пароля отправляет ссылку на `/reset-password`. До подключения домена письма выводятся в лог backend-контейнера через console email backend.

После появления домена нужно задать в `backend/.env`:

```dotenv
FRONTEND_URL=https://your-domain.example
DEFAULT_FROM_EMAIL=noreply@your-domain.example
DJANGO_EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.provider.example
EMAIL_PORT=587
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...
EMAIL_USE_TLS=true
```

Подойдёт SMTP-провайдер или Yandex Cloud Postbox с SMTP-совместимыми реквизитами. Логика писем уже отделена в `apps/users/emails.py`, поэтому менять API и frontend не потребуется.

## Новые пользовательские маршруты

- `/signup`, `/verify-email`, `/forgot-password`, `/reset-password` — onboarding;
- `/profile/complete` — аватар, страна, город, образование и внешние ссылки;
- `/applications` — собственные отклики и кандидаты в проекты владельца;
- `/moderation` — очередь для модераторов;
- `https://admin.talents-hub.online/admin/` — управление пользователями, ролями и справочниками.

## API

| Метод | Путь |
| --- | --- |
| POST | `/api/v1/auth/signup/` |
| POST | `/api/v1/auth/verify-email/` |
| POST | `/api/v1/auth/password-reset/` |
| POST | `/api/v1/auth/password-reset/confirm/` |
| POST | `/api/v1/me/media/` |
| GET/POST | `/api/v1/me/profile/education/` |
| PATCH/DELETE | `/api/v1/me/profile/education/{id}/` |
| GET/POST | `/api/v1/me/profile/links/` |
| PATCH/DELETE | `/api/v1/me/profile/links/{id}/` |
| GET | `/api/v1/me/applications/` |
| GET | `/api/v1/me/projects/{id}/applications/` |

Публичные каталоги `/profiles/?search=` и `/projects/?search=` используют PostgreSQL full-text search и `pg_trgm`; запрос проверяется и в кириллице, и в транслитерации.

## Начальные справочники

Миграции включают расширение PostgreSQL `pg_trgm`. После миграции выполните команду (она идемпотентна):

```powershell
docker compose exec backend python manage.py seed_mvp_taxonomy
```

Команда создаёт категории, фокус-направления, форматы работы, уровни образования, языки, страны, города и базовый набор навыков. Названия включают русскую и английскую форму; позже это можно заменить полноценной таблицей локализаций без смены ссылочных UUID.
