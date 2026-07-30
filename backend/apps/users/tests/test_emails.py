from collections.abc import Callable

import pytest
from django.core import mail
from django.core.mail import EmailMultiAlternatives
from django.test import override_settings

from apps.users.emails import send_password_reset_email, send_verification_email
from apps.users.models import User


@pytest.mark.django_db
@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="noreply@talents-hub.online",
    FRONTEND_URL="https://talents-hub.online",
)
@pytest.mark.parametrize(
    ("send_email", "subject", "heading", "action_label", "path"),
    [
        (
            send_verification_email,
            "Подтвердите e-mail — Talents Hub",
            "Подтвердите e-mail",
            "Подтвердить e-mail",
            "/verify-email?uid=",
        ),
        (
            send_password_reset_email,
            "Сброс пароля — Talents Hub",
            "Создайте новый пароль",
            "Сбросить пароль",
            "/reset-password?uid=",
        ),
    ],
)
def test_action_email_has_branded_html_and_plaintext(
    send_email: Callable[[User], None],
    subject: str,
    heading: str,
    action_label: str,
    path: str,
) -> None:
    user = User.objects.create_user(email="member@example.com", password="test-password")

    send_email(user)

    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.subject == subject
    assert message.from_email == "noreply@talents-hub.online"
    assert message.to == [user.email]
    assert heading in message.body
    assert f"https://talents-hub.online{path}" in message.body
    assert isinstance(message, EmailMultiAlternatives)
    assert len(message.alternatives) == 1
    html, mime_type = message.alternatives[0]
    assert mime_type == "text/html"
    assert isinstance(html, str)
    assert heading in html
    assert action_label in html
    assert "#2563eb" in html
    assert "Talents Hub" in html
    assert f"https://talents-hub.online{path}" in html
