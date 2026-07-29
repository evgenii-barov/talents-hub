from django.db.models import Q, QuerySet
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore[import-untyped]
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter

from apps.common.pagination import CataloguePagination
from apps.common.search import search_terms
from apps.organizations.models import Organization

from .serializers import OrganizationPublicSerializer


class OrganizationViewSet(viewsets.ReadOnlyModelViewSet[Organization]):
    serializer_class = OrganizationPublicSerializer
    lookup_field = "slug"
    pagination_class = CataloguePagination
    filterset_fields = {
        "organization_type": ["exact"],
        "country__code": ["exact"],
        "focuses__focus_area__slug": ["exact"],
        "is_verified": ["exact"],
    }
    filter_backends = (DjangoFilterBackend, OrderingFilter)
    ordering_fields = ("display_name", "published_at", "updated_at")
    ordering = ("-published_at", "display_name")

    def get_queryset(self) -> QuerySet[Organization]:
        queryset = (
            Organization.objects.public()
            .select_related("country", "city", "logo")
            .prefetch_related("focuses__focus_area")
            .distinct()
        )
        term = self.request.query_params.get("search", "").strip()
        if not term:
            return queryset

        matches = Q()
        for token in search_terms(term):
            type_values = [
                value
                for value, label in Organization.OrganizationType.choices
                if token in value.lower() or token in label.lower()
            ]
            matches &= (
                Q(display_name__icontains=token)
                | Q(legal_name__icontains=token)
                | Q(tagline__icontains=token)
                | Q(description__icontains=token)
                | Q(slug__icontains=token)
                | Q(location_text__icontains=token)
                | Q(country__name__icontains=token)
                | Q(country__code__icontains=token)
                | Q(city__name__icontains=token)
                | Q(organization_type__in=type_values)
                | Q(
                    focuses__deleted_at__isnull=True,
                    focuses__focus_area__name__icontains=token,
                )
                | Q(
                    focuses__deleted_at__isnull=True,
                    focuses__focus_area__slug__icontains=token,
                )
            )
        return queryset.filter(matches).distinct()
