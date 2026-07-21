# Основная модель данных Talents Hub

> **Статус:** источник истины для проектирования Django-моделей, миграций, API-схем и правил целостности данных MVP.
>
> Документ основан на утверждённых сценариях и экранах: каталог и профиль специалиста, каталог/детали/создание проекта, каталог и профиль организации, отклики. При расхождении приоритет имеют [границы MVP](mvp.md) и серверные правила из [архитектуры](architecture.md).

## 1. Принципы

- PostgreSQL — единственный источник истины; модель не копирует представление UI.
- Во всех доменных сущностях используется `UUID` как первичный ключ, `created_at`, `updated_at`; пользовательские записи также имеют `created_by`/`updated_by`, где это уместно.
- Денормализованные счётчики (`members_count`, `open_roles_count`) не являются источником истины: либо рассчитываются запросом, либо обновляются транзакционно как кэш.
- Статусы — `TextChoices` и явные серверные переходы. Клиент не может назначить произвольный статус.
- Публичность, модерация и объектные права проверяются в API. Черновики и персональные контакты не попадают в публичные списки.
- Удаление доменных данных — мягкое (`deleted_at`) для сущностей с аудитом; справочники архивируются (`is_active=False`), а не удаляются.
- Временные точки хранятся в UTC. `DateField` используется только там, где важна календарная дата без времени.

## 2. Карта доменов

```text
users.User
 ├─ profiles.Profile ──< ProfileSkill >── taxonomy.Skill
 │    ├─< ProfileLanguage >── taxonomy.Language
 │    ├─< ProfileExperience >── organizations.Organization? / taxonomy.EducationLevel?
 │    ├─< ProfileEducation >── taxonomy.EducationLevel?
 │    ├─< ProfileLink
 │    └─< ProfileProjectPreference >── taxonomy.Category / taxonomy.WorkFormat
 ├─ organizations.OrganizationMembership >── organizations.Organization
 ├─ projects.Project (owner)
 ├─ projects.ProjectRole (creator)
 ├─ applications.ProjectApplication (applicant)
 └─ notifications.Notification

organizations.Organization
 ├─< OrganizationFocus >── taxonomy.FocusArea
 ├─< OrganizationMembership
 └─< projects.Project

projects.Project
 ├─< ProjectFocus >── taxonomy.FocusArea
 ├─< ProjectSkill >── taxonomy.Skill
 ├─< ProjectRole ──< applications.ProjectApplication
 ├─< ProjectMember >── profiles.Profile
 ├─< ProjectContact
 └─< media.MediaAttachment

moderation.ModerationCase ──> profile | organization | project | media
notifications.Notification ──> users.User
audit.AuditEvent ──> users.User + generic target
```

## 3. Общие технические поля и соглашения

Базовые абстрактные классы в `apps.common.models`:

| База | Поля | Применение |
| --- | --- | --- |
| `UUIDTimestampedModel` | `id`, `created_at`, `updated_at` | почти все сущности |
| `SoftDeleteModel` | `deleted_at` | пользовательский контент, заявки |
| `PublishableModel` | `status`, `published_at`, `moderated_at`, `moderated_by`, `moderation_note` | профиль, организация, проект |

Рекомендуемые типы: `models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)`, `DateTimeField(auto_now_add=True)`, `DateTimeField(auto_now=True)`. Текст — Unicode; `SlugField` применяется только для стабильных публичных URL и должен быть уникален среди не удалённых объектов.

## 4. Домены и модели

### 4.1 `users` — идентичность и доступ

`users.User` уже создан и является кастомной моделью Django (`email` — уникальный логин, `username=None`). Не добавлять в неё профильные поля.

| Модель | Ключевые поля | Ограничения |
| --- | --- | --- |
| `User` | `email`, `first_name`, `last_name`, `is_active`, `is_staff`, `last_login` | email уникален, хранится нормализованным |
| `UserRole` | `user`, `role` | роли: `talent`, `project_lead`, `organization_member`, `moderator`, `admin`; `Unique(user, role)` |
| `ExternalIdentity` | `user`, `provider`, `provider_account_id`, `email_at_provider`, `linked_at` | `Unique(provider, provider_account_id)`; интегрируется с allauth, не хранит токены в открытом виде |

Роли аддитивны: один пользователь может быть специалистом, лидером проекта и представителем организации одновременно. `admin` определяется также стандартными `is_staff`/`is_superuser`; бизнес-роль не заменяет Django permissions.

### 4.2 `taxonomy` — управляемые справочники

Все справочники имеют минимум `id`, `name`, `slug`, `is_active`, `sort_order`. Изменяемые значения, участвующие в фильтрах, не должны быть свободным текстом.

