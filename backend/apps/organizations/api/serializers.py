from typing import Any

from rest_framework import serializers

from apps.organizations.models import Organization, OrganizationFocus
from apps.taxonomy.models import Country, FocusArea


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ("id", "name", "code", "slug")


class FocusAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FocusArea
        fields = ("id", "name", "slug")


class OrganizationFocusSerializer(serializers.ModelSerializer):
    focus_area = FocusAreaSerializer(read_only=True)

    class Meta:
        model = OrganizationFocus
        fields = ("id", "focus_area", "sort_order")


class OrganizationPublicSerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)
    focuses = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = (
            "id",
            "slug",
            "display_name",
            "organization_type",
            "tagline",
            "description",
            "website_url",
            "country",
            "location_text",
            "founded_year",
            "is_verified",
            "focuses",
        )

    def get_focuses(self, organization: Organization) -> Any:
        return OrganizationFocusSerializer(
            organization.focuses.filter(deleted_at__isnull=True), many=True
        ).data
