# Backend

## Локальный запуск через virtualenv

Сначала поднимите инфраструктуру из корня репозитория. PostgreSQL опубликован на
`localhost:55432`, чтобы не конфликтовать с локально установленным PostgreSQL.

```powershell
cd ..
docker compose up -d db redis
cd backend
```

```powershell
Copy-Item .env.example .env
.\.venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py runserver
```

## Запуск через Docker

```powershell
Copy-Item .env.example .env
docker compose up --build
```

После запуска доступны:

- API health-check: `http://localhost:8000/api/health/`
- OpenAPI schema: `http://localhost:8000/api/schema/`
- Swagger UI: `http://localhost:8000/api/docs/`

Команды качества:

```powershell
ruff check .
pytest
mypy apps config
```
