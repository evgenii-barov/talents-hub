from django.contrib import admin

from .models import (
    ChatMessage,
    Conversation,
    ConversationOrganization,
    ConversationParticipant,
)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "kind", "project", "created_by", "last_message_at", "created_at")
    list_filter = ("kind",)
    search_fields = ("subject", "created_by__email", "project__title")
    readonly_fields = ("created_at", "updated_at", "last_message_at")


@admin.register(ConversationParticipant)
class ConversationParticipantAdmin(admin.ModelAdmin):
    list_display = ("conversation", "user", "is_direct", "joined_at", "last_read_at")
    list_filter = ("is_direct",)
    search_fields = ("user__email",)


@admin.register(ConversationOrganization)
class ConversationOrganizationAdmin(admin.ModelAdmin):
    list_display = ("conversation", "organization", "joined_at", "deleted_at")
    search_fields = ("organization__display_name", "organization__slug")


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = (
        "conversation",
        "sender",
        "sender_organization",
        "created_at",
        "deleted_at",
    )
    search_fields = ("body", "sender__email", "sender_organization__display_name")
    readonly_fields = ("created_at", "updated_at")
