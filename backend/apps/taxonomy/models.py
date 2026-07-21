from django.db import models

from apps.common.models import UUIDTimestampedModel


class TaxonomyModel(UUIDTimestampedModel):
    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=160, unique=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        abstract = True
        ordering = ("sort_order", "name")

    def __str__(self) -> str:
        return self.name


class Category(TaxonomyModel):
    description = models.TextField(blank=True)


class FocusArea(TaxonomyModel):
    description = models.TextField(blank=True)


class Country(TaxonomyModel):
    code = models.CharField(max_length=2, unique=True)


class City(UUIDTimestampedModel):
    country = models.ForeignKey(Country, on_delete=models.PROTECT, related_name="cities")
    name = models.CharField(max_length=160)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["country", "name"],
                name="taxonomy_unique_city_per_country",
            ),
        ]
        ordering = ("sort_order", "name")

    def __str__(self) -> str:
        return f"{self.name}, {self.country.name}"


class Language(TaxonomyModel):
    code = models.CharField(max_length=16, unique=True)
    native_name = models.CharField(max_length=160)


class EducationLevel(TaxonomyModel):
    pass


class WorkFormat(TaxonomyModel):
    pass


class Skill(TaxonomyModel):
    category = models.ForeignKey(
        Category,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="skills",
    )
