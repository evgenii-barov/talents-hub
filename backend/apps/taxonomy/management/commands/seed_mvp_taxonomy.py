from typing import Any

from django.core.management.base import BaseCommand

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


class Command(BaseCommand):
    help = "Create or update the baseline bilingual taxonomy used by the MVP."

    def handle(self, *args: Any, **options: Any) -> None:
        categories = [
            ("Научные и образовательные проекты / Science & education", "science-education"),
            (
                "Бизнес и предпринимательство / Business & entrepreneurship",
                "business-entrepreneurship",
            ),
            (
                "Сопровождение и профессиональные услуги / Support & professional services",
                "support-services",
            ),
        ]
        category_by_slug = self._seed(Category, categories)
        Category.objects.exclude(slug__in=category_by_slug).update(is_active=False)
        self._seed(
            FocusArea,
            [
                ("Искусственный интеллект / AI", "artificial-intelligence"),
                ("Веб и мобильные продукты / Web & mobile", "web-mobile"),
                ("Карьера и занятость / Careers", "careers"),
                ("Городские проекты / Urban", "urban"),
                ("Инклюзия / Inclusion", "inclusion"),
                ("Климат и экология / Climate", "climate"),
                ("Культура и медиа / Culture & media", "culture-media"),
            ],
        )
        self._seed(
            WorkFormat,
            [
                ("Удалённо / Remote", "remote"),
                ("Очно / On-site", "on-site"),
                ("Гибридно / Hybrid", "hybrid"),
                ("Гибкий формат / Flexible", "flexible"),
            ],
        )
        self._seed(
            EducationLevel,
            [
                ("Среднее / Secondary", "secondary"),
                ("Профессиональное / Vocational", "vocational"),
                ("Бакалавриат / Bachelor", "bachelor"),
                ("Магистратура / Master", "master"),
                ("Аспирантура / Doctorate", "doctorate"),
                ("Дополнительное / Continuing education", "continuing"),
            ],
        )
        self._seed_languages()
        countries = self._seed_countries()
        self._seed_cities(countries)
        self._seed_skills(category_by_slug)
        self.stdout.write(self.style.SUCCESS("MVP taxonomy is ready."))

    @staticmethod
    def _seed(model: Any, rows: list[tuple[str, str]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for index, (name, slug) in enumerate(rows, start=1):
            value, _ = model.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "is_active": True, "sort_order": index},
            )
            result[slug] = value
        return result

    def _seed_languages(self) -> None:
        rows = [
            ("Русский / Russian", "ru", "ru", "Русский"),
            ("Английский / English", "en", "en", "English"),
            ("Испанский / Spanish", "es", "es", "Español"),
            ("Китайский / Chinese", "zh", "zh", "中文"),
            ("Французский / French", "fr", "fr", "Français"),
            ("Немецкий / German", "de", "de", "Deutsch"),
            ("Казахский / Kazakh", "kk", "kk", "Қазақ тілі"),
            ("Украинский / Ukrainian", "uk", "uk", "Українська"),
        ]
        for index, (name, slug, code, native_name) in enumerate(rows, start=1):
            Language.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "slug": slug,
                    "native_name": native_name,
                    "is_active": True,
                    "sort_order": index,
                },
            )

    def _seed_countries(self) -> dict[str, Country]:
        rows = [
            ("Россия / Russia", "russia", "RU"),
            ("Казахстан / Kazakhstan", "kazakhstan", "KZ"),
            ("Беларусь / Belarus", "belarus", "BY"),
            ("Армения / Armenia", "armenia", "AM"),
            ("Азербайджан / Azerbaijan", "azerbaijan", "AZ"),
            ("Грузия / Georgia", "georgia", "GE"),
            ("Кыргызстан / Kyrgyzstan", "kyrgyzstan", "KG"),
            ("Узбекистан / Uzbekistan", "uzbekistan", "UZ"),
            ("Таджикистан / Tajikistan", "tajikistan", "TJ"),
            ("Молдова / Moldova", "moldova", "MD"),
            ("Украина / Ukraine", "ukraine", "UA"),
            ("Китай / China", "china", "CN"),
            ("Другие страны / Other", "other", "ZZ"),
        ]
        result: dict[str, Country] = {}
        for index, (name, slug, code) in enumerate(rows, start=1):
            country, _ = Country.objects.update_or_create(
                code=code,
                defaults={"name": name, "slug": slug, "is_active": True, "sort_order": index},
            )
            result[slug] = country
        return result

    @staticmethod
    def _seed_cities(countries: dict[str, Country]) -> None:
        rows = {
            "russia": [
                "Москва / Moscow",
                "Санкт-Петербург / Saint Petersburg",
                "Казань / Kazan",
                "Новосибирск / Novosibirsk",
                "Екатеринбург / Yekaterinburg",
            ],
            "kazakhstan": [
                "Астана / Astana",
                "Алматы / Almaty",
                "Караганда / Karaganda",
            ],
            "belarus": ["Минск / Minsk"],
            "armenia": ["Ереван / Yerevan"],
            "georgia": ["Тбилиси / Tbilisi"],
            "uzbekistan": ["Ташкент / Tashkent"],
            "china": [
                "Пекин / Beijing",
                "Шанхай / Shanghai",
                "Гуанчжоу / Guangzhou",
                "Шэньчжэнь / Shenzhen",
            ],
        }
        for country_slug, names in rows.items():
            country = countries[country_slug]
            for index, name in enumerate(names, start=1):
                City.objects.update_or_create(
                    country=country, name=name, defaults={"is_active": True, "sort_order": index}
                )

    @staticmethod
    def _seed_skills(categories: dict[str, Category]) -> None:
        rows = [
            ("Python", "python", "business-entrepreneurship"),
            ("JavaScript / TypeScript", "javascript-typescript", "business-entrepreneurship"),
            ("UX/UI-дизайн / UX/UI design", "ux-ui-design", "support-services"),
            ("Аналитика данных / Data analytics", "data-analytics", "business-entrepreneurship"),
            (
                "Искусственный интеллект / AI",
                "artificial-intelligence",
                "business-entrepreneurship",
            ),
            (
                "Управление продуктом / Product management",
                "product-management",
                "business-entrepreneurship",
            ),
            (
                "Управление проектами / Project management",
                "project-management",
                "business-entrepreneurship",
            ),
            ("Исследования / Research", "research", "science-education"),
            ("Маркетинг / Marketing", "marketing", "business-entrepreneurship"),
            ("Контент и копирайтинг / Content", "content-copywriting", "support-services"),
            ("Графический дизайн / Graphic design", "graphic-design", "support-services"),
            ("Видеопродакшн / Video", "video-production", "support-services"),
            ("Фандрайзинг / Fundraising", "fundraising", "support-services"),
            ("Партнёрства / Partnerships", "partnerships", "support-services"),
            ("События / Event management", "event-management", "support-services"),
            ("Преподавание / Teaching", "teaching", "science-education"),
            ("Комьюнити-менеджмент / Community", "community-management", "support-services"),
            ("Финансы / Finance", "finance", "business-entrepreneurship"),
            ("Право / Legal", "legal", "support-services"),
            ("Английский для работы / Business English", "business-english", "science-education"),
        ]
        for index, (name, slug, category_slug) in enumerate(rows, start=1):
            Skill.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "category": categories[category_slug],
                    "is_active": True,
                    "sort_order": index,
                },
            )
