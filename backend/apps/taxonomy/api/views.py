from typing import Any

from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import TAXONOMY_MODELS, TAXONOMY_SERIALIZERS


class TaxonomyListView(APIView):
    """Return active taxonomy records for selects and filters."""

    permission_classes = (AllowAny,)

    def get(self, request: Request, resource: str) -> Response:
        model = TAXONOMY_MODELS.get(resource)
        serializer_class = TAXONOMY_SERIALIZERS.get(resource)
        if model is None or serializer_class is None:
            raise NotFound("Unknown taxonomy resource.")

        queryset: Any = model.objects.filter(is_active=True)
        if resource == "cities":
            country = request.query_params.get("country")
            if country:
                queryset = queryset.filter(country_id=country)
            queryset = queryset.select_related("country")

        return Response(serializer_class(queryset, many=True).data)
