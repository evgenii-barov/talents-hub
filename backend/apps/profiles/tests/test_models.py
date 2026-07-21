from datetime import date

import pytest
from django.db import IntegrityError, transaction

from apps.profiles.models import Profile, ProfileExperience, ProfileSkill
from apps.taxonomy.models import Skill
from apps.users.models import User


@pytest.fixture
def user() -> User:
    return User.objects.create_user(email="alex@example.com", password="test-password")


@pytest.fixture
def profile(user: User) -> Profile:
    return Profile.objects.create(user=user, slug="alex", display_name="Alex")


@pytest.mark.django_db
def test_active_profile_skill_is_unique(profile: Profile) -> None:
    skill = Skill.objects.create(name="Python", slug="python")
    ProfileSkill.objects.create(profile=profile, skill=skill)

    with pytest.raises(IntegrityError), transaction.atomic():
        ProfileSkill.objects.create(profile=profile, skill=skill)


@pytest.mark.django_db
def test_current_experience_cannot_have_end_date(profile: Profile) -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        ProfileExperience.objects.create(
            profile=profile,
            organization_name="Talents Hub",
            title="Developer",
            started_on=date(2025, 1, 1),
            ended_on=date(2025, 2, 1),
            is_current=True,
        )
