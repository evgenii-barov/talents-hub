from types import SimpleNamespace

import pytest
from allauth.account import app_settings as account_app_settings
from allauth.socialaccount.models import SocialAccount
from django.test import Client, RequestFactory, override_settings
from django.urls import reverse

from apps.users.models import ExternalIdentity, User
from apps.users.signals import remove_external_identity, sync_external_identity


def test_allauth_does_not_expect_username_field() -> None:
    assert account_app_settings.USER_MODEL_USERNAME_FIELD is None


@override_settings(
    SOCIAL_AUTH_ENABLED=True,
    SOCIALACCOUNT_PROVIDERS={
        "google": {"APPS": [{"client_id": "google-id", "secret": "google-secret", "key": ""}]},
        "github": {"APPS": [{"client_id": "github-id", "secret": "github-secret", "key": ""}]},
    }
)
def test_social_provider_endpoint_exposes_only_configured_providers(client: Client) -> None:
    response = client.get(reverse("auth-social-providers"))

    assert response.status_code == 200
    assert response.json()["providers"] == [
        {"id": "google", "login_url": "http://testserver/accounts/google/login/"},
        {"id": "github", "login_url": "http://testserver/accounts/github/login/"},
    ]


@override_settings(
    SOCIAL_AUTH_ENABLED=False,
    SOCIALACCOUNT_PROVIDERS={
        "google": {"APPS": [{"client_id": "google-id", "secret": "google-secret"}]},
        "github": {"APPS": [{"client_id": "github-id", "secret": "github-secret"}]},
    },
)
def test_social_provider_endpoint_hides_providers_when_disabled(client: Client) -> None:
    response = client.get(reverse("auth-social-providers"))

    assert response.status_code == 200
    assert response.json() == {"providers": []}


@pytest.mark.django_db
def test_social_login_mirrors_and_removes_external_identity() -> None:
    user = User.objects.create_user(email="member@example.com", password="test-password")
    account = SocialAccount(
        user=user,
        provider="github",
        uid="github-user-42",
        extra_data={"email": "member@example.com"},
    )
    request = RequestFactory().get("/")

    sync_external_identity(
        sender=User,
        request=request,
        user=user,
        sociallogin=SimpleNamespace(account=account),
    )

    assert ExternalIdentity.objects.filter(
        user=user,
        provider="github",
        provider_account_id="github-user-42",
        email_at_provider="member@example.com",
    ).exists()

    remove_external_identity(sender=SocialAccount, request=request, socialaccount=account)

    assert not ExternalIdentity.objects.exists()
