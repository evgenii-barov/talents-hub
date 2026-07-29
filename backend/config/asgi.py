import os
from typing import Any

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

django_asgi_application = get_asgi_application()


def get_websocket_application() -> Any:
    # Import after Django has populated the app registry; the consumer imports models.
    from apps.chat.routing import websocket_urlpatterns

    return AllowedHostsOriginValidator(AuthMiddlewareStack(URLRouter(websocket_urlpatterns)))


application = ProtocolTypeRouter(
    {
        "http": django_asgi_application,
        "websocket": get_websocket_application(),
    }
)
