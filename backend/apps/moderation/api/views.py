from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.moderation.models import ModerationCase
from apps.moderation.permissions import IsModerator
from apps.moderation.services import decide_case, resolve_target, submit_for_moderation

from .serializers import (
    ModerationCaseSerializer,
    ModerationDecisionSerializer,
    ModerationSubmissionSerializer,
)


class ModerationSubmissionView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request) -> Response:
        serializer = ModerationSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            target = resolve_target(
                target_type=serializer.validated_data["target_type"],
                target_id=str(serializer.validated_data["target_id"]),
            )
            case = submit_for_moderation(
                target=target,
                reporter=request.user,
                reason_code=serializer.validated_data["reason_code"],
            )
        except DjangoPermissionDenied as exc:
            raise PermissionDenied(str(exc)) from exc
        except DjangoValidationError as exc:
            raise ValidationError(exc.messages) from exc
        return Response(ModerationCaseSerializer(case).data, status=201)


class ModerationCaseViewSet(viewsets.ReadOnlyModelViewSet[ModerationCase]):
    permission_classes = (IsModerator,)
    serializer_class = ModerationCaseSerializer
    filterset_fields = {"status": ["exact"], "reason_code": ["exact"]}
    ordering_fields = ("opened_at", "resolved_at")
    ordering = ("opened_at",)

    def get_queryset(self) -> QuerySet[ModerationCase]:
        return ModerationCase.objects.select_related("content_type", "reporter", "assigned_to")


class ModerationDecisionView(APIView):
    permission_classes = (IsModerator,)

    def patch(self, request: Request, case_id: str) -> Response:
        case = get_object_or_404(ModerationCase, pk=case_id)
        serializer = ModerationDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            case = decide_case(
                case=case,
                moderator=request.user,
                decision=serializer.validated_data["decision"],
                note=serializer.validated_data["note"],
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.messages) from exc
        return Response(ModerationCaseSerializer(case).data)
