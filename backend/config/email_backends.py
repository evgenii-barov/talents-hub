from __future__ import annotations

from collections.abc import Sequence
from email.utils import getaddresses, parseaddr
from typing import Any

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.message import EmailMessage


class YandexPostboxEmailBackend(BaseEmailBackend):
    """Send Django email messages through the Postbox SESv2-compatible HTTPS API."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._client: Any | None = None

    def open(self) -> bool:
        if self._client is not None:
            return False

        access_key_id = settings.YANDEX_POSTBOX_ACCESS_KEY_ID
        secret_key = settings.YANDEX_POSTBOX_SECRET_KEY
        if not access_key_id or not secret_key:
            raise ImproperlyConfigured(
                "YANDEX_POSTBOX_ACCESS_KEY_ID and YANDEX_POSTBOX_SECRET_KEY are required "
                "for the Yandex Postbox email backend"
            )

        self._client = boto3.client(
            "sesv2",
            region_name=settings.YANDEX_POSTBOX_REGION,
            endpoint_url=settings.YANDEX_POSTBOX_ENDPOINT,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_key,
            config=Config(
                connect_timeout=settings.EMAIL_TIMEOUT,
                read_timeout=settings.EMAIL_TIMEOUT,
                retries={"max_attempts": 2, "mode": "standard"},
            ),
        )
        return True

    def close(self) -> None:
        self._client = None

    @staticmethod
    def _mailboxes(addresses: list[str]) -> list[str]:
        return [mailbox for _, mailbox in getaddresses(addresses) if mailbox]

    def _send(self, message: EmailMessage) -> bool:
        destination: dict[str, list[str]] = {}
        for field, addresses in (
            ("ToAddresses", message.to),
            ("CcAddresses", message.cc),
            ("BccAddresses", message.bcc),
        ):
            mailboxes = self._mailboxes(addresses)
            if mailboxes:
                destination[field] = mailboxes

        if not destination:
            return False

        from_email = parseaddr(message.from_email or settings.DEFAULT_FROM_EMAIL)[1]
        if not from_email:
            raise ValueError("A valid From email address is required")

        payload: dict[str, Any] = {
            "FromEmailAddress": from_email,
            "Destination": destination,
            "Content": {"Raw": {"Data": message.message().as_bytes(linesep="\r\n")}},
        }
        configuration_set = settings.YANDEX_POSTBOX_CONFIGURATION_SET
        if configuration_set:
            payload["ConfigurationSetName"] = configuration_set

        if self._client is None:
            raise RuntimeError("Postbox client is not initialized")
        try:
            self._client.send_email(**payload)
        except (BotoCoreError, ClientError):
            if not self.fail_silently:
                raise
            return False
        return True

    def send_messages(self, email_messages: Sequence[EmailMessage]) -> int:
        if not email_messages:
            return 0

        created_connection = self.open()
        sent = 0
        try:
            for message in email_messages:
                sent += int(self._send(message))
        finally:
            if created_connection:
                self.close()
        return sent
