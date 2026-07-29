import pytest
from django.core.management import call_command

from apps.projects.models import Project


@pytest.mark.django_db
def test_demo_project_contact_matches_its_owner() -> None:
    call_command("seed_demo_data", verbosity=0)

    project = Project.objects.select_related("owner__profile").get(slug="youth-skills-atlas")
    contact = project.contacts.get(role_label="Project lead", deleted_at__isnull=True)

    assert contact.name == project.owner.profile.display_name
    assert contact.email == project.owner.email
    assert contact.name == "Dana Sadykova"
    assert contact.email == "dana@demo.local"
