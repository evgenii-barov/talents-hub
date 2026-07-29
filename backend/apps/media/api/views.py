import hashlib
from pathlib import Path
from uuid import uuid4

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image, UnidentifiedImageError
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.media.models import MediaAsset

from .serializers import MediaAssetSerializer

MAX_AVATAR_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


class MyMediaUploadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request: Request) -> Response:
        uploaded_file = request.FILES.get("file")
        if uploaded_file is None:
            raise ValidationError({"file": "Choose an image to upload."})
        if uploaded_file.content_type not in ALLOWED_IMAGE_TYPES:
            raise ValidationError({"file": "Use a JPEG, PNG or WebP image."})
        if uploaded_file.size > MAX_AVATAR_BYTES:
            raise ValidationError({"file": "The image must be at most 5 MB."})

        content = uploaded_file.read()
        try:
            with Image.open(ContentFile(content)) as image:
                image.verify()
            with Image.open(ContentFile(content)) as image:
                width, height = image.size
        except (UnidentifiedImageError, OSError) as exc:
            raise ValidationError({"file": "The uploaded file is not a valid image."}) from exc

        suffix = Path(uploaded_file.name).suffix.lower() or ".bin"
        storage_key = f"uploads/{request.user.id}/{uuid4()}{suffix}"
        default_storage.save(storage_key, ContentFile(content))
        asset = MediaAsset.objects.create(
            uploaded_by=request.user,
            storage_key=storage_key,
            original_name=uploaded_file.name[:255],
            content_type=uploaded_file.content_type,
            size_bytes=len(content),
            checksum=hashlib.sha256(content).hexdigest(),
            status=MediaAsset.Status.AVAILABLE,
            width=width,
            height=height,
            alt_text=str(request.data.get("alt_text", ""))[:255],
        )
        return Response(MediaAssetSerializer(asset).data, status=status.HTTP_201_CREATED)
