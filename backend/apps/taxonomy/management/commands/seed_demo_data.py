# ruff: noqa: E501

from datetime import date, timedelta
from typing import Any, TypedDict

from allauth.account.models import EmailAddress
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.applications.models import ProjectApplication
from apps.chat.models import (
    ChatMessage,
    Conversation,
    ConversationOrganization,
    ConversationParticipant,
)
from apps.common.models import PublicationStatus
from apps.notifications.models import Notification
from apps.organizations.models import Organization, OrganizationFocus, OrganizationMembership
from apps.profiles.models import (
    Profile,
    ProfileEducation,
    ProfileExperience,
    ProfileLanguage,
    ProfileLink,
    ProfileSkill,
)
from apps.projects.models import (
    Project,
    ProjectContact,
    ProjectFocus,
    ProjectRole,
    ProjectSkill,
    ProjectStatus,
)
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
from apps.users.models import User, UserRole

DEMO_PASSWORD = "Demo123!"


class ProfileSeedRow(TypedDict):
    key: str
    slug: str
    name: str
    headline: str
    bio: str
    country: str
    city: str | None
    format: WorkFormat
    availability: str
    note: str
    skills: list[str]
    primary: str


class Command(BaseCommand):
    help = "Create or update local demo users, profiles, organizations, projects, and activity."

    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        call_command("seed_mvp_taxonomy", verbosity=0)
        now = timezone.now()

        users = self._seed_users()
        profiles = self._seed_profiles(users, now)
        organizations = self._seed_organizations(users, now)
        projects = self._seed_projects(users, profiles, organizations, now)
        self._seed_activity(users, projects, organizations)

        self.stdout.write(
            self.style.SUCCESS(
                "Demo data is ready: "
                f"{len(profiles)} profiles, {len(organizations)} organizations, "
                f"{len(projects)} projects."
            )
        )
        self.stdout.write(f"Project lead: owner@demo.local / {DEMO_PASSWORD}")
        self.stdout.write(f"Talent: amina@demo.local / {DEMO_PASSWORD}")

    def _seed_users(self) -> dict[str, User]:
        rows: list[tuple[str, str, list[UserRole.Role]]] = [
            (
                "owner",
                "owner@demo.local",
                [UserRole.Role.PROJECT_LEAD, UserRole.Role.ORGANIZATION_MEMBER],
            ),
            ("amina", "amina@demo.local", [UserRole.Role.TALENT]),
            ("maya", "maya@demo.local", [UserRole.Role.TALENT]),
            ("mateo", "mateo@demo.local", [UserRole.Role.TALENT]),
            ("dana", "dana@demo.local", [UserRole.Role.TALENT, UserRole.Role.PROJECT_LEAD]),
            ("li", "li@demo.local", [UserRole.Role.TALENT]),
        ]
        result: dict[str, User] = {}
        for key, email, roles in rows:
            user, _ = User.objects.update_or_create(
                email=email,
                defaults={"is_active": True, "is_staff": False, "is_superuser": False},
            )
            user.set_password(DEMO_PASSWORD)
            user.save(update_fields=["password", "is_active", "is_staff", "is_superuser"])
            EmailAddress.objects.update_or_create(
                user=user,
                email=email,
                defaults={"primary": True, "verified": True},
            )
            for role in roles:
                UserRole.objects.get_or_create(user=user, role=role)
            result[key] = user
        return result

    def _seed_profiles(self, users: dict[str, User], now: Any) -> dict[str, Profile]:
        remote = WorkFormat.objects.get(slug="remote")
        hybrid = WorkFormat.objects.get(slug="hybrid")
        countries = {item.slug: item for item in Country.objects.all()}
        rows: list[ProfileSeedRow] = [
            {
                "key": "owner",
                "slug": "alex-volkov",
                "name": "Alex Volkov",
                "headline": "Civic innovation lead · Builds cross-border teams",
                "bio": "I turn early public-interest ideas into clear briefs, practical pilots and teams that can deliver them.",
                "country": "russia",
                "city": "Москва / Moscow",
                "format": hybrid,
                "availability": Profile.Availability.LIMITED,
                "note": "Available for project reviews and partnerships",
                "skills": ["project-management", "product-management", "partnerships"],
                "primary": "project-management",
            },
            {
                "key": "amina",
                "slug": "amina-yusuf",
                "name": "Amina Yusuf",
                "headline": "Community researcher · Participation and partnerships",
                "bio": "I design research and facilitation formats that help communities shape decisions instead of only reacting to them.",
                "country": "other",
                "city": None,
                "format": remote,
                "availability": Profile.Availability.AVAILABLE,
                "note": "Up to 12 hours per week",
                "skills": ["research", "partnerships", "community-management", "fundraising"],
                "primary": "research",
            },
            {
                "key": "maya",
                "slug": "maya-chen",
                "name": "Maya Chen",
                "headline": "Product designer · Services and design systems",
                "bio": "Product designer focused on complex services, accessible interaction and design systems that teams can actually maintain.",
                "country": "other",
                "city": None,
                "format": remote,
                "availability": Profile.Availability.AVAILABLE,
                "note": "Open to a six-to-eight week product sprint",
                "skills": ["ux-ui-design", "research", "product-management", "graphic-design"],
                "primary": "ux-ui-design",
            },
            {
                "key": "mateo",
                "slug": "mateo-silva",
                "name": "Mateo Silva",
                "headline": "Data strategist · Evidence for public decisions",
                "bio": "I make messy programme and city data useful through careful analysis, clear models and decision-ready stories.",
                "country": "other",
                "city": None,
                "format": hybrid,
                "availability": Profile.Availability.AVAILABLE,
                "note": "Available now",
                "skills": ["data-analytics", "python", "research", "content-copywriting"],
                "primary": "data-analytics",
            },
            {
                "key": "dana",
                "slug": "dana-sadykova",
                "name": "Dana Sadykova",
                "headline": "Education programme designer · Career transitions",
                "bio": "I build learning programmes that connect new skills with real work, mentors and measurable outcomes.",
                "country": "kazakhstan",
                "city": "Алматы / Almaty",
                "format": hybrid,
                "availability": Profile.Availability.LIMITED,
                "note": "Available for advisory work",
                "skills": ["teaching", "project-management", "business-english", "partnerships"],
                "primary": "teaching",
            },
            {
                "key": "li",
                "slug": "li-wei",
                "name": "Li Wei",
                "headline": "Full-stack developer · Data-rich web products",
                "bio": "I prototype reliable web products and internal tools, with a focus on understandable code and useful data flows.",
                "country": "other",
                "city": None,
                "format": remote,
                "availability": Profile.Availability.AVAILABLE,
                "note": "8–10 hours per week",
                "skills": [
                    "javascript-typescript",
                    "python",
                    "artificial-intelligence",
                    "data-analytics",
                ],
                "primary": "javascript-typescript",
            },
        ]

        english = Language.objects.get(code="en")
        russian = Language.objects.get(code="ru")
        result: dict[str, Profile] = {}
        for row in rows:
            country = countries[row["country"]]
            city = (
                City.objects.filter(country=country, name=row["city"]).first()
                if row["city"]
                else None
            )
            profile, _ = Profile.objects.update_or_create(
                user=users[row["key"]],
                defaults={
                    "slug": row["slug"],
                    "display_name": row["name"],
                    "headline": row["headline"],
                    "bio": row["bio"],
                    "country": country,
                    "city": city,
                    "visibility": Profile.Visibility.PUBLIC,
                    "availability": row["availability"],
                    "availability_note": row["note"],
                    "remote_preference": row["format"],
                    "timezone": "Europe/Moscow",
                    "is_verified": True,
                    "status": PublicationStatus.PUBLISHED,
                    "published_at": now,
                },
            )
            for index, skill_slug in enumerate(row["skills"]):
                ProfileSkill.objects.update_or_create(
                    profile=profile,
                    skill=Skill.objects.get(slug=skill_slug),
                    defaults={
                        "level": ProfileSkill.Level.ADVANCED,
                        "is_primary": skill_slug == row["primary"],
                        "sort_order": index,
                        "deleted_at": None,
                    },
                )
            for index, (language, proficiency, is_primary) in enumerate(
                [
                    (english, ProfileLanguage.Proficiency.C1, True),
                    (russian, ProfileLanguage.Proficiency.B2, False),
                ]
            ):
                ProfileLanguage.objects.update_or_create(
                    profile=profile,
                    language=language,
                    defaults={
                        "proficiency": proficiency,
                        "is_primary": is_primary,
                        "sort_order": index,
                        "deleted_at": None,
                    },
                )
            ProfileExperience.objects.update_or_create(
                profile=profile,
                organization_name="Talents Hub Demo Network",
                title=row["headline"].split(" · ")[0],
                defaults={
                    "location_text": city.name if city else "Remote",
                    "work_format": row["format"],
                    "started_on": date(2024, 1, 1),
                    "ended_on": None,
                    "is_current": True,
                    "description": row["bio"],
                    "sort_order": 0,
                    "deleted_at": None,
                },
            )
            if row["key"] == "amina":
                for experience in (
                    {
                        "organization_name": "Open Cities Collaborative",
                        "title": "Community Engagement Lead",
                        "location_text": "Nairobi, Kenya",
                        "work_format": hybrid,
                        "started_on": date(2020, 2, 1),
                        "ended_on": date(2023, 12, 1),
                        "description": (
                            "Led participatory research for public-service projects, "
                            "facilitated resident workshops and translated findings into "
                            "delivery priorities for partner teams."
                        ),
                        "sort_order": 1,
                    },
                    {
                        "organization_name": "Participation Works Foundation",
                        "title": "Research and Partnerships Coordinator",
                        "location_text": "Mombasa, Kenya",
                        "work_format": hybrid,
                        "started_on": date(2017, 6, 1),
                        "ended_on": date(2020, 1, 1),
                        "description": (
                            "Coordinated community interviews, local partner relationships "
                            "and learning reports across youth and neighbourhood programmes."
                        ),
                        "sort_order": 2,
                    },
                ):
                    ProfileExperience.objects.update_or_create(
                        profile=profile,
                        organization_name=experience["organization_name"],
                        title=experience["title"],
                        defaults={
                            **experience,
                            "is_current": False,
                            "deleted_at": None,
                        },
                    )

                education_levels = {
                    item.slug: item
                    for item in EducationLevel.objects.filter(
                        slug__in=("bachelor", "master")
                    )
                }
                for education in (
                    {
                        "institution_name": "University of Nairobi",
                        "degree": "Master of Arts",
                        "field_of_study": "Development Studies",
                        "education_level": education_levels.get("master"),
                        "started_on": date(2015, 9, 1),
                        "ended_on": date(2017, 6, 1),
                        "credential_url": "https://example.com/amina-yusuf/ma-development-studies",
                        "sort_order": 0,
                    },
                    {
                        "institution_name": "Kenyatta University",
                        "degree": "Bachelor of Arts",
                        "field_of_study": "Sociology and Community Development",
                        "education_level": education_levels.get("bachelor"),
                        "started_on": date(2010, 9, 1),
                        "ended_on": date(2014, 6, 1),
                        "credential_url": "https://example.com/amina-yusuf/ba-sociology",
                        "sort_order": 1,
                    },
                ):
                    ProfileEducation.objects.update_or_create(
                        profile=profile,
                        institution_name=education["institution_name"],
                        degree=education["degree"],
                        defaults={
                            **education,
                            "is_verified": True,
                            "deleted_at": None,
                        },
                    )
            ProfileLink.objects.update_or_create(
                profile=profile,
                kind=ProfileLink.Kind.PORTFOLIO,
                defaults={
                    "url": f"https://example.com/{row['slug']}",
                    "label": "Selected work",
                    "sort_order": 0,
                    "deleted_at": None,
                },
            )
            result[row["key"]] = profile
        return result

    def _seed_organizations(self, users: dict[str, User], now: Any) -> dict[str, Organization]:
        countries = {item.slug: item for item in Country.objects.all()}
        rows = [
            (
                "open-cities-lab",
                "Open Cities Lab",
                Organization.OrganizationType.COMMUNITY,
                "Tools and research for understandable public services.",
                "russia",
                "Москва / Moscow",
                ["urban", "inclusion"],
            ),
            (
                "steppe-futures",
                "Steppe Futures",
                Organization.OrganizationType.EDUCATION,
                "Learning programmes connected to real regional work.",
                "kazakhstan",
                "Алматы / Almaty",
                ["careers", "inclusion"],
            ),
            (
                "bridge-media",
                "Bridge Media Collective",
                Organization.OrganizationType.NGO,
                "Independent stories produced across languages and borders.",
                "uzbekistan",
                "Ташкент / Tashkent",
                ["culture-media", "careers"],
            ),
        ]
        result: dict[str, Organization] = {}
        for slug, name, organization_type, tagline, country_slug, city_name, focus_slugs in rows:
            country = countries[country_slug]
            city = City.objects.filter(country=country, name=city_name).first()
            organization, _ = Organization.objects.update_or_create(
                slug=slug,
                defaults={
                    "legal_name": name,
                    "display_name": name,
                    "organization_type": organization_type,
                    "tagline": tagline,
                    "description": f"{tagline} We convene practitioners, support small pilots and share what works.",
                    "website_url": f"https://example.com/{slug}",
                    "email": f"hello@{slug}.demo.local",
                    "country": country,
                    "city": city,
                    "location_text": city.name if city else country.name,
                    "founded_year": 2021,
                    "visibility": Organization.Visibility.PUBLIC,
                    "is_verified": True,
                    "verified_at": now,
                    "status": PublicationStatus.PUBLISHED,
                    "published_at": now,
                    "deleted_at": None,
                },
            )
            for index, focus_slug in enumerate(focus_slugs):
                OrganizationFocus.objects.update_or_create(
                    organization=organization,
                    focus_area=FocusArea.objects.get(slug=focus_slug),
                    defaults={"sort_order": index, "deleted_at": None},
                )
            OrganizationMembership.objects.update_or_create(
                organization=organization,
                user=users["owner"],
                defaults={
                    "role": OrganizationMembership.Role.OWNER,
                    "status": OrganizationMembership.Status.ACTIVE,
                    "title": "Programme lead",
                    "joined_at": now,
                    "left_at": None,
                    "deleted_at": None,
                },
            )
            result[slug] = organization
        return result

    def _seed_projects(
        self,
        users: dict[str, User],
        profiles: dict[str, Profile],
        organizations: dict[str, Organization],
        now: Any,
    ) -> dict[str, Project]:
        today = timezone.localdate()
        english = Language.objects.get(code="en")
        remote = WorkFormat.objects.get(slug="remote")
        hybrid = WorkFormat.objects.get(slug="hybrid")
        flexible = WorkFormat.objects.get(slug="flexible")
        rows = [
            (
                "neighborhood-climate-lab",
                "Neighbourhood Climate Lab",
                "Turn local climate observations into three small pilots residents can test this summer.",
                "science-education",
                Project.Stage.PILOT,
                "open-cities-lab",
                hybrid,
                "climate",
                ["research", "ux-ui-design", "project-management"],
                [("Community researcher", 2, 10), ("Service designer", 1, 8)],
            ),
            (
                "accessible-city-services",
                "Accessible City Services Map",
                "Map the moments where residents lose time or trust when using essential public services.",
                "support-services",
                Project.Stage.PROTOTYPE,
                "open-cities-lab",
                hybrid,
                "urban",
                ["ux-ui-design", "research", "javascript-typescript"],
                [("UX researcher", 1, 8), ("Frontend developer", 2, 10)],
            ),
            (
                "youth-skills-atlas",
                "Youth Skills Atlas",
                "Build a practical view of emerging skills, learning routes and entry-level work across the region.",
                "science-education",
                Project.Stage.ACTIVE,
                "steppe-futures",
                remote,
                "careers",
                ["data-analytics", "content-copywriting", "business-english"],
                [("Data analyst", 2, 8), ("Content editor", 1, 6)],
            ),
            (
                "community-story-exchange",
                "Community Story Exchange",
                "Create a multilingual publishing exchange for stories that rarely cross regional borders.",
                "support-services",
                Project.Stage.TEAM_FORMATION,
                "bridge-media",
                remote,
                "culture-media",
                ["content-copywriting", "video-production", "graphic-design"],
                [("Bilingual editor", 2, 8), ("Video producer", 1, 10)],
            ),
            (
                "ai-mentor-first-jobs",
                "AI Mentor for First Jobs",
                "Prototype a transparent career assistant that helps graduates prepare for a first serious application.",
                "business-entrepreneurship",
                Project.Stage.PROTOTYPE,
                "steppe-futures",
                remote,
                "artificial-intelligence",
                ["artificial-intelligence", "python", "ux-ui-design"],
                [("ML engineer", 1, 10), ("Product designer", 1, 8)],
            ),
            (
                "local-food-recovery",
                "Local Food Recovery Network",
                "Connect small food businesses with community groups before usable surplus becomes waste.",
                "business-entrepreneurship",
                Project.Stage.TEAM_FORMATION,
                "open-cities-lab",
                flexible,
                "climate",
                ["partnerships", "community-management", "javascript-typescript"],
                [("Partnerships coordinator", 2, 6), ("Full-stack developer", 1, 8)],
            ),
        ]
        result: dict[str, Project] = {}
        for index, (
            slug,
            title,
            summary,
            category_slug,
            stage,
            org_slug,
            work_format,
            focus_slug,
            skill_slugs,
            roles,
        ) in enumerate(rows):
            organization = organizations[org_slug]
            owner_key = "dana" if index == 2 else "owner"
            owner = users[owner_key]
            owner_profile = profiles[owner_key]
            starts_on = today + timedelta(days=30 + index * 5)
            project, _ = Project.objects.update_or_create(
                slug=slug,
                defaults={
                    "title": title,
                    "short_description": summary,
                    "description": f"{summary}\n\nThe team will begin with shared research, publish weekly decisions and end with a concrete prototype or field test.",
                    "owner": owner,
                    "organization": organization,
                    "category": Category.objects.get(slug=category_slug),
                    "stage": stage,
                    "problem_statement": "Useful local knowledge is fragmented, while small teams lack a clear path from insight to action.",
                    "goal_statement": "Create an evidence-based pilot that a partner can continue after the initial team finishes.",
                    "expected_outcome": "A tested prototype, documented findings and a practical handover plan.",
                    "timeline_text": "Discovery, prototype, field test, handover",
                    "scope": Project.Scope.INTERNATIONAL,
                    "country": organization.country,
                    "city": organization.city,
                    "work_format": work_format,
                    "working_language": english,
                    "starts_on": starts_on,
                    "ends_on": starts_on + timedelta(days=56),
                    "application_deadline": starts_on - timedelta(days=8),
                    "is_featured": index < 3,
                    "status": ProjectStatus.PUBLISHED,
                    "published_at": now - timedelta(days=index),
                    "deleted_at": None,
                },
            )
            ProjectFocus.objects.update_or_create(
                project=project,
                focus_area=FocusArea.objects.get(slug=focus_slug),
                defaults={"deleted_at": None},
            )
            for skill_slug in skill_slugs:
                ProjectSkill.objects.update_or_create(
                    project=project,
                    skill=Skill.objects.get(slug=skill_slug),
                    defaults={"importance": ProjectSkill.Importance.REQUIRED, "deleted_at": None},
                )
            for role_index, (role_title, seats, hours) in enumerate(roles):
                ProjectRole.objects.update_or_create(
                    project=project,
                    title=role_title,
                    defaults={
                        "description": f"Bring your experience as a {role_title.lower()} to the weekly working sessions and field test.",
                        "first_responsibility": "Review the brief and propose the first two-week work plan.",
                        "commitment_hours_per_week": hours,
                        "seats_total": seats,
                        "seats_filled": 0,
                        "status": ProjectRole.Status.OPEN,
                        "sort_order": role_index,
                        "deleted_at": None,
                    },
                )
            ProjectContact.objects.update_or_create(
                project=project,
                role_label="Project lead",
                defaults={
                    "name": owner_profile.display_name,
                    "email": owner.email,
                    "is_public": True,
                    "deleted_at": None,
                },
            )
            result[slug] = project
        return result

    def _seed_activity(
        self,
        users: dict[str, User],
        projects: dict[str, Project],
        organizations: dict[str, Organization],
    ) -> None:
        climate_role = ProjectRole.objects.get(
            project=projects["neighborhood-climate-lab"], title="Community researcher"
        )
        ProjectApplication.objects.update_or_create(
            project_role=climate_role,
            applicant=users["amina"],
            defaults={
                "cover_letter": "I can run the first resident interviews and turn findings into a facilitation plan.",
                "status": ProjectApplication.Status.IN_REVIEW,
                "reviewed_at": timezone.now(),
                "reviewed_by": users["owner"],
                "review_note": "Strong community research background.",
                "deleted_at": None,
            },
        )
        design_role = ProjectRole.objects.get(
            project=projects["ai-mentor-first-jobs"], title="Product designer"
        )
        ProjectApplication.objects.update_or_create(
            project_role=design_role,
            applicant=users["maya"],
            defaults={
                "cover_letter": "I would like to define the trust and explanation patterns for the first prototype.",
                "status": ProjectApplication.Status.SUBMITTED,
                "deleted_at": None,
            },
        )

        conversation, _ = Conversation.objects.update_or_create(
            project=projects["neighborhood-climate-lab"],
            created_by=users["amina"],
            subject="Research approach for the climate pilot",
            defaults={"kind": Conversation.Kind.DIRECT, "deleted_at": None},
        )
        for user in (users["amina"], users["owner"]):
            ConversationParticipant.objects.update_or_create(
                conversation=conversation,
                user=user,
                defaults={"last_read_at": timezone.now(), "deleted_at": None},
            )
        messages = [
            (
                users["amina"],
                "I reviewed the brief. I would start with eight short resident interviews across two neighbourhoods.",
            ),
            (
                users["owner"],
                "That fits the pilot. Could you also document the recruitment criteria and consent flow?",
            ),
            (
                users["amina"],
                "Yes. I will share a one-page research plan before Thursday's working session.",
            ),
        ]
        last_message = None
        for sender, body in messages:
            last_message, _ = ChatMessage.objects.get_or_create(
                conversation=conversation,
                sender=sender,
                body=body,
                defaults={"deleted_at": None},
            )
        if last_message is not None:
            conversation.last_message_at = last_message.created_at
            conversation.save(update_fields=["last_message_at", "updated_at"])

        organization_conversation, _ = Conversation.objects.update_or_create(
            created_by=users["amina"],
            subject="Partnership with Open Cities Lab",
            defaults={"kind": Conversation.Kind.ORGANIZATION, "deleted_at": None},
        )
        ConversationParticipant.objects.update_or_create(
            conversation=organization_conversation,
            user=users["amina"],
            defaults={"deleted_at": None},
        )
        ConversationOrganization.objects.update_or_create(
            conversation=organization_conversation,
            organization=organizations["open-cities-lab"],
            defaults={"deleted_at": None},
        )
        organization_messages = [
            (
                users["amina"],
                None,
                "Could your team review the resident interview plan next week?",
            ),
            (
                users["owner"],
                organizations["open-cities-lab"],
                "Yes, send it here and we will collect feedback from the programme team.",
            ),
        ]
        organization_last_message = None
        for sender, sender_organization, body in organization_messages:
            organization_last_message, _ = ChatMessage.objects.get_or_create(
                conversation=organization_conversation,
                sender=sender,
                sender_organization=sender_organization,
                body=body,
                defaults={"deleted_at": None},
            )
        if organization_last_message is not None:
            organization_conversation.last_message_at = organization_last_message.created_at
            organization_conversation.save(update_fields=["last_message_at", "updated_at"])

        group_conversation, _ = Conversation.objects.update_or_create(
            created_by=users["owner"],
            subject="Regional evidence working group",
            defaults={"kind": Conversation.Kind.GROUP, "deleted_at": None},
        )
        for user in (users["owner"], users["maya"], users["mateo"]):
            ConversationParticipant.objects.update_or_create(
                conversation=group_conversation,
                user=user,
                defaults={"deleted_at": None},
            )
        ConversationOrganization.objects.update_or_create(
            conversation=group_conversation,
            organization=organizations["steppe-futures"],
            defaults={"deleted_at": None},
        )
        group_messages = [
            (
                users["owner"],
                organizations["steppe-futures"],
                "Welcome. Let us use this conversation for shared research decisions.",
            ),
            (users["maya"], None, "I will post the first synthesis board tomorrow."),
            (users["mateo"], None, "I can add the regional data sources after that."),
        ]
        group_last_message = None
        for sender, sender_organization, body in group_messages:
            group_last_message, _ = ChatMessage.objects.get_or_create(
                conversation=group_conversation,
                sender=sender,
                sender_organization=sender_organization,
                body=body,
                defaults={"deleted_at": None},
            )
        if group_last_message is not None:
            group_conversation.last_message_at = group_last_message.created_at
            group_conversation.save(update_fields=["last_message_at", "updated_at"])

        Notification.objects.get_or_create(
            recipient=users["owner"],
            type="application_submitted",
            payload={
                "project_slug": "neighborhood-climate-lab",
                "message": "Amina Yusuf applied for Community researcher.",
            },
            defaults={"email_status": Notification.EmailStatus.SKIPPED},
        )
