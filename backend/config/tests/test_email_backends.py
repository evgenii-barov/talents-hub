from unittest.mock import Mock, patch

import pytest
from botocore.exceptions import ClientError
from django.core.exceptions import ImproperlyConfigured
from django.core.mail import EmailMultiAlternatives
from django.test import override_settings

from config.email_backends import YandexPostboxEmailBackend

POSTBOX_SETTINGS = override_settings(
    DEFAULT_FROM_EMAIL="Talents Hub <noreply@talents-hub.online>",
    YANDEX_POSTBOX_ACCESS_KEY_ID="test-access-key",
    YANDEX_POSTBOX_SECRET_KEY="test-secret-key",
    YANDEX_POSTBOX_ENDPOINT="https://postbox.cloud.yandex.net",
    YANDEX_POSTBOX_REGION="ru-central1",
    YANDEX_POSTBOX_CONFIGURATION_SET="",
    EMAIL_TIMEOUT=15,
)


@POSTBOX_SETTINGS
@patch("config.email_backends.boto3.client")
def test_backend_sends_django_multipart_message_over_postbox_api(client_factory: Mock) -> None:
    client = client_factory.return_value
    message = EmailMultiAlternatives(
        "Подтвердите e-mail",
        "Откройте https://talents-hub.online/verify-email",
        "Talents Hub <noreply@talents-hub.online>",
        ["Member <member@example.com>"],
        cc=["copy@example.com"],
        bcc=["hidden@example.com"],
        reply_to=["support@talents-hub.online"],
    )
    message.attach_alternative("<strong>Подтвердите e-mail</strong>", "text/html")

    assert YandexPostboxEmailBackend().send_messages([message]) == 1

    client_factory.assert_called_once()
    payload = client.send_email.call_args.kwargs
    assert payload["FromEmailAddress"] == "noreply@talents-hub.online"
    assert payload["Destination"] == {
        "ToAddresses": ["member@example.com"],
        "CcAddresses": ["copy@example.com"],
        "BccAddresses": ["hidden@example.com"],
    }
    raw_message = payload["Content"]["Raw"]["Data"]
    assert b"multipart/alternative" in raw_message
    assert b"text/plain" in raw_message
    assert b"text/html" in raw_message
    assert b"support@talents-hub.online" in raw_message


@POSTBOX_SETTINGS
@patch("config.email_backends.boto3.client")
def test_backend_returns_zero_when_postbox_fails_silently(client_factory: Mock) -> None:
    client_factory.return_value.send_email.side_effect = ClientError(
        {"Error": {"Code": "AccessDeniedException", "Message": "denied"}},
        "SendEmail",
    )
    message = EmailMultiAlternatives(
        "Subject",
        "Body",
        "noreply@talents-hub.online",
        ["member@example.com"],
    )

    backend = YandexPostboxEmailBackend(fail_silently=True)

    assert backend.send_messages([message]) == 0


@POSTBOX_SETTINGS
@patch("config.email_backends.boto3.client")
def test_backend_raises_postbox_error_by_default(client_factory: Mock) -> None:
    error = ClientError(
        {"Error": {"Code": "AccessDeniedException", "Message": "denied"}},
        "SendEmail",
    )
    client_factory.return_value.send_email.side_effect = error
    message = EmailMultiAlternatives(
        "Subject",
        "Body",
        "noreply@talents-hub.online",
        ["member@example.com"],
    )

    with pytest.raises(ClientError):
        YandexPostboxEmailBackend().send_messages([message])


@override_settings(
    YANDEX_POSTBOX_ACCESS_KEY_ID="",
    YANDEX_POSTBOX_SECRET_KEY="",
)
def test_backend_requires_static_access_key() -> None:
    message = EmailMultiAlternatives(
        "Subject",
        "Body",
        "noreply@talents-hub.online",
        ["member@example.com"],
    )

    with pytest.raises(ImproperlyConfigured):
        YandexPostboxEmailBackend().send_messages([message])


@POSTBOX_SETTINGS
@override_settings(YANDEX_POSTBOX_CONFIGURATION_SET="transactional")
@patch("config.email_backends.boto3.client")
def test_backend_reuses_client_and_applies_configuration_set(client_factory: Mock) -> None:
    backend = YandexPostboxEmailBackend()
    message = EmailMultiAlternatives(
        "Subject",
        "Body",
        "noreply@talents-hub.online",
        ["member@example.com"],
    )

    assert backend.open() is True
    assert backend.open() is False
    assert backend.send_messages([message]) == 1
    assert client_factory.return_value.send_email.call_args.kwargs["ConfigurationSetName"] == (
        "transactional"
    )
    backend.close()


@POSTBOX_SETTINGS
@patch("config.email_backends.boto3.client")
def test_backend_skips_empty_message_batches_and_recipient_lists(client_factory: Mock) -> None:
    backend = YandexPostboxEmailBackend()
    message = EmailMultiAlternatives(
        "Subject",
        "Body",
        "noreply@talents-hub.online",
        [],
    )

    assert backend.send_messages([]) == 0
    assert backend.send_messages([message]) == 0
    client_factory.return_value.send_email.assert_not_called()
