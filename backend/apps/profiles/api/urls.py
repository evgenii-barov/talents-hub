from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    MeProfileView,
    MyProfileEducationsView,
    MyProfileEducationView,
    MyProfileExperiencesView,
    MyProfileExperienceView,
    MyProfileLanguagesView,
    MyProfileLanguageView,
    MyProfileLinksView,
    MyProfileLinkView,
    MyProfileProjectPreferencesView,
    MyProfileProjectPreferenceView,
    MyProfileSkillsView,
    MyProfileSkillView,
    MyProfileVisibilityView,
    ProfileViewSet,
)

router = DefaultRouter()
router.register("profiles", ProfileViewSet, basename="profile")

urlpatterns = [
    path("me/profile/", MeProfileView.as_view(), name="my-profile"),
    path(
        "me/profile/visibility/",
        MyProfileVisibilityView.as_view(),
        name="my-profile-visibility",
    ),
    path("me/profile/skills/", MyProfileSkillsView.as_view(), name="my-profile-skills"),
    path(
        "me/profile/skills/<uuid:item_id>/",
        MyProfileSkillView.as_view(),
        name="my-profile-skill",
    ),
    path("me/profile/languages/", MyProfileLanguagesView.as_view(), name="my-profile-languages"),
    path(
        "me/profile/languages/<uuid:item_id>/",
        MyProfileLanguageView.as_view(),
        name="my-profile-language",
    ),
    path(
        "me/profile/experiences/",
        MyProfileExperiencesView.as_view(),
        name="my-profile-experiences",
    ),
    path(
        "me/profile/experiences/<uuid:item_id>/",
        MyProfileExperienceView.as_view(),
        name="my-profile-experience",
    ),
    path("me/profile/education/", MyProfileEducationsView.as_view(), name="my-profile-education"),
    path(
        "me/profile/education/<uuid:item_id>/",
        MyProfileEducationView.as_view(),
        name="my-profile-education-item",
    ),
    path("me/profile/links/", MyProfileLinksView.as_view(), name="my-profile-links"),
    path(
        "me/profile/links/<uuid:item_id>/",
        MyProfileLinkView.as_view(),
        name="my-profile-link",
    ),
    path(
        "me/profile/project-preferences/",
        MyProfileProjectPreferencesView.as_view(),
        name="my-profile-project-preferences",
    ),
    path(
        "me/profile/project-preferences/<uuid:item_id>/",
        MyProfileProjectPreferenceView.as_view(),
        name="my-profile-project-preference",
    ),
    path("", include(router.urls)),
]
