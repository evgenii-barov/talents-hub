from django.test import Client
from django.urls import reverse


def test_health_check(client: Client) -> None:
    response = client.get(reverse("health-check"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
