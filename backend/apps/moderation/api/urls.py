from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ModerationCaseViewSet, ModerationDecisionView, ModerationSubmissionView

router = DefaultRouter()
router.register("moderation/cases", ModerationCaseViewSet, basename="moderation-case")

urlpatterns = [
    path("moderation/submit/", ModerationSubmissionView.as_view(), name="moderation-submit"),
    path(
        "moderation/cases/<uuid:case_id>/decision/",
        ModerationDecisionView.as_view(),
        name="moderation-decision",
    ),
    path("", include(router.urls)),
]
