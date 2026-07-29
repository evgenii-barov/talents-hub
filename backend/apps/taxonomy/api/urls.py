from django.urls import path

from .views import TaxonomyListView

urlpatterns = [
    path("taxonomy/<str:resource>/", TaxonomyListView.as_view(), name="taxonomy-list"),
]
