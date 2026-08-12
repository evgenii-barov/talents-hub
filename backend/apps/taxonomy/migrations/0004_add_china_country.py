from django.apps.registry import Apps
from django.db import migrations
from django.db.backends.base.schema import BaseDatabaseSchemaEditor


CHINA_CITIES = (
    "Пекин / Beijing",
    "Шанхай / Shanghai",
    "Гуанчжоу / Guangzhou",
    "Шэньчжэнь / Shenzhen",
)


def add_china(
    apps: Apps,
    _schema_editor: BaseDatabaseSchemaEditor,
) -> None:
    Country = apps.get_model("taxonomy", "Country")
    City = apps.get_model("taxonomy", "City")

    Country.objects.filter(code="ZZ").update(sort_order=13)
    china, _ = Country.objects.update_or_create(
        code="CN",
        defaults={
            "name": "Китай / China",
            "slug": "china",
            "is_active": True,
            "sort_order": 12,
        },
    )
    for sort_order, name in enumerate(CHINA_CITIES, start=1):
        City.objects.update_or_create(
            country=china,
            name=name,
            defaults={"is_active": True, "sort_order": sort_order},
        )


class Migration(migrations.Migration):
    dependencies = [
        ("taxonomy", "0003_consolidate_project_categories"),
    ]

    operations = [
        migrations.RunPython(add_china, migrations.RunPython.noop),
    ]
