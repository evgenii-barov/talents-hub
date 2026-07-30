from django.test import Client
from django.urls import reverse


def test_health_check(client: Client) -> None:
    response = client.get(reverse("health-check"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_check_reports_dependencies(client: Client, monkeypatch) -> None:
    monkeypatch.setattr("apps.common.views.connection.ensure_connection", lambda: None)
    monkeypatch.setattr("apps.common.views.connection.is_usable", lambda: True)
    monkeypatch.setattr("apps.common.views.cache.set", lambda *args, **kwargs: None)
    monkeypatch.setattr("apps.common.views.cache.get", lambda key: "ok")

    response = client.get(reverse("readiness-check"))

    assert response.status_code == 200
    assert response.json() == {
        "status": "ready",
        "checks": {"database": True, "cache": True},
    }


def test_readiness_check_returns_503_when_database_is_down(client: Client, monkeypatch) -> None:
    def fail_connection() -> None:
        raise OSError("database unavailable")

    monkeypatch.setattr("apps.common.views.connection.ensure_connection", fail_connection)
    monkeypatch.setattr("apps.common.views.cache.set", lambda *args, **kwargs: None)
    monkeypatch.setattr("apps.common.views.cache.get", lambda key: "ok")

    response = client.get(reverse("readiness-check"))

    assert response.status_code == 503
    assert response.json()["checks"] == {"database": False, "cache": True}
