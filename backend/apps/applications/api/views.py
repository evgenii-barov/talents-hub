from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.applications.models import ProjectApplication
from apps.projects.models import ProjectRole

from .serializers import ApplicationTransitionSerializer, ProjectApplicationSerializer


class ProjectRoleApplicationView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request, role_id: str) -> Response:
        role = get_object_or_404(ProjectRole.objects.select_related("project"), pk=role_id)
        try:
            application = ProjectApplication.submit(
                project_role=role,
                applicant=request.user,
                cover_letter=str(request.data.get("cover_letter", "")),
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.messages) from exc
        return Response(
            ProjectApplicationSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )


class ProjectApplicationTransitionView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request: Request, application_id: str) -> Response:
        application = get_object_or_404(
            ProjectApplication.objects.select_related("project_role__project"),
            pk=application_id,
            deleted_at__isnull=True,
        )
        if application.project_role.project.owner_id != request.user.id:
            raise PermissionDenied("Only the project owner can review applications.")
        serializer = ApplicationTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            application = application.transition(
                serializer.validated_data["status"],
                reviewer=request.user,
                review_note=serializer.validated_data.get("review_note", ""),
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.messages) from exc
        return Response(ProjectApplicationSerializer(application).data)