| Модель | Дополнительные поля | Использование в дизайне |
| --- | --- | --- |
| `Category` | `description` | Digital, Education, Climate и др. |
| `Skill` | `category` nullable | навыки профиля и требования ролей |
| `FocusArea` | `description` | youth development, education, policy, innovation и т. п. |
| `Language` | `code` (ISO 639-1/BCP 47), `native_name` | язык профиля и рабочий язык проекта |
| `Country` | `code` (ISO 3166-1 alpha-2), `name` | страна профиля/организации |
| `City` | `country`, `name` | город; `Unique(country, name)` |
| `EducationLevel` | — | уровень образования |
| `WorkFormat` | `remote`, `hybrid`, `onsite` | фильтр и условия проекта |

`ProjectStage` лучше реализовать как enum проекта (`idea`, `team_formation`, `prototype`, `pilot`, `active`, `completed`) — это жизненный цикл, а не администраторский справочник.

### 4.3 `profiles` — профиль специалиста

`Profile` — один расширенный профиль на `User`.

| Модель | Основные поля | Связи и правила |
| --- | --- | --- |
| `Profile` | `user OneToOne`, `slug`, `display_name`, `headline`, `bio`, `country`, `city`, `avatar`, `visibility`, `availability`, `availability_note`, `remote_preference`, `timezone`, `is_verified` | `display_name` выводится как имя; `visibility`: `private`, `members`, `public`; публичный каталог — только `public + published + approved` |
| `ProfileSkill` | `profile`, `skill`, `level` nullable, `is_primary`, `sort_order` | `Unique(profile, skill)`; уровень: `beginner`, `intermediate`, `advanced`, `expert` |
| `ProfileLanguage` | `profile`, `language`, `proficiency`, `is_primary` | `Unique(profile, language)`; proficiency: `native`, `a1`…`c2` |
| `ProfileExperience` | `profile`, `organization_name`, `organization` nullable, `title`, `location_text`, `work_format`, `started_on`, `ended_on`, `is_current`, `description`, `sort_order` | `ended_on IS NULL` при `is_current=True`; дата окончания не раньше начала |
| `ProfileEducation` | `profile`, `institution_name`, `degree`, `field_of_study`, `education_level` nullable, `started_on`, `ended_on`, `credential_url`, `is_verified`, `sort_order` | credential хранится как URL/медиа, не как невалидированный HTML |
| `ProfileLink` | `profile`, `kind`, `url`, `label`, `sort_order` | kind: `website`, `linkedin`, `portfolio`, `github`, `other`; URL валидируется |
| `ProfileProjectPreference` | `profile`, `category` nullable, `focus_area` nullable, `work_format` nullable, `note` | минимум одна из ссылок задана; используется для интересов и поиска |

Экран профиля требует: имя, заголовок, локацию, верификацию, доступность, языки, навыки, образование, опыт, ссылки, участие в проектах и предпочтения. Последние два пункта получают данные из `projects`, а не дублируются в `Profile`.

### 4.4 `organizations` — организации и представители

| Модель | Основные поля | Связи и правила |
| --- | --- | --- |
| `Organization` | `slug`, `legal_name`, `display_name`, `organization_type`, `tagline`, `description`, `website_url`, `email`, `country`, `city`, `location_text`, `founded_year`, `logo`, `visibility`, `status`, `is_verified`, `verified_at` | публична после `approved + published`; `organization_type`: `ngo`, `education`, `business`, `government`, `community`, `other` |
| `OrganizationFocus` | `organization`, `focus_area`, `sort_order` | `Unique(organization, focus_area)` |
| `OrganizationMembership` | `organization`, `user`, `role`, `status`, `title`, `joined_at`, `left_at` | роль: `owner`, `admin`, `editor`, `member`; уникальна активная пара `(organization, user)` |

Организация владеет проектами через `Project.organization`, но проект также всегда имеет персонального `owner`. Это покрывает инициативы организации и независимые проекты лидера.

### 4.5 `projects` — проекты, роли и команда

#### `Project`

| Группа | Поля |
| --- | --- |
| Идентификация | `slug`, `title`, `short_description`, `description` |
| Владелец | `owner FK User`, `organization FK Organization nullable` |
| Содержание | `category FK`, `stage`, `problem_statement`, `goal_statement`, `expected_outcome`, `timeline_text` |
| Формат | `scope` (`local`, `national`, `international`), `country nullable`, `city nullable`, `work_format`, `working_language FK Language` |
| Даты | `starts_on`, `ends_on`, `application_deadline` |
| Публикация | `status`, `published_at`, `moderated_at`, `moderated_by`, `moderation_note`, `is_featured` |

