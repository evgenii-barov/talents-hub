import pytest
from django.test import Client
from django.urls import reverse

from apps.taxonomy.models import Category, Language


@pytest.mark.django_db
def test_taxonomy_endpoint_returns_active_values(client: Client) -> None:
    Category.objects.create(name="Digital", slug="digital")
    Category.objects.create(name="Hidden", slug="hidden", is_active=False)
    Language.objects.create(
        name="English",
        slug="english",
        code="en",
        native_name="English",
    )

    categories = client.get(reverse("taxonomy-list", kwargs={"resource": "categories"}))
    languages = client.get(reverse("taxonomy-list", kwargs={"resource": "languages"}))

    assert categories.status_code == 200
    assert [item["slug"] for item in categories.json()] == ["digital"]
    assert languages.json()[0]["code"] == "en"


def test_csrf_endpoint_sets_a_token(client: Client) -> None:
    response = client.get(reverse("csrf-token"))

    assert response.status_code == 200
    assert response.json()["csrfToken"]
