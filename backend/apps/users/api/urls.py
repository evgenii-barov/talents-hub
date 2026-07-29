from django.urls import path

from .views import (
    EmailVerificationResendView,
    EmailVerificationView,
    LoginView,
    LogoutView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    SessionView,
    SignupView,
    SocialLoginProvidersView,
)

urlpatterns = [
    path("auth/session/", SessionView.as_view(), name="auth-session"),
    path(
        "auth/social/providers/",
        SocialLoginProvidersView.as_view(),
        name="auth-social-providers",
    ),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/signup/", SignupView.as_view(), name="auth-signup"),
    path("auth/verify-email/", EmailVerificationView.as_view(), name="auth-verify-email"),
    path(
        "auth/resend-verification/",
        EmailVerificationResendView.as_view(),
        name="auth-resend-verification",
    ),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path(
        "auth/password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="auth-password-reset-confirm",
    ),
]