`Project.status`: `draft`, `pending_moderation`, `published`, `changes_requested`, `archived`, `rejected`, `completed`.

Инварианты:

- `ends_on >= starts_on`, если обе даты заданы;
- `application_deadline <= starts_on`, если обе даты заданы;
- публиковать можно только с названием, описанием, категорией, форматом, языком, хотя бы одной открытой ролью и валидными сроками;
- менять `owner` можно только аудитируемой административной операцией;
- публичный каталог выбирает только `status=published`, без `deleted_at`, с не истёкшим дедлайном (или явно помечает проект как закрытый).

#### Связанные модели

| Модель | Основные поля | Ограничения |
| --- | --- | --- |
| `ProjectFocus` | `project`, `focus_area` | `Unique(project, focus_area)` |
| `ProjectSkill` | `project`, `skill`, `importance` | `Unique(project, skill)`; importance: `nice_to_have`, `required` |
| `ProjectRole` | `project`, `title`, `description`, `first_responsibility`, `commitment_hours_per_week`, `seats_total`, `seats_filled`, `status`, `sort_order` | status: `open`, `paused`, `filled`, `closed`; `0 <= seats_filled <= seats_total` |
| `ProjectMember` | `project`, `profile`, `project_role nullable`, `membership_role`, `status`, `joined_at`, `left_at` | один активный участник на проект/профиль; `membership_role`: `owner`, `lead`, `contributor`, `advisor` |
| `ProjectContact` | `project`, `name`, `email`, `role_label`, `is_public` | можно материализовать из owner, но отдельная сущность нужна для публичного контактного лица |

Открытые места на экранах считаются как `SUM(ProjectRole.seats_total - seats_filled)` только по `status=open`. Участники команды — только активные `ProjectMember`.

### 4.6 `applications` — отклики на роли

| Модель | Основные поля | Ограничения |
| --- | --- | --- |
| `ProjectApplication` | `project_role`, `applicant FK User`, `cover_letter`, `status`, `submitted_at`, `reviewed_at`, `reviewed_by`, `review_note`, `withdrawn_at` | одна активная заявка на пару `(project_role, applicant)` |

`ProjectApplication.status`: `submitted`, `in_review`, `shortlisted`, `accepted`, `rejected`, `withdrawn`, `cancelled`.

Разрешённые переходы:

```text
submitted → in_review | withdrawn | cancelled
in_review → shortlisted | accepted | rejected | withdrawn | cancelled
shortlisted → accepted | rejected | withdrawn | cancelled
accepted → cancelled
```

При `accepted` в одной транзакции создаётся `ProjectMember`, увеличивается `seats_filled`, а другие активные заявки на это же место получают предсказуемый статус (`rejected` либо остаются в review по правилу роли). Нельзя подать заявку на свою роль, закрытую роль, опубликованно-недоступный проект или при отсутствии публичного/допущенного профиля.

### 4.7 `media` — файлы и изображения

| Модель | Основные поля | Правила |
| --- | --- | --- |
| `MediaAsset` | `uploaded_by`, `storage_key`, `original_name`, `content_type`, `size_bytes`, `checksum`, `status`, `scan_result`, `width`, `height`, `alt_text`, `created_at` | файл хранится в S3; БД хранит только метаданные/ключ; status: `pending`, `available`, `quarantined`, `rejected`, `deleted` |
| `MediaAttachment` | `asset`, `content_type`, `object_id`, `purpose`, `sort_order` | generic relation допустима только здесь; purpose: `avatar`, `logo`, `project_cover`, `document`, `credential` |

Прямой публичный URL не хранится как постоянный доступ к приватному файлу. API выдаёт короткоживущую подписанную ссылку только после проверки прав.

### 4.8 `moderation`, `notifications`, `audit`

| Модель | Основные поля | Назначение |
| --- | --- | --- |
| `ModerationCase` | generic `target`, `status`, `reason_code`, `reporter nullable`, `assigned_to nullable`, `decision_note`, `opened_at`, `resolved_at` | проверка профиля, проекта, организации, медиа и жалоб |
| `Notification` | `recipient`, `type`, `payload JSONB`, `read_at`, `email_status`, `created_at` | внутренние и email-уведомления; payload содержит ссылки/снимок, но не критичный источник истины |
| `AuditEvent` | `actor nullable`, generic `target`, `action`, `before JSONB`, `after JSONB`, `request_id`, `ip_hash`, `created_at` | неизменяемый аудит значимых действий |
| `OutboxEvent` | `topic`, `payload JSONB`, `occurred_at`, `processed_at`, `attempts`, `last_error` | гарантированная постановка email/фоновых задач после commit |

