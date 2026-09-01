from typing import Any

from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector, TrigramSimilarity
from django.db import transaction
from django.db.models import Q, QuerySet
from django.db.models.functions import Greatest
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore[import-untyped]
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.filters import OrderingFilter
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditEvent
from apps.common.models import PublicationStatus
from apps.common.pagination import CataloguePagination
from apps.common.search import search_terms, transliterate
from apps.profiles.models import (
    Profile,
    ProfileEducation,
    ProfileExperience,
    ProfileLanguage,
    ProfileLink,
    ProfileProjectPreference,
    ProfileSkill,
)
from apps.users.legal import (
    PUBLIC_PROFILE_VERSION,
    record_legal_acceptance,
    withdraw_legal_acceptance,
)
from apps.users.models import LegalAcceptance, UserRole

from .serializers import (
    MyProfileSerializer,
    ProfileEducationSerializer,
    ProfileEducationWriteSerializer,
    ProfileExperienceSerializer,
    ProfileExperienceWriteSerializer,
    ProfileLanguageSerializer,
    ProfileLanguageWriteSerializer,
    ProfileLinkSerializer,
    ProfileLinkWriteSerializer,
    ProfileProjectPreferenceSerializer,
    ProfileProjectPreferenceWriteSerializer,
    ProfilePublicSerializer,
    ProfileSkillSerializer,
    ProfileSkillWriteSerializer,
    ProfileVisibilitySerializer,
    ProfileWriteSerializer,
)


class ProfileViewSet(viewsets.ReadOnlyModelViewSet[Profile]):
    """Public catalogue: private, unpublished, and deleted profiles never appear."""

    permission_classes = (permissions.AllowAny,)
    serializer_class = ProfilePublicSerializer
    lookup_field = "slug"
    pagination_class = CataloguePagination
    filterset_fields = {
        "country__code": ["exact"],
        "city": ["exact"],
        "skills__skill__slug": ["exact"],
        "languages__language__code": ["exact"],
        "remote_preference__slug": ["exact"],
        "availability": ["exact"],
        "is_verified": ["exact"],
    }
    filter_backends = (DjangoFilterBackend, OrderingFilter)
    ordering_fields = ("display_name", "published_at", "updated_at")
    ordering = ("-published_at", "display_name")

    def get_queryset(self) -> QuerySet[Profile]:
        queryset = (
            Profile.objects.public()
            .select_related("country", "city", "avatar", "remote_preference")
            .prefetch_related(
                "skills__skill",
                "languages__language",
                "experiences__work_format",
                "education__education_level",
                "project_preferences__category",
                "project_preferences__focus_area",
                "project_preferences__work_format",
            )
            .distinct()
        )
        if self.action == "list" and self.request.user.is_authenticated:
            queryset = queryset.exclude(user=self.request.user)
        term = self.request.query_params.get("search", "").strip()
        if not term:
            return queryset
        query = SearchQuery(term, config="simple", search_type="websearch")
        vector = SearchVector("search_text", config="simple")
        queryset = queryset.annotate(
                search_rank=SearchRank(vector, query),
                translit_similarity=Greatest(
                    TrigramSimilarity("search_translit", transliterate(term)),
                    TrigramSimilarity("search_text", term.lower()),
                ),
        )
        terms = search_terms(term)
        related_match = Q()
        for token in terms:
            related_match &= (
                Q(search_text__icontains=token)
                | Q(country__name__icontains=token)
                | Q(country__code__icontains=token)
                | Q(city__name__icontains=token)
                | Q(remote_preference__name__icontains=token)
                | Q(remote_preference__slug__icontains=token)
                | Q(availability__icontains=token)
                | Q(
                    skills__deleted_at__isnull=True,
                    skills__skill__name__icontains=token,
                )
                | Q(
                    skills__deleted_at__isnull=True,
                    skills__skill__slug__icontains=token,
                )
                | Q(
                    languages__deleted_at__isnull=True,
                    languages__language__name__icontains=token,
                )
                | Q(
                    languages__deleted_at__isnull=True,
                    languages__language__native_name__icontains=token,
                )
                | Q(
                    languages__deleted_at__isnull=True,
                    languages__language__code__icontains=token,
                )
            )
        matches = Q(search_rank__gte=0.0001) | related_match
        if len(terms) == 1:
            matches |= Q(translit_similarity__gt=0.16)
        return queryset.filter(matches).distinct().order_by(
            "-search_rank", "-translit_similarity", "display_name"
        )


class MeProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self, request: Request) -> Profile:
        try:
            return Profile.objects.get(user=request.user, deleted_at__isnull=True)
        except Profile.DoesNotExist as exc:
            raise NotFound("Create a profile first.") from exc

    def get(self, request: Request) -> Response:
        return Response(MyProfileSerializer(self.get_object(request)).data)

    @transaction.atomic
    def post(self, request: Request) -> Response:
        if Profile.objects.filter(user=request.user, deleted_at__isnull=True).exists():
            raise ValidationError({"detail": "Profile already exists."}, code="profile_exists")
        serializer = ProfileWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        profile = serializer.save(user=request.user)
        UserRole.objects.get_or_create(user=request.user, role=UserRole.Role.TALENT)
        return Response(MyProfileSerializer(profile).data, status=status.HTTP_201_CREATED)

    def patch(self, request: Request) -> Response:
        if "visibility" in request.data:
            raise ValidationError(
                {"visibility": "Use the profile visibility control after moderation approval."}
            )
        profile = self.get_object(request)
        serializer = ProfileWriteSerializer(
            profile, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MyProfileSerializer(profile).data)


class MyProfileVisibilityView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @transaction.atomic
    def patch(self, request: Request) -> Response:
        serializer = ProfileVisibilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = get_object_or_404(
            Profile.objects.select_for_update(),
            user=request.user,
            deleted_at__isnull=True,
        )
        if profile.status != PublicationStatus.PUBLISHED:
            raise ValidationError(
                {"detail": "The profile must be approved before it can be made visible."}
            )

        before = {
            "visibility": profile.visibility,
            "published_at": profile.published_at.isoformat() if profile.published_at else None,
        }
        is_visible = serializer.validated_data["is_visible"]
        if is_visible:
            record_legal_acceptance(
                request.user,
                LegalAcceptance.Document.PUBLIC_PROFILE,
                PUBLIC_PROFILE_VERSION,
                source="profile_visibility",
                evidence={
                    "profile_id": str(profile.id),
                    "profile_slug": profile.slug,
                    "subject_email": request.user.email,
                    "display_name": profile.display_name,
                    "data_categories": [
                        "general_profile",
                        "location_and_availability",
                        "professional_background",
                        "project_interests",
                        "external_links",
                    ],
                    "request_path": request.path,
                },
            )
        else:
            withdraw_legal_acceptance(
                request.user,
                LegalAcceptance.Document.PUBLIC_PROFILE,
            )
        profile.visibility = (
            Profile.Visibility.PUBLIC if is_visible else Profile.Visibility.PRIVATE
        )
        update_fields = ["visibility", "updated_at"]
        if is_visible and profile.published_at is None:
            profile.published_at = timezone.now()
            update_fields.append("published_at")
        profile.save(update_fields=update_fields)

        AuditEvent.objects.create(
            actor=request.user,
            content_type=ContentType.objects.get_for_model(profile),
            object_id=profile.id,
            action="profile.visibility_changed",
            before=before,
            after={
                "visibility": profile.visibility,
                "distribution_consent_version": (
                    PUBLIC_PROFILE_VERSION if is_visible else None
                ),
                "published_at": (
                    profile.published_at.isoformat() if profile.published_at else None
                ),
            },
        )
        return Response(MyProfileSerializer(profile).data)


class MyProfileNestedBaseView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_profile(self, request: Request) -> Profile:
        return get_object_or_404(Profile, user=request.user, deleted_at__isnull=True)

    @staticmethod
    def soft_delete(instance: Any) -> None:
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["deleted_at", "updated_at"])


