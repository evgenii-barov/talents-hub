from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.common.views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls")),
    path("api/health/", health_check, name="health-check"),
    path("api/v1/", include("apps.profiles.api.urls")),
    path("api/v1/", include("apps.organizations.api.urls")),
    path("api/v1/", include("apps.projects.api.urls")),
    path("api/v1/", include("apps.applications.api.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
