from typing import Any

from allauth.account.signals import user_logged_in
from allauth.socialaccount.models import SocialAccount
from allauth.socialaccount.signals import social_account_removed
from django.dispatch import receiver
from django.http import HttpRequest

from .models import ExternalIdentity, User


@receiver(user_logged_in)
def sync_external_identity(
    sender: type[User], request: HttpRequest, user: User, **kwargs: Any
) -> None:
    """Mirror a successful social login without retaining an OAuth access token."""
    sociallogin: Any = kwargs.get("sociallogin")
    if sociallogin is None:
        return
    account: SocialAccount = sociallogin.account
    email = account.extra_data.get("email", "")
    ExternalIdentity.objects.update_or_create(
        provider=account.provider,
        provider_account_id=account.uid,
        defaults={
            "user": user,
            "email_at_provider": email if isinstance(email, str) else "",
        },
    )


@receiver(social_account_removed)
def remove_external_identity(
    sender: type[SocialAccount], request: HttpRequest, socialaccount: SocialAccount, **kwargs: Any
) -> None:
    ExternalIdentity.objects.filter(
        user=socialaccount.user,
        provider=socialaccount.provider,
        provider_account_id=socialaccount.uid,
    ).delete()
