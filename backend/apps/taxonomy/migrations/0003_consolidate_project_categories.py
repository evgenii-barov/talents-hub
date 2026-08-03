from django.apps.registry import Apps
from django.db import migrations
from django.db.backends.base.schema import BaseDatabaseSchemaEditor


CATEGORY_DEFINITIONS = (
    (
        "science-education",
        "Научные и образовательные проекты / Science & education",
        1,
    ),
    (
        "business-entrepreneurship",
        "Бизнес и предпринимательство / Business & entrepreneurship",
        2,
    ),
    (
        "support-services",
        "Сопровождение и профессиональные услуги / Support & professional services",
        3,
    ),
)

OLD_TO_NEW = {
    "technology": "business-entrepreneurship",
    "education": "science-education",
    "social-impact": "support-services",
    "creative-industries": "support-services",
    "entrepreneurship": "business-entrepreneurship",
    "research": "science-education",
    "sustainability": "science-education",
}


def consolidate_categories(
    apps: Apps,
    _schema_editor: BaseDatabaseSchemaEditor,
) -> None:
    Category = apps.get_model("taxonomy", "Category")
    Skill = apps.get_model("taxonomy", "Skill")
    Project = apps.get_model("projects", "Project")
    ProfileProjectPreference = apps.get_model("profiles", "ProfileProjectPreference")

    canonical = {}
    for slug, name, sort_order in CATEGORY_DEFINITIONS:
        category, _ = Category.objects.update_or_create(
            slug=slug,
            defaults={
                "name": name,
                "sort_order": sort_order,
                "is_active": True,
            },
        )
        canonical[slug] = category

    for old_slug, new_slug in OLD_TO_NEW.items():
        old_category = Category.objects.filter(slug=old_slug).first()
        if old_category is None:
            continue
        target = canonical[new_slug]
        Project.objects.filter(category=old_category).update(category=target)
        ProfileProjectPreference.objects.filter(category=old_category).update(category=target)
        Skill.objects.filter(category=old_category).update(category=target)

    Category.objects.exclude(slug__in=canonical).update(is_active=False)


class Migration(migrations.Migration):
    dependencies = [
        ("taxonomy", "0002_enable_pg_trgm"),
        ("projects", "0002_project_search_text_project_search_translit"),
        ("profiles", "0002_profile_search_text_profile_search_translit"),
    ]

    operations = [
        migrations.RunPython(consolidate_categories, migrations.RunPython.noop),
    ]
