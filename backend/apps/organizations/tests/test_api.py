import pytest
from django.test import Client
from django.urls import reverse
from django.utils import timezone

from apps.common.models import PublicationStatus
from apps.organizations.models import Organization


@pytest.mark.django_db
def test_public_catalogue_excludes_private_and_draft_organizations(client: Client) -> None:
    Organization.objects.create(
        slug="public-org",
        legal_name="Public Org LLC",
        display_name="Public Org",
        organization_type=Organization.OrganizationType.NGO,
        visibility=Organization.Visibility.PUBLIC,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    Organization.objects.create(
        slug="private-org",
        legal_name="Private Org LLC",
        display_name="Private Org",
        organization_type=Organization.OrganizationType.NGO,
        visibility=Organization.Visibility.PRIVATE,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )

    response = client.get(reverse("organization-list"))

    assert response.status_code == 200
    assert [item["slug"] for item in response.json()] == ["public-org"]
