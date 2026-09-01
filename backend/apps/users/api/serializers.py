from typing import Any

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(trim_whitespace=False, write_only=True)


class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(trim_whitespace=False, write_only=True)
    password_confirmation = serializers.CharField(trim_whitespace=False, write_only=True)
    terms_accepted = serializers.BooleanField(write_only=True)
    personal_data_consent = serializers.BooleanField(write_only=True)
    age_confirmed = serializers.BooleanField(write_only=True)

    def validate_email(self, email: str) -> str:
        return email.strip().lower()

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if attrs["password"] != attrs["password_confirmation"]:
            raise serializers.ValidationError({"password_confirmation": "Passwords do not match."})
        required_consents = {
            "terms_accepted": "Accept the User Agreement to create an account.",
            "personal_data_consent": "Consent to personal data processing is required.",
            "age_confirmed": "You must confirm that you are at least 18 years old.",
        }
        errors = {
            field: message
            for field, message in required_consents.items()
            if attrs.get(field) is not True
        }
        if errors:
            raise serializers.ValidationError(errors)
        validate_password(attrs["password"])
        return attrs


class EmailSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, email: str) -> str:
        return email.strip().lower()


class EmailTokenSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()


class PasswordResetConfirmSerializer(EmailTokenSerializer):
    password = serializers.CharField(trim_whitespace=False, write_only=True)
    password_confirmation = serializers.CharField(trim_whitespace=False, write_only=True)

    def validate(self, attrs: dict[str, str]) -> dict[str, str]:
        if attrs["password"] != attrs["password_confirmation"]:
            raise serializers.ValidationError({"password_confirmation": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs
