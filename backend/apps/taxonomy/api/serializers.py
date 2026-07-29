from typing import Any

from rest_framework import serializers

from apps.taxonomy.models import (
    Category,
    City,
    Country,
    EducationLevel,
    FocusArea,
    Language,
    Skill,
    WorkFormat,
)


class TaxonomyReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ("id", "name", "slug", "code")


class CitySerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)

    class Meta:
        model = City
        fields = ("id", "name", "country")


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ("id", "name", "slug", "code", "native_name")


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ("id", "name", "slug")


TAXONOMY_SERIALIZERS: dict[str, Any] = {
    "categories": TaxonomyReferenceSerializer,
    "focus-areas": TaxonomyReferenceSerializer,
    "countries": CountrySerializer,
    "cities": CitySerializer,
    "languages": LanguageSerializer,
    "skills": SkillSerializer,
    "education-levels": TaxonomyReferenceSerializer,
    "work-formats": TaxonomyReferenceSerializer,
}

TAXONOMY_MODELS: dict[str, Any] = {
    "categories": Category,
    "focus-areas": FocusArea,
    "countries": Country,
    "cities": City,
    "languages": Language,
    "skills": Skill,
    "education-levels": EducationLevel,
    "work-formats": WorkFormat,
}
