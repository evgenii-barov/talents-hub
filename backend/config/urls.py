from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.common.views import csrf_token, health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls")),
    path("api/health/", health_check, name="health-check"),
    path("api/csrf/", csrf_token, name="csrf-token"),
    path("api/v1/", include("apps.users.api.urls")),
    path("api/v1/", include("apps.taxonomy.api.urls")),
    path("api/v1/", include("apps.media.api.urls")),
    path("api/v1/", include("apps.profiles.api.urls")),
    path("api/v1/", include("apps.organizations.api.urls")),
    path("api/v1/", include("apps.projects.api.urls")),
    path("api/v1/", include("apps.applications.api.urls")),
    path("api/v1/", include("apps.chat.api.urls")),
    path("api/v1/", include("apps.moderation.api.urls")),
    path("api/v1/", include("apps.notifications.api.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
