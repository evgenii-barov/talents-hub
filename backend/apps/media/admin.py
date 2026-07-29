from django.contrib import admin

from .models import MediaAsset, MediaAttachment


@admin.register(MediaAsset)
class MediaAssetAdmin(admin.ModelAdmin):
    list_display = ("original_name", "uploaded_by", "content_type", "size_bytes", "status")
    list_filter = ("status", "content_type")
    search_fields = ("original_name", "storage_key", "uploaded_by__email")


@admin.register(MediaAttachment)
class MediaAttachmentAdmin(admin.ModelAdmin):
    list_display = ("asset", "purpose", "content_type", "object_id", "sort_order")
    list_filter = ("purpose", "content_type")
