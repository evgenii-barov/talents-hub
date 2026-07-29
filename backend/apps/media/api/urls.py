from django.urls import path

from .views import MyMediaUploadView

urlpatterns = [
    path("me/media/", MyMediaUploadView.as_view(), name="my-media-upload"),
]
