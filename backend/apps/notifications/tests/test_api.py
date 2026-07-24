import pytest
from django.test import Client
from django.urls import reverse

from apps.notifications.models import Notification
from apps.users.models import User


@pytest.mark.django_db
def test_user_can_mark_only_own_notification_as_read(client: Client) -> None:
    owner = User.objects.create_user(
        email="notification-owner@example.com",
        password="test-password",
    )
    other_user = User.objects.create_user(email="other@example.com", password="test-password")
    notification = Notification.objects.create(
        recipient=owner,
        type="moderation.decision",
        payload={"decision": "approved"},
    )
    client.force_login(other_user)
    forbidden = client.post(reverse("notification-read", kwargs={"pk": notification.id}))
    client.force_login(owner)
    marked_read = client.post(reverse("notification-read", kwargs={"pk": notification.id}))

    assert forbidden.status_code == 404
    assert marked_read.status_code == 200
    assert marked_read.json()["read_at"] is not None
