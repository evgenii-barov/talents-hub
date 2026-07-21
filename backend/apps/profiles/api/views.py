from django.db.models import QuerySet
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.profiles.models import Profile

from .serializers import ProfilePublicSerializer, ProfileWriteSerializer


class ProfileViewSet(viewsets.ReadOnlyModelViewSet[Profile]):
    """Public catalogue: private, unpublished, and deleted profiles never appear."""

    serializer_class = ProfilePublicSerializer
    lookup_field = "slug"
    filterset_fields = {
        "country__code": ["exact"],
        "city": ["exact"],
        "skills__skill__slug": ["exact"],
        "languages__language__code": ["exact"],
        "remote_preference__slug": ["exact"],
        "availability": ["exact"],
        "is_verified": ["exact"],
    }
    search_fields = ("display_name", "headline", "bio", "slug")
    ordering_fields = ("display_name", "published_at", "updated_at")
    ordering = ("-published_at", "display_name")

    def get_queryset(self) -> QuerySet[Profile]:
        return (
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


class MeProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self, request: Request) -> Profile:
        try:
            return Profile.objects.get(user=request.user, deleted_at__isnull=True)
        except Profile.DoesNotExist as exc:
            raise NotFound("Create a profile first.") from exc

    def get(self, request: Request) -> Response:
        return Response(ProfilePublicSerializer(self.get_object(request)).data)

    def post(self, request: Request) -> Response:
        if Profile.objects.filter(user=request.user, deleted_at__isnull=True).exists():
            raise ValidationError({"detail": "Profile already exists."}, code="profile_exists")
        serializer = ProfileWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save(user=request.user)
        return Response(ProfilePublicSerializer(profile).data, status=status.HTTP_201_CREATED)

    def patch(self, request: Request) -> Response:
        profile = self.get_object(request)
        serializer = ProfileWriteSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProfilePublicSerializer(profile).data)