class MyProfileSkillsView(MyProfileNestedBaseView):
    def get(self, request: Request) -> Response:
        profile = self.get_profile(request)
        skills = profile.skills.filter(deleted_at__isnull=True).select_related("skill")
        return Response(ProfileSkillSerializer(skills, many=True).data)

    @transaction.atomic
    def post(self, request: Request) -> Response:
        profile = self.get_profile(request)
        serializer = ProfileSkillWriteSerializer(data=request.data, context={"profile": profile})
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get("is_primary"):
            ProfileSkill.objects.filter(
                profile=profile,
                deleted_at__isnull=True,
                is_primary=True,
            ).update(is_primary=False)
        skill = serializer.save(profile=profile)
        return Response(ProfileSkillSerializer(skill).data, status=status.HTTP_201_CREATED)


class MyProfileSkillView(MyProfileNestedBaseView):
    def get_object(self, request: Request, item_id: str) -> ProfileSkill:
        return get_object_or_404(
            ProfileSkill.objects.select_related("skill"),
            pk=item_id,
            profile=self.get_profile(request),
            deleted_at__isnull=True,
        )

    def patch(self, request: Request, item_id: str) -> Response:
        skill = self.get_object(request, item_id)
        serializer = ProfileSkillWriteSerializer(
            skill,
            data=request.data,
            partial=True,
            context={"profile": skill.profile},
        )
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            if serializer.validated_data.get("is_primary"):
                ProfileSkill.objects.filter(
                    profile=skill.profile,
                    deleted_at__isnull=True,
                    is_primary=True,
                ).exclude(pk=skill.pk).update(is_primary=False)
            serializer.save()
        return Response(ProfileSkillSerializer(skill).data)

    def delete(self, request: Request, item_id: str) -> Response:
        self.soft_delete(self.get_object(request, item_id))
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyProfileLanguagesView(MyProfileNestedBaseView):
    def get(self, request: Request) -> Response:
        profile = self.get_profile(request)
        languages = profile.languages.filter(deleted_at__isnull=True).select_related("language")
        return Response(ProfileLanguageSerializer(languages, many=True).data)

    @transaction.atomic
    def post(self, request: Request) -> Response:
        profile = self.get_profile(request)
        serializer = ProfileLanguageWriteSerializer(data=request.data, context={"profile": profile})
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get("is_primary"):
            ProfileLanguage.objects.filter(
                profile=profile,
                deleted_at__isnull=True,
                is_primary=True,
            ).update(is_primary=False)
        language = serializer.save(profile=profile)
        return Response(ProfileLanguageSerializer(language).data, status=status.HTTP_201_CREATED)


class MyProfileLanguageView(MyProfileNestedBaseView):
    def get_object(self, request: Request, item_id: str) -> ProfileLanguage:
        return get_object_or_404(
            ProfileLanguage.objects.select_related("language"),
            pk=item_id,
            profile=self.get_profile(request),
            deleted_at__isnull=True,
        )

    def patch(self, request: Request, item_id: str) -> Response:
        language = self.get_object(request, item_id)
        serializer = ProfileLanguageWriteSerializer(
            language,
            data=request.data,
            partial=True,
            context={"profile": language.profile},
        )
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            if serializer.validated_data.get("is_primary"):
                ProfileLanguage.objects.filter(
                    profile=language.profile,
                    deleted_at__isnull=True,
                    is_primary=True,
                ).exclude(pk=language.pk).update(is_primary=False)
            serializer.save()
        return Response(ProfileLanguageSerializer(language).data)

    def delete(self, request: Request, item_id: str) -> Response:
        self.soft_delete(self.get_object(request, item_id))
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyProfileExperiencesView(MyProfileNestedBaseView):
    def get(self, request: Request) -> Response:
        profile = self.get_profile(request)
        experiences = profile.experiences.filter(deleted_at__isnull=True).select_related(
            "work_format"
        )
        return Response(ProfileExperienceSerializer(experiences, many=True).data)

    def post(self, request: Request) -> Response:
        profile = self.get_profile(request)
        serializer = ProfileExperienceWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        experience = serializer.save(profile=profile)
        return Response(
            ProfileExperienceSerializer(experience).data,
            status=status.HTTP_201_CREATED,
        )


