from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "type", "read_at", "email_status", "created_at")
    list_filter = ("type", "email_status")
    search_fields = ("recipient__email", "type")
    readonly_fields = ("created_at", "updated_at")
