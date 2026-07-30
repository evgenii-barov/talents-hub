from django.core.cache import cache
from django.db import connection
from django.http import HttpRequest, JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.http import require_GET


@require_GET
def health_check(request: HttpRequest) -> JsonResponse:
    """Return a lightweight liveness response for Docker and load balancers."""
    return JsonResponse({"status": "ok"})


@require_GET
def readiness_check(request: HttpRequest) -> JsonResponse:
    """Verify that dependencies required to serve requests are available."""
    checks = {"database": False, "cache": False}
    try:
        connection.ensure_connection()
        checks["database"] = connection.is_usable()
    except Exception:  # noqa: BLE001 - dependency failures must become a 503 response.
        checks["database"] = False

    try:
        cache_key = "health:readiness"
        cache.set(cache_key, "ok", timeout=10)
        checks["cache"] = cache.get(cache_key) == "ok"
    except Exception:  # noqa: BLE001 - dependency failures must become a 503 response.
        checks["cache"] = False

    ready = all(checks.values())
    return JsonResponse(
        {"status": "ready" if ready else "unavailable", "checks": checks},
        status=200 if ready else 503,
    )


@require_GET
def csrf_token(request: HttpRequest) -> JsonResponse:
    """Set Django's CSRF cookie for browser clients using session authentication."""
    return JsonResponse({"csrfToken": get_token(request)})
