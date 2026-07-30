from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector, TrigramSimilarity
from django.db import transaction
from django.db.models import Q, QuerySet
from django.db.models.functions import Greatest
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore[import-untyped]
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.pagination import CataloguePagination
from apps.common.search import search_terms, transliterate
from apps.profiles.models import Profile
from apps.projects.models import Project, ProjectMember
from apps.users.models import UserRole

from .serializers import (
    ProjectPublicSerializer,
    ProjectRoleSerializer,
    ProjectRoleWriteSerializer,
    ProjectWriteSerializer,
)


class ProjectViewSet(viewsets.ReadOnlyModelViewSet[Project]):
    permission_classes = (permissions.AllowAny,)
    serializer_class = ProjectPublicSerializer
    lookup_field = "slug"
    pagination_class = CataloguePagination
    filterset_fields = {
        "category__slug": ["exact"],
        "stage": ["exact"],
        "country__code": ["exact"],
        "work_format__slug": ["exact"],
        "working_language__code": ["exact"],
        "roles__status": ["exact"],
        "skills__skill__slug": ["exact"],
        "organization__slug": ["exact"],
    }
    filter_backends = (DjangoFilterBackend, OrderingFilter)
    ordering_fields = ("title", "published_at", "application_deadline", "updated_at")
    ordering = ("-is_featured", "-published_at", "title")

    def get_queryset(self) -> QuerySet[Project]:
        queryset = (
            Project.objects.public()
            .select_related(
                "organization",
                "owner__profile",
                "owner__profile__avatar",
                "category",
                "work_format",
                "working_language",
            )
            .prefetch_related(
                "roles",
                "focuses__focus_area",
                "skills__skill",
                "contacts",
            )
            .distinct()
        )
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
                | Q(category__name__icontains=token)
                | Q(category__slug__icontains=token)
                | Q(country__name__icontains=token)
                | Q(country__code__icontains=token)
                | Q(city__name__icontains=token)
                | Q(work_format__name__icontains=token)
                | Q(work_format__slug__icontains=token)
                | Q(working_language__name__icontains=token)
                | Q(working_language__native_name__icontains=token)
                | Q(working_language__code__icontains=token)
                | Q(organization__display_name__icontains=token)
                | Q(organization__tagline__icontains=token)
                | Q(owner__profile__display_name__icontains=token)
                | Q(roles__deleted_at__isnull=True, roles__title__icontains=token)
                | Q(roles__deleted_at__isnull=True, roles__description__icontains=token)
                | Q(
                    roles__deleted_at__isnull=True,
                    roles__first_responsibility__icontains=token,
                )
                | Q(
                    skills__deleted_at__isnull=True,
                    skills__skill__name__icontains=token,
                )
                | Q(
                    skills__deleted_at__isnull=True,
                    skills__skill__slug__icontains=token,
                )
                | Q(
                    focuses__deleted_at__isnull=True,
                    focuses__focus_area__name__icontains=token,
                )
            )
        matches = Q(search_rank__gte=0.0001) | related_match
        if len(terms) == 1:
            matches |= Q(translit_similarity__gt=0.16)
        return queryset.filter(matches).distinct().order_by(
            "-is_featured", "-search_rank", "-translit_similarity", "title"
        )


class MyProjectsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request) -> Response:
        projects = Project.objects.filter(
            owner=request.user,
            deleted_at__isnull=True,
        ).order_by("-updated_at")
        return Response(ProjectPublicSerializer(projects, many=True).data)

    @transaction.atomic
    def post(self, request: Request) -> Response:
        serializer = ProjectWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save(owner=request.user)
        UserRole.objects.get_or_create(user=request.user, role=UserRole.Role.PROJECT_LEAD)
        profile = Profile.objects.filter(user=request.user, deleted_at__isnull=True).first()
        if profile is not None:
            ProjectMember.objects.create(
                project=project,
                profile=profile,
                membership_role=ProjectMember.MembershipRole.OWNER,
            )
        return Response(ProjectPublicSerializer(project).data, status=status.HTTP_201_CREATED)


class MyProjectView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self, request: Request, project_id: str) -> Project:
        return get_object_or_404(
            Project.objects.filter(owner=request.user, deleted_at__isnull=True),
            pk=project_id,
        )

    def patch(self, request: Request, project_id: str) -> Response:
        project = self.get_object(request, project_id)
        serializer = ProjectWriteSerializer(project, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProjectPublicSerializer(project).data)


class MyProjectRolesView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request, project_id: str) -> Response:
        project = get_object_or_404(Project, pk=project_id, deleted_at__isnull=True)
        if project.owner_id != request.user.id:
            raise PermissionDenied("Only the project owner can add roles.")
        serializer = ProjectRoleWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.save(project=project)
        return Response(ProjectRoleSerializer(role).data, status=status.HTTP_201_CREATED)
