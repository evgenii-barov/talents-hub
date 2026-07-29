from rest_framework import serializers

from apps.applications.models import ProjectApplication


class ProjectApplicationSerializer(serializers.ModelSerializer):
    project_id = serializers.UUIDField(source="project_role.project_id", read_only=True)
    project_title = serializers.CharField(source="project_role.project.title", read_only=True)
    project_slug = serializers.CharField(source="project_role.project.slug", read_only=True)
    role_title = serializers.CharField(source="project_role.title", read_only=True)
    applicant_name = serializers.SerializerMethodField()
    applicant_profile_slug = serializers.SerializerMethodField()

    class Meta:
        model = ProjectApplication
        fields = (
            "id",
            "project_role",
            "project_id",
            "project_title",
            "project_slug",
            "role_title",
            "applicant_name",
            "applicant_profile_slug",
            "cover_letter",
            "status",
            "submitted_at",
            "reviewed_at",
            "review_note",
        )
        read_only_fields = ("id", "status", "submitted_at", "reviewed_at", "review_note")

    def get_applicant_name(self, application: ProjectApplication) -> str:
        profile = getattr(application.applicant, "profile", None)
        return profile.display_name if profile is not None else application.applicant.email

    def get_applicant_profile_slug(self, application: ProjectApplication) -> str | None:
        profile = getattr(application.applicant, "profile", None)
        return profile.slug if profile is not None else None


class ApplicationTransitionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=ProjectApplication.Status.choices)
    review_note = serializers.CharField(required=False, allow_blank=True, max_length=5000)
