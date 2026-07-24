import uuid
from typing import Any

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from .models import Notification
from .outbox import OutboxEvent


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=5)
def process_outbox_event(self: Any, event_id: str) -> None:
    with transaction.atomic():
        event = OutboxEvent.objects.select_for_update().get(pk=uuid.UUID(event_id))
        if event.processed_at is not None:
            return
        if event.topic != "notifications.moderation_decided":
            event.last_error = f"Unsupported outbox topic: {event.topic}"
            event.attempts += 1
            event.save(update_fields=["last_error", "attempts", "updated_at"])
            return
        payload = event.payload
        Notification.objects.create(
            recipient_id=payload["recipient_id"],
            type="moderation.decision",
            payload=payload,
            email_status=Notification.EmailStatus.PENDING,
        )
        event.processed_at = timezone.now()
        event.attempts += 1
        event.last_error = ""
        event.save(update_fields=["processed_at", "attempts", "last_error", "updated_at"])
