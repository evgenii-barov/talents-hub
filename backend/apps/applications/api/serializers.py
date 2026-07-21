from rest_framework import serializers

from apps.applications.models import ProjectApplication


class ProjectApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectApplication
        fields = (
            "id",
            "project_role",
            "cover_letter",
            "status",
            "submitted_at",
            "reviewed_at",
            "review_note",
        )
        read_only_fields = ("id", "status", "submitted_at", "reviewed_at", "review_note")


class ApplicationTransitionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=ProjectApplication.Status.choices)
    review_note = serializers.CharField(required=False, allow_blank=True, max_length=5000)
