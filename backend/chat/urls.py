from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import UploadViewSet, chat, create_agent, list_models

router = DefaultRouter()
router.register(r"upload", UploadViewSet, basename="upload")

urlpatterns = [
    path("models", list_models, name="list-models"),
    path("create-agent", create_agent, name="create-agent"),
    path("chat", chat, name="chat"),
]

urlpatterns += router.urls
