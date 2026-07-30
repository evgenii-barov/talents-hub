import pytest
from django.core.cache import cache
from django.test import Client
from django.urls import reverse

from apps.users.models import User


@pytest.mark.django_db
def test_login_creates_a_session_and_logout_clears_it(client: Client) -> None:
    User.objects.create_user(email="member@example.com", password="test-password")

    login_response = client.post(
        reverse("auth-login"),
        {"email": "member@example.com", "password": "test-password"},
        content_type="application/json",
    )
    session_response = client.get(reverse("auth-session"))
    logout_response = client.post(reverse("auth-logout"))

    assert login_response.status_code == 200
    assert session_response.json()["authenticated"] is True
    assert logout_response.json() == {"authenticated": False}


@pytest.mark.django_db
def test_password_reset_request_is_rate_limited(client: Client) -> None:
    cache.clear()
    responses = [
        client.post(
            reverse("auth-password-reset"),
            {"email": "unknown@example.com"},
            content_type="application/json",
            REMOTE_ADDR="198.51.100.10",
        )
        for _ in range(6)
    ]
    cache.clear()

    assert [response.status_code for response in responses[:5]] == [204] * 5
    assert responses[5].status_code == 429
