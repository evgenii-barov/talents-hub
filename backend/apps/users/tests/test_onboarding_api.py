import pytest
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import Client, override_settings
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from apps.users.models import User


@pytest.mark.django_db(transaction=True)
@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_URL="http://frontend.test",
)
def test_signup_verification_and_password_reset(client: Client) -> None:
    signup = client.post(
        reverse("auth-signup"),
        {
            "email": "new@example.com",
            "password": "Correct-horse-battery-9",
            "password_confirmation": "Correct-horse-battery-9",
        },
        content_type="application/json",
    )
    user = User.objects.get(email="new@example.com")
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    verified = client.post(
        reverse("auth-verify-email"),
        {"uid": uid, "token": token},
        content_type="application/json",
    )
    user.refresh_from_db()
    reset = client.post(
        reverse("auth-password-reset"),
        {"email": user.email},
        content_type="application/json",
    )
    reset_token = default_token_generator.make_token(user)
    confirmed = client.post(
        reverse("auth-password-reset-confirm"),
        {
            "uid": uid,
            "token": reset_token,
            "password": "A-new-correct-password-9",
            "password_confirmation": "A-new-correct-password-9",
        },
        content_type="application/json",
    )

    user.refresh_from_db()
    assert signup.status_code == 201
    assert len(mail.outbox) == 2
    assert user.is_active is True
    assert verified.json()["authenticated"] is True
    assert reset.status_code == 204
    assert confirmed.json()["authenticated"] is True
    assert user.check_password("A-new-correct-password-9")