class MyProfileExperienceView(MyProfileNestedBaseView):
    def get_object(self, request: Request, item_id: str) -> ProfileExperience:
        return get_object_or_404(
            ProfileExperience.objects.select_related("work_format"),
            pk=item_id,
            profile=self.get_profile(request),
            deleted_at__isnull=True,
        )

    def patch(self, request: Request, item_id: str) -> Response:
        experience = self.get_object(request, item_id)
        serializer = ProfileExperienceWriteSerializer(experience, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProfileExperienceSerializer(experience).data)

    def delete(self, request: Request, item_id: str) -> Response:
        self.soft_delete(self.get_object(request, item_id))
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyProfileEducationsView(MyProfileNestedBaseView):
    def get(self, request: Request) -> Response:
        education = (
            self.get_profile(request)
            .education.filter(deleted_at__isnull=True)
            .select_related("education_level")
        )
        return Response(ProfileEducationSerializer(education, many=True).data)

    def post(self, request: Request) -> Response:
        serializer = ProfileEducationWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        education = serializer.save(profile=self.get_profile(request))
        return Response(ProfileEducationSerializer(education).data, status=status.HTTP_201_CREATED)


class MyProfileEducationView(MyProfileNestedBaseView):
    def get_object(self, request: Request, item_id: str) -> ProfileEducation:
        return get_object_or_404(
            ProfileEducation.objects.select_related("education_level"),
            pk=item_id,
            profile=self.get_profile(request),
            deleted_at__isnull=True,
        )

    def patch(self, request: Request, item_id: str) -> Response:
        education = self.get_object(request, item_id)
        serializer = ProfileEducationWriteSerializer(education, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProfileEducationSerializer(education).data)

    def delete(self, request: Request, item_id: str) -> Response:
        self.soft_delete(self.get_object(request, item_id))
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyProfileLinksView(MyProfileNestedBaseView):
    def get(self, request: Request) -> Response:
        links = self.get_profile(request).links.filter(deleted_at__isnull=True)
        return Response(ProfileLinkSerializer(links, many=True).data)

    def post(self, request: Request) -> Response:
        serializer = ProfileLinkWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        link = serializer.save(profile=self.get_profile(request))
        return Response(ProfileLinkSerializer(link).data, status=status.HTTP_201_CREATED)


class MyProfileLinkView(MyProfileNestedBaseView):
    def get_object(self, request: Request, item_id: str) -> ProfileLink:
        return get_object_or_404(
            ProfileLink,
            pk=item_id,
            profile=self.get_profile(request),
            deleted_at__isnull=True,
        )

    def patch(self, request: Request, item_id: str) -> Response:
        link = self.get_object(request, item_id)
        serializer = ProfileLinkWriteSerializer(link, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProfileLinkSerializer(link).data)

    def delete(self, request: Request, item_id: str) -> Response:
        self.soft_delete(self.get_object(request, item_id))
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyProfileProjectPreferencesView(MyProfileNestedBaseView):
    def get(self, request: Request) -> Response:
        preferences = (
            self.get_profile(request)
            .project_preferences.filter(deleted_at__isnull=True)
            .select_related("category", "focus_area", "work_format")
        )
        return Response(ProfileProjectPreferenceSerializer(preferences, many=True).data)

    def post(self, request: Request) -> Response:
        serializer = ProfileProjectPreferenceWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        preference = serializer.save(profile=self.get_profile(request))
        return Response(
            ProfileProjectPreferenceSerializer(preference).data,
            status=status.HTTP_201_CREATED,
        )


class MyProfileProjectPreferenceView(MyProfileNestedBaseView):
    def get_object(self, request: Request, item_id: str) -> ProfileProjectPreference:
        return get_object_or_404(
            ProfileProjectPreference.objects.select_related(
                "category", "focus_area", "work_format"
            ),
            pk=item_id,
            profile=self.get_profile(request),
            deleted_at__isnull=True,
        )

    def patch(self, request: Request, item_id: str) -> Response:
        preference = self.get_object(request, item_id)
        serializer = ProfileProjectPreferenceWriteSerializer(
            preference, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProfileProjectPreferenceSerializer(preference).data)

    def delete(self, request: Request, item_id: str) -> Response:
        self.soft_delete(self.get_object(request, item_id))
        return Response(status=status.HTTP_204_NO_CONTENT)
