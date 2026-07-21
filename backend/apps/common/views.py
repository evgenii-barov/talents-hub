from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def health_check(request: HttpRequest) -> JsonResponse:
    """Return a lightweight liveness response for Docker and load balancers."""
    return JsonResponse({"status": "ok"})
