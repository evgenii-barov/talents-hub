from typing import Any

from rest_framework import serializers

from apps.media.models import MediaAsset
from apps.profiles.models import (
    Profile,
    ProfileEducation,
    ProfileExperience,
    ProfileLanguage,
    ProfileLink,
    ProfileProjectPreference,
    ProfileSkill,
)
from apps.taxonomy.models import (
    Category,
    City,
    Country,
)


class TaxonomyReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ("id", "name", "code", "slug")


class CitySerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)

    class Meta:
        model = City
        fields = ("id", "name", "country")


class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaAsset
        fields = ("id", "alt_text")


class ProfileSkillSerializer(serializers.ModelSerializer):
    skill = TaxonomyReferenceSerializer(read_only=True)

    class Meta:
        model = ProfileSkill
        fields = ("id", "skill", "level", "is_primary", "sort_order")


class ProfileLanguageSerializer(serializers.ModelSerializer):
    language = TaxonomyReferenceSerializer(read_only=True)

    class Meta:
        model = ProfileLanguage
        fields = ("id", "language", "proficiency", "is_primary", "sort_order")


class ProfileExperienceSerializer(serializers.ModelSerializer):
    work_format = TaxonomyReferenceSerializer(read_only=True)

    class Meta:
        model = ProfileExperience
        fields = (
            "id",
            "organization_name",
            "title",
            "location_text",
            "work_format",
            "started_on",
            "ended_on",
            "is_current",
            "description",
            "sort_order",
        )


class ProfileEducationSerializer(serializers.ModelSerializer):
    education_level = TaxonomyReferenceSerializer(read_only=True)

    class Meta:
        model = ProfileEducation
        fields = (
            "id",
            "institution_name",
            "degree",
            "field_of_study",
            "education_level",
            "started_on",
            "ended_on",
            "credential_url",
            "is_verified",
            "sort_order",
        )


class ProfileLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileLink
        fields = ("id", "kind", "url", "label", "sort_order")


class ProfileProjectPreferenceSerializer(serializers.ModelSerializer):
    category = TaxonomyReferenceSerializer(read_only=True)
    focus_area = TaxonomyReferenceSerializer(read_only=True)
    work_format = TaxonomyReferenceSerializer(read_only=True)

    class Meta:
        model = ProfileProjectPreference
        fields = ("id", "category", "focus_area", "work_format", "note", "sort_order")


class ProfilePublicSerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)
    city = CitySerializer(read_only=True)
    avatar = AvatarSerializer(read_only=True)
    remote_preference = TaxonomyReferenceSerializer(read_only=True)
    skills = serializers.SerializerMethodField()
    languages = serializers.SerializerMethodField()
    experiences = serializers.SerializerMethodField()
    education = serializers.SerializerMethodField()
    links = serializers.SerializerMethodField()
    project_preferences = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = (
            "id",
            "slug",
            "display_name",
            "headline",
            "bio",
            "country",
            "city",
            "avatar",
            "availability",
            "availability_note",
            "remote_preference",
            "timezone",
            "is_verified",
            "skills",
            "languages",
            "experiences",
            "education",
            "links",
            "project_preferences",
        )

    def get_skills(self, profile: Profile) -> Any:
        return ProfileSkillSerializer(
            profile.skills.filter(deleted_at__isnull=True), many=True
        ).data

    def get_languages(self, profile: Profile) -> Any:
        return ProfileLanguageSerializer(
            profile.languages.filter(deleted_at__isnull=True), many=True
        ).data

    def get_experiences(self, profile: Profile) -> Any:
        return ProfileExperienceSerializer(
            profile.experiences.filter(deleted_at__isnull=True), many=True
        ).data

    def get_education(self, profile: Profile) -> Any:
        return ProfileEducationSerializer(
            profile.education.filter(deleted_at__isnull=True), many=True
        ).data

    def get_links(self, profile: Profile) -> Any:
        return ProfileLinkSerializer(profile.links.filter(deleted_at__isnull=True), many=True).data

    def get_project_preferences(self, profile: Profile) -> Any:
        return ProfileProjectPreferenceSerializer(
            profile.project_preferences.filter(deleted_at__isnull=True), many=True
        ).data


class ProfileWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = (
            "slug",
            "display_name",
            "headline",
            "bio",
            "country",
            "city",
            "avatar",
            "visibility",
            "availability",
            "availability_note",
            "remote_preference",
            "timezone",
        )
        extra_kwargs = {
            "slug": {"required": True},
            "display_name": {"required": True},
        }

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        country = attrs.get("country", getattr(self.instance, "country", None))
        city = attrs.get("city", getattr(self.instance, "city", None))
        valid_location = (
            isinstance(country, Country)
            and isinstance(city, City)
            and city.country_id == country.id
        )
        if not valid_location and country is not None and city is not None:
            raise serializers.ValidationError({"city": "City must belong to the selected country."})
        return attrs
