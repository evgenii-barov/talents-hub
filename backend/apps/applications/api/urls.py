from django.urls import path

from .views import (
    MyApplicationsView,
    MyProjectApplicationsView,
    ProjectApplicationTransitionView,
    ProjectRoleApplicationView,
)

urlpatterns = [
    path(
        "project-roles/<uuid:role_id>/applications/",
        ProjectRoleApplicationView.as_view(),
        name="role-apply",
    ),
    path(
        "applications/<uuid:application_id>/transition/",
        ProjectApplicationTransitionView.as_view(),
        name="application-transition",
    ),
    path("me/applications/", MyApplicationsView.as_view(), name="my-applications"),
    path(
        "me/projects/<uuid:project_id>/applications/",
        MyProjectApplicationsView.as_view(),
        name="my-project-applications",
    ),
]
