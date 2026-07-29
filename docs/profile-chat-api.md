# Редактирование профиля и чат

Методы REST используют Django session cookie. Для изменяющих REST-запросов требуется CSRF-токен.

## Профиль

- `GET|POST /api/v1/me/profile/skills/`
- `PATCH|DELETE /api/v1/me/profile/skills/{id}/`
- `GET|POST /api/v1/me/profile/languages/`
- `PATCH|DELETE /api/v1/me/profile/languages/{id}/`
- `GET|POST /api/v1/me/profile/experiences/`
- `PATCH|DELETE /api/v1/me/profile/experiences/{id}/`

Удаление мягкое. Навык и язык не могут повторяться в одном профиле. При установке
`is_primary=true` сервер автоматически снимает признак с предыдущей основной записи.

## REST чат

- `GET|POST /api/v1/conversations/`
- `GET|POST /api/v1/conversations/{id}/messages/`
- `POST /api/v1/conversations/{id}/read/`

Создание диалога принимает массивы `participant_profile_ids` и `organization_ids`, обязательное
первое `message`, а также необязательные `project_id`, `subject` и `sender_organization_id`. Сервер
сам определяет `kind`:

- `direct` — два таланта;
- `organization` — талант и одна организация;
- `group` — больше двух сторон или смешанный состав.

Получателями могут быть владельцы опубликованных публичных профилей и активные участники публичных
организаций. Для каждого пользователя хранится собственная отметка прочтения. Организация остаётся
отдельной стороной беседы, но сообщение всегда имеет конкретного пользователя-автора. Активный
участник организации может передать `sender_organization_id`, чтобы сообщение отображалось от её
имени; это сохраняет аудит реального отправителя.

После нового сообщения создаётся in-app уведомление `chat.message`; аудит хранит факт отправки без
текста сообщения.

## Realtime WebSocket

Авторизованное подключение: `ws(s)://<backend-host>/ws/chat/`. Сессия передаётся cookie, а Origin
проверяется по `DJANGO_ALLOWED_HOSTS`; в production туда нужно добавить публичный домен frontend.

Команды клиента:

```json
{"type":"chat.message.send","conversation_id":"uuid","client_message_id":"uuid","body":"Привет","sender_organization_id":"uuid или null"}
```

```json
{"type":"chat.conversation.read","conversation_id":"uuid"}
```

Сервер отправляет участникам события `chat.message.created` и `chat.conversation.read` во все
открытые вкладки. Сообщение рассылается только после коммита PostgreSQL. `client_message_id` делает
повторную отправку после сбоя сети идемпотентной.

REST остаётся источником истории. При открытии диалога и пока WebSocket переподключается frontend
запрашивает REST; постоянный polling при активном соединении не используется. Вложения пока не входят
в MVP.
