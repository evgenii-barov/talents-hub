from allauth.account.models import EmailAddress
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.db import transaction
from django.urls import reverse
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import permissions
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from ..emails import send_password_reset_email, send_verification_email
from ..models import User
from .serializers import (
    EmailSerializer,
    EmailTokenSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    SignupSerializer,
)


def session_payload(request: Request) -> dict[str, object]:
    if not request.user.is_authenticated:
        return {"authenticated": False}
    return {
        "authenticated": True,
        "user": {"id": str(request.user.pk), "email": request.user.email},
    }


class SessionView(APIView):
    def get(self, request: Request) -> Response:
        return Response(session_payload(request))


class SocialLoginProvidersView(APIView):
    """Expose only providers whose client credentials are configured."""

    authentication_classes = ()
    permission_classes = (permissions.AllowAny,)

    def get(self, request: Request) -> Response:
        configured = settings.SOCIALACCOUNT_PROVIDERS
        providers = [
            {
                "id": provider,
                "login_url": request.build_absolute_uri(reverse(f"{provider}_login")),
            }
            for provider in ("google", "github")
            if configured.get(provider, {}).get("APPS")
        ]
        return Response({"providers": providers})


class LoginView(APIView):
    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            raise AuthenticationFailed("Incorrect email or password.")
        login(request, user)
        return Response(session_payload(request))


def get_user_from_token_payload(uid: str, token: str) -> User:
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist) as exc:
        raise ValidationError({"token": "This link is invalid or has expired."}) from exc
    if not default_token_generator.check_token(user, token):
        raise ValidationError({"token": "This link is invalid or has expired."})
    return user


class SignupView(APIView):
    def post(self, request: Request) -> Response:
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        if get_user_model().objects.filter(email=email).exists():
            raise ValidationError({"email": "An account with this email already exists."})
        with transaction.atomic():
            user = get_user_model().objects.create_user(
                email=email,
                password=serializer.validated_data["password"],
                is_active=False,
            )
            EmailAddress.objects.update_or_create(
                user=user,
                email=user.email,
                defaults={"primary": True, "verified": False},
            )
            transaction.on_commit(lambda: send_verification_email(user))
        return Response(
            {"email": user.email, "email_verification_sent": True},
            status=201,
        )


class EmailVerificationView(APIView):
    def post(self, request: Request) -> Response:
        serializer = EmailTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_user_from_token_payload(**serializer.validated_data)
        user.is_active = True
        user.save(update_fields=["is_active"])
        EmailAddress.objects.update_or_create(
            user=user,
            email=user.email,
            defaults={"primary": True, "verified": True},
        )
        login(request, user)
        return Response(session_payload(request))


class EmailVerificationResendView(APIView):
    def post(self, request: Request) -> Response:
        serializer = EmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_user_model().objects.filter(
            email=serializer.validated_data["email"], is_active=False
        ).first()
        if user is not None:
            send_verification_email(user)
        return Response({"email_verification_sent": True}, status=202)


class PasswordResetRequestView(APIView):
    def post(self, request: Request) -> Response:
        serializer = EmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_user_model().objects.filter(
            email=serializer.validated_data["email"], is_active=True
        ).first()
        if user is not None:
            send_password_reset_email(user)
        return Response(status=204)


class PasswordResetConfirmView(APIView):
    def post(self, request: Request) -> Response:
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_user_from_token_payload(
            uid=serializer.validated_data["uid"], token=serializer.validated_data["token"]
        )
        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password"])
        login(request, user)
        return Response(session_payload(request))


class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request: Request) -> Response:
        logout(request)
        return Response({"authenticated": False})
