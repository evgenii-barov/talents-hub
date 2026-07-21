FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install --no-install-recommends -y build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 10001 appuser

COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install ".[dev]"

COPY . ./
RUN chmod +x docker/entrypoint.sh \
    && chown -R appuser:appuser /app

USER appuser
ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
