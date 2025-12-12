from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AgentViewSet,
    ChatView,
    DocumentViewSet,
    LoginView,
    MeView,
    ModelListView,
    RefreshView,
    RegisterView,
)

router = DefaultRouter()
router.register(r"documents", DocumentViewSet, basename="documents")
router.register(r"agents", AgentViewSet, basename="agents")

urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="register"),
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/refresh", RefreshView.as_view(), name="token_refresh"),
    path("auth/me", MeView.as_view(), name="me"),
    path("models", ModelListView.as_view(), name="list-models"),
    path("chat", ChatView.as_view(), name="chat"),
]

urlpatterns += router.urls
