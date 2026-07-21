from django.contrib import admin

from .models import (
    Category,
    City,
    Country,
    EducationLevel,
    FocusArea,
    Language,
    Skill,
    WorkFormat,
)


class TaxonomyAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "sort_order")
    list_editable = ("is_active", "sort_order")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")


admin.site.register(Category, TaxonomyAdmin)
admin.site.register(FocusArea, TaxonomyAdmin)
admin.site.register(Language, TaxonomyAdmin)
admin.site.register(EducationLevel, TaxonomyAdmin)
admin.site.register(WorkFormat, TaxonomyAdmin)
admin.site.register(Skill, TaxonomyAdmin)


@admin.register(Country)
class CountryAdmin(TaxonomyAdmin):
    list_display = ("name", "code", "is_active", "sort_order")


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ("name", "country", "is_active", "sort_order")
    list_filter = ("country", "is_active")
    search_fields = ("name", "country__name", "country__code")
