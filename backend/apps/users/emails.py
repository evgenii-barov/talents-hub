from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .models import User


def _action_url(path: str, user: User) -> str:
    query = urlencode(
        {
            "uid": urlsafe_base64_encode(force_bytes(user.pk)),
            "token": default_token_generator.make_token(user),
        }
    )
    return f"{settings.FRONTEND_URL}{path}?{query}"


def _send_action_email(*, user: User, subject: str, intro: str, action_url: str) -> None:
    text = f"{intro}\n\n{action_url}\n\nIf you did not request this, you can ignore this email."
    html = (
        "<p>" + intro + "</p>"
        f'<p><a href="{action_url}">Continue</a></p>'
        "<p>If you did not request this, you can ignore this email.</p>"
    )
    message = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, [user.email])
    message.attach_alternative(html, "text/html")
    message.send(fail_silently=False)


def send_verification_email(user: User) -> None:
    _send_action_email(
        user=user,
        subject="Confirm your Talents Hub email",
        intro="Confirm your email address to activate your Talents Hub account.",
        action_url=_action_url("/verify-email", user),
    )


def send_password_reset_email(user: User) -> None:
    _send_action_email(
        user=user,
        subject="Reset your Talents Hub password",
        intro="Use this link to choose a new password for your Talents Hub account.",
        action_url=_action_url("/reset-password", user),
    )
