from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project

from .serializers import (
    ProjectPublicSerializer,
    ProjectRoleSerializer,
    ProjectRoleWriteSerializer,
    ProjectWriteSerializer,
)


class ProjectViewSet(viewsets.ReadOnlyModelViewSet[Project]):
    serializer_class = ProjectPublicSerializer
    lookup_field = "slug"
    filterset_fields = {
        "category__slug": ["exact"],
        "stage": ["exact"],
        "country__code": ["exact"],
        "work_format__slug": ["exact"],
        "working_language__code": ["exact"],
        "roles__status": ["exact"],
        "skills__skill__slug": ["exact"],
    }
    search_fields = ("title", "short_description", "description", "slug")
    ordering_fields = ("title", "published_at", "application_deadline", "updated_at")
    ordering = ("-is_featured", "-published_at", "title")

    def get_queryset(self) -> QuerySet[Project]:
        return (
            Project.objects.public()
            .select_related("organization", "category", "work_format", "working_language")
            .prefetch_related(
                "roles",
                "focuses__focus_area",
                "skills__skill",
                "contacts",
            )
            .distinct()
        )


class MyProjectsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: Request) -> Response:
        projects = Project.objects.filter(
            owner=request.user,
            deleted_at__isnull=True,
        ).order_by("-updated_at")
        return Response(ProjectPublicSerializer(projects, many=True).data)

    def post(self, request: Request) -> Response:
        serializer = ProjectWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save(owner=request.user)
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
