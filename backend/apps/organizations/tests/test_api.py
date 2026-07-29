import pytest
from django.test import Client
from django.urls import reverse
from django.utils import timezone

from apps.common.models import PublicationStatus
from apps.organizations.models import Organization, OrganizationFocus
from apps.taxonomy.models import Country, FocusArea


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
    assert response.json()["count"] == 1
    assert [item["slug"] for item in response.json()["results"]] == ["public-org"]


@pytest.mark.django_db
def test_public_catalogue_searches_focus_and_location(client: Client) -> None:
    country = Country.objects.create(name="Uzbekistan", slug="uzbekistan-search", code="UZ")
    focus = FocusArea.objects.create(name="Civic media", slug="civic-media-search")
    organization = Organization.objects.create(
        slug="civic-studio",
        legal_name="Civic Studio LLC",
        display_name="Civic Studio",
        organization_type=Organization.OrganizationType.NGO,
        country=country,
        visibility=Organization.Visibility.PUBLIC,
        status=PublicationStatus.PUBLISHED,
        published_at=timezone.now(),
    )
    OrganizationFocus.objects.create(organization=organization, focus_area=focus)

    response = client.get(
        reverse("organization-list"),
        {"search": "media Uzbekistan"},
    )

    assert response.status_code == 200
    assert [item["slug"] for item in response.json()["results"]] == ["civic-studio"]
