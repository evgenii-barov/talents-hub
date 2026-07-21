from django.urls import path

from .views import ProjectApplicationTransitionView, ProjectRoleApplicationView

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
]
