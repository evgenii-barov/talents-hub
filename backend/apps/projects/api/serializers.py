from typing import Any

from rest_framework import serializers

from apps.projects.models import Project, ProjectContact, ProjectFocus, ProjectRole, ProjectSkill
from apps.taxonomy.models import Category


class TaxonomyReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class ProjectRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectRole
        fields = (
            "id",
            "title",
            "description",
            "first_responsibility",
            "commitment_hours_per_week",
            "seats_total",
            "seats_filled",
            "status",
        )


class ProjectFocusSerializer(serializers.ModelSerializer):
    focus_area = TaxonomyReferenceSerializer(read_only=True)

    class Meta:
        model = ProjectFocus
        fields = ("id", "focus_area")


class ProjectSkillSerializer(serializers.ModelSerializer):
    skill = TaxonomyReferenceSerializer(read_only=True)

    class Meta:
        model = ProjectSkill
        fields = ("id", "skill", "importance")


class ProjectContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectContact
        fields = ("id", "name", "email", "role_label")


class ProjectPublicSerializer(serializers.ModelSerializer):
    category = TaxonomyReferenceSerializer(read_only=True)
    work_format = TaxonomyReferenceSerializer(read_only=True)
    working_language = TaxonomyReferenceSerializer(read_only=True)
    organization_name = serializers.CharField(source="organization.display_name", read_only=True)
    roles = serializers.SerializerMethodField()
    focuses = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    contacts = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            "id",
            "slug",
            "title",
            "short_description",
            "description",
            "organization_name",
            "category",
            "stage",
            "problem_statement",
            "goal_statement",
            "expected_outcome",
            "timeline_text",
            "scope",
            "work_format",
            "working_language",
            "starts_on",
            "ends_on",
            "application_deadline",
            "is_featured",
            "roles",
            "focuses",
            "skills",
            "contacts",
        )

    def get_roles(self, project: Project) -> Any:
        return ProjectRoleSerializer(
            project.roles.filter(deleted_at__isnull=True), many=True
        ).data

    def get_focuses(self, project: Project) -> Any:
        return ProjectFocusSerializer(
            project.focuses.filter(deleted_at__isnull=True), many=True
        ).data

    def get_skills(self, project: Project) -> Any:
        return ProjectSkillSerializer(
            project.skills.filter(deleted_at__isnull=True), many=True
        ).data

    def get_contacts(self, project: Project) -> Any:
        return ProjectContactSerializer(
            project.contacts.filter(deleted_at__isnull=True, is_public=True), many=True
        ).data


class ProjectWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = (
            "slug",
            "title",
            "short_description",
            "description",
            "organization",
            "category",
            "stage",
            "problem_statement",
            "goal_statement",
            "expected_outcome",
            "timeline_text",
            "scope",
            "country",
            "city",
            "work_format",
            "working_language",
            "starts_on",
            "ends_on",
            "application_deadline",
        )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        country = attrs.get("country", getattr(self.instance, "country", None))
        city = attrs.get("city", getattr(self.instance, "city", None))
        if country is not None and city is not None and city.country_id != country.id:
            raise serializers.ValidationError({"city": "City must belong to the selected country."})
        return attrs


class ProjectRoleWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectRole
        fields = (
            "title",
            "description",
            "first_responsibility",
            "commitment_hours_per_week",
            "seats_total",
            "status",
            "sort_order",
        )
