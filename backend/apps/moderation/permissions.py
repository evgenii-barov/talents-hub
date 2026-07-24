from typing import Any

from rest_framework.permissions import BasePermission

from apps.users.models import UserRole


def is_moderator(user: Any) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (
            user.is_staff
            or user.is_superuser
            or user.roles.filter(role__in=(UserRole.Role.MODERATOR, UserRole.Role.ADMIN)).exists()
        )
    )


class IsModerator(BasePermission):
    def has_permission(self, request: Any, view: Any) -> bool:
        return is_moderator(request.user)
