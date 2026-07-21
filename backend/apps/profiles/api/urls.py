from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MeProfileView, ProfileViewSet

router = DefaultRouter()
router.register("profiles", ProfileViewSet, basename="profile")

urlpatterns = [
    path("me/profile/", MeProfileView.as_view(), name="my-profile"),
    path("", include(router.urls)),
]