`ModerationCase.status`: `open`, `in_review`, `approved`, `changes_requested`, `rejected`, `closed`. Решение по кейсу обновляет публикационный статус целевого объекта в той же бизнес-операции и создаёт `AuditEvent`/`OutboxEvent`.

## 5. Права доступа

| Действие | Кто может |
| --- | --- |
| Создать/редактировать черновик профиля | владелец профиля |
| Увидеть приватный профиль | владелец, модератор/администратор |
| Редактировать организацию | активный `OrganizationMembership` с `owner`, `admin` или `editor` |
| Создать проект от организации | персональный owner с правом организации `owner/admin/editor` |
| Редактировать проект | его owner либо уполномоченный представитель организации |
| Читать отклики | project owner, организация с достаточной ролью, модератор при необходимости |
| Менять статус отклика | только авторизованный владелец проекта/организации по state machine |
| Рассматривать moderation case | moderator/admin |

В queryset/API обязательны фильтры по `visibility`, `status`, `deleted_at` и object-level access; нельзя полагаться только на скрытие кнопок во frontend.

## 6. Индексы и ограничения PostgreSQL

Минимальный набор:

- уникальные: `User.email`, публичные `slug`, пары всех M2M-моделей;
- частичные уникальные индексы для активных `OrganizationMembership`, `ProjectMember` и `ProjectApplication` (`WHERE deleted_at IS NULL AND status IN (...)`);
- btree: `(status, published_at DESC)` для `Project`, `Organization`, `Profile`; `(project, status)` для `ProjectRole`; `(project_role, status)` для заявок;
- btree на FK, даты дедлайна, `country/city/category/work_format/stage`;
- GIN FTS (русский/английский конфиг или составной документ) на публичные `Profile`, `Project`, `Organization`; `pg_trgm` на `title`, `display_name`, `slug` для tolerant search;
- check constraints: диапазон мест, корректный период дат, единственный primary language/skill при необходимости (частичный unique index).

Поиск строится на сервере из опубликованных сущностей. Поля `search_vector` можно поддерживать `GeneratedField`/триггером или асинхронным обновлением, но результат поиска обязан быть согласован с публикационным статусом.

## 7. Соответствие экранов сущностям

| Экран | Основной aggregate | Что читается/изменяется |
| --- | --- | --- |
| Регистрация / вход | `User`, `ExternalIdentity` | email, пароль, внешние провайдеры |
| Профиль специалиста | `Profile` | навыки, языки, опыт, образование, ссылки, предпочтения, доступность |
| Каталог специалистов | `Profile` | FTS и фильтры по навыкам, локации, языкам, формату, доступности |
| Создание проекта | `Project` | basics, brief, `ProjectRole`, даты, формат, публикация |
| Каталог проектов | `Project` | поиск/фильтры по category, stage, role/skill, work format, deadline, language |
| Детали проекта | `Project` | роли, команда, организатор, контакты, результат, отклик |
| Каталог организаций | `Organization` | поиск/фильтры по country, focus areas, размеру (если будет введён), verified |
| Профиль организации | `Organization` | focus areas, representatives, открытые проекты, контакты |
| Кабинет лидера | `ProjectApplication` | просмотр и допустимые переходы статусов |

## 8. Порядок реализации миграций

1. `common`, существующий `users.User`, роли и allauth.
2. `taxonomy` и начальные fixture-данные.
3. `media` (валидация и приватный доступ) и `profiles`.
4. `organizations` и memberships.
5. `projects`, roles, team, контакты.
6. `applications` со state machine и транзакционным принятием.
7. `moderation`, `audit`, `notifications`, `outbox`.
8. Индексы FTS/trigram, публичные API и фоновые задачи.

Каждая миграция сопровождается: модельными тестами ограничений, API-тестами прав, тестами переходов статусов и аудитом критичных операций.

## 9. Подтверждённые границы MVP

1. Отдельная сущность **Opportunity** в MVP не создаётся.
2. Размер организации (`employee_count_range`) в MVP не хранится.
3. Верификация выполняется вручную модератором. Документы и их автоматическая проверка не входят в MVP; модель медиа оставляет возможность добавить их позднее.
4. В профиле можно указывать любые ссылки и контакты. Доступ к ним подчиняется видимости профиля; email пользователя не выдаётся публичным API.
5. Интерфейс запускается на русском и английском языках. Справочник `Language` хранит расширяемые BCP 47-коды, поэтому дополнительные языки можно добавить без изменения схемы.
