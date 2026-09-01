import pytest
from django.core.cache import cache
from django.test import Client
from django.urls import reverse

from apps.users.legal import MINORS_VERSION, PERSONAL_DATA_VERSION, TERMS_VERSION
from apps.users.models import LegalAcceptance, User


@pytest.mark.django_db
def test_signup_requires_separate_legal_confirmations(client: Client) -> None:
    response = client.post(
        reverse("auth-signup"),
        {
            "email": "new@example.com",
            "password": "Strong-test-password-123!",
            "password_confirmation": "Strong-test-password-123!",
            "terms_accepted": False,
            "personal_data_consent": False,
            "age_confirmed": False,
        },
        content_type="application/json",
    )

    assert response.status_code == 400
    assert set(response.json()) >= {
        "terms_accepted",
        "personal_data_consent",
        "age_confirmed",
    }
    assert not User.objects.filter(email="new@example.com").exists()


@pytest.mark.django_db
def test_signup_records_document_versions(client: Client, mailoutbox: list[object]) -> None:
    response = client.post(
        reverse("auth-signup"),
        {
            "email": "accepted@example.com",
            "password": "Strong-test-password-123!",
            "password_confirmation": "Strong-test-password-123!",
            "terms_accepted": True,
            "personal_data_consent": True,
            "age_confirmed": True,
        },
        content_type="application/json",
    )

    assert response.status_code == 201
    user = User.objects.get(email="accepted@example.com")
    assert set(
        LegalAcceptance.objects.filter(user=user).values_list("document", "version")
    ) == {
        (LegalAcceptance.Document.TERMS, TERMS_VERSION),
        (LegalAcceptance.Document.PERSONAL_DATA, PERSONAL_DATA_VERSION),
        (LegalAcceptance.Document.AGE_CONFIRMATION, MINORS_VERSION),
    }


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
