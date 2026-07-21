from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MyProjectRolesView, MyProjectsView, MyProjectView, ProjectViewSet

router = DefaultRouter()
router.register("projects", ProjectViewSet, basename="project")

urlpatterns = [
    path("me/projects/", MyProjectsView.as_view(), name="my-projects"),
    path("me/projects/<uuid:project_id>/", MyProjectView.as_view(), name="my-project"),
    path(
        "me/projects/<uuid:project_id>/roles/",
        MyProjectRolesView.as_view(),
        name="my-project-roles",
    ),
    path("", include(router.urls)),
]
