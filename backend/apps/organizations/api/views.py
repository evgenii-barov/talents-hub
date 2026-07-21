from django.db.models import QuerySet
from rest_framework import viewsets

from apps.organizations.models import Organization

from .serializers import OrganizationPublicSerializer


class OrganizationViewSet(viewsets.ReadOnlyModelViewSet[Organization]):
    serializer_class = OrganizationPublicSerializer
    lookup_field = "slug"
    filterset_fields = {
        "organization_type": ["exact"],
        "country__code": ["exact"],
        "focuses__focus_area__slug": ["exact"],
        "is_verified": ["exact"],
    }
    search_fields = ("display_name", "tagline", "description", "slug")
    ordering_fields = ("display_name", "published_at", "updated_at")
    ordering = ("-published_at", "display_name")

    def get_queryset(self) -> QuerySet[Organization]:
        return (
            Organization.objects.public()
            .select_related("country", "city", "logo")
            .prefetch_related("focuses__focus_area")
            .distinct()
        )
