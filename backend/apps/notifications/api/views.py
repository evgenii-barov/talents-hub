from django.db.models import QuerySet
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.notifications.models import Notification

from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet[Notification]):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = NotificationSerializer
    ordering_fields = ("created_at", "read_at")
    ordering = ("-created_at",)

    def get_queryset(self) -> QuerySet[Notification]:
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=["post"])
    def read(self, request: Request, pk: str | None = None) -> Response:
        notification = self.get_object()
        notification.mark_read()
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request: Request) -> Response:
        now = timezone.now()
        updated = self.get_queryset().filter(read_at__isnull=True).update(
            read_at=now,
            updated_at=now,
        )
        return Response({"updated": updated})
