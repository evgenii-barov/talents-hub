import logging
from typing import Any

from celery import current_app
from django.db import models, transaction
from django.utils import timezone

from apps.common.models import UUIDTimestampedModel

logger = logging.getLogger(__name__)


def _dispatch_event(event_id: str) -> None:
    try:
        current_app.send_task("apps.notifications.tasks.process_outbox_event", [event_id])
    except Exception:
        logger.exception("Unable to dispatch outbox event %s", event_id)


class OutboxEvent(UUIDTimestampedModel):
    topic = models.CharField(max_length=128)
    payload = models.JSONField(default=dict)
    occurred_at = models.DateTimeField(default=timezone.now)
    processed_at = models.DateTimeField(blank=True, null=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    last_error = models.TextField(blank=True)

    class Meta:
        indexes = [models.Index(fields=["processed_at", "occurred_at"])]
        ordering = ("occurred_at",)

    @classmethod
    def enqueue(cls, *, topic: str, payload: dict[str, Any]) -> "OutboxEvent":
        event = cls.objects.create(topic=topic, payload=payload)
        transaction.on_commit(lambda: _dispatch_event(str(event.id)))
        return event
