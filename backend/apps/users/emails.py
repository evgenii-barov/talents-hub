from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
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


def _send_action_email(
    *,
    user: User,
    subject: str,
    preheader: str,
    eyebrow: str,
    heading: str,
    intro: str,
    action_label: str,
    action_url: str,
    security_note: str,
) -> None:
    context = {
        "preheader": preheader,
        "eyebrow": eyebrow,
        "heading": heading,
        "intro": intro,
        "action_label": action_label,
        "action_url": action_url,
        "security_note": security_note,
        "site_url": settings.FRONTEND_URL,
    }
    text = render_to_string("emails/action_email.txt", context).strip()
    html = render_to_string("emails/action_email.html", context)
    message = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, [user.email])
    message.attach_alternative(html, "text/html")
    message.send(fail_silently=False)


def send_verification_email(user: User) -> None:
    _send_action_email(
        user=user,
        subject="Подтвердите e-mail — Talents Hub",
        preheader="Подтвердите адрес электронной почты, чтобы активировать аккаунт.",
        eyebrow="СОЗДАНИЕ ПРОФИЛЯ",
        heading="Подтвердите e-mail",
        intro=(
            "Остался один шаг: подтвердите адрес электронной почты, чтобы активировать "
            "аккаунт и начать создавать профиль в Talents Hub."
        ),
        action_label="Подтвердить e-mail",
        action_url=_action_url("/verify-email", user),
        security_note=(
            "Если вы не создавали аккаунт Talents Hub, просто проигнорируйте это письмо."
        ),
    )


def send_password_reset_email(user: User) -> None:
    _send_action_email(
        user=user,
        subject="Сброс пароля — Talents Hub",
        preheader="Откройте защищённую ссылку и создайте новый пароль.",
        eyebrow="БЕЗОПАСНОСТЬ АККАУНТА",
        heading="Создайте новый пароль",
        intro=(
            "Мы получили запрос на сброс пароля для вашего аккаунта. Перейдите по ссылке "
            "ниже, чтобы задать новый пароль."
        ),
        action_label="Сбросить пароль",
        action_url=_action_url("/reset-password", user),
        security_note=(
            "Если вы не запрашивали сброс пароля, проигнорируйте письмо — текущий пароль "
            "останется без изменений."
        ),
    )
