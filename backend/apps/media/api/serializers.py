from rest_framework import serializers

from apps.media.models import MediaAsset


class MediaAssetSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = MediaAsset
        fields = (
            "id",
            "original_name",
            "content_type",
            "size_bytes",
            "width",
            "height",
            "alt_text",
            "status",
            "url",
        )

    def get_url(self, asset: MediaAsset) -> str:
        from django.core.files.storage import default_storage

        return default_storage.url(asset.storage_key)
