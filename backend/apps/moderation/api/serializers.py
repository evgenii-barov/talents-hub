from rest_framework import serializers

from apps.moderation.models import ModerationCase


class ModerationSubmissionSerializer(serializers.Serializer):
    target_type = serializers.ChoiceField(choices=("profile", "organization", "project", "media"))
    target_id = serializers.UUIDField()
    reason_code = serializers.CharField(default="publication_review", max_length=64)


class ModerationCaseSerializer(serializers.ModelSerializer):
    target_type = serializers.SerializerMethodField()

    class Meta:
        model = ModerationCase
        fields = (
            "id",
            "target_type",
            "object_id",
            "status",
            "reason_code",
            "decision_note",
            "opened_at",
            "resolved_at",
        )

    def get_target_type(self, case: ModerationCase) -> str:
        return case.content_type.model


class ModerationDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=("approved", "changes_requested", "rejected"))
    note = serializers.CharField(allow_blank=True, max_length=5000)
