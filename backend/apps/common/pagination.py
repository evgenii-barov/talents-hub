from rest_framework.pagination import PageNumberPagination


class CataloguePagination(PageNumberPagination):
    """Stable page size for public catalogues consumed by load-more controls."""

    page_size = 24
