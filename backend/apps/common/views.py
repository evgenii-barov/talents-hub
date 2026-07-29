from django.http import HttpRequest, JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.http import require_GET


@require_GET
def health_check(request: HttpRequest) -> JsonResponse:
    """Return a lightweight liveness response for Docker and load balancers."""
    return JsonResponse({"status": "ok"})


@require_GET
def csrf_token(request: HttpRequest) -> JsonResponse:
    """Set Django's CSRF cookie for browser clients using session authentication."""
    return JsonResponse({"csrfToken": get_token(request)})
