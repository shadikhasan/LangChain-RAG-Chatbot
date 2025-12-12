import shutil
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .langchain_utils import build_qa_chain, build_vectorstore, model_catalog
from .models import Agent, UploadedDocument
from .serializers import (
    AgentCreateSerializer,
    AgentSerializer,
    AgentUpdateSerializer,
    ChatRequestSerializer,
    RegisterSerializer,
    UploadedDocumentSerializer,
)

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": {"id": user.id, "username": user.username, "email": user.email},
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({"id": user.id, "username": user.username, "email": user.email})


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = UploadedDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def get_queryset(self):
        return UploadedDocument.objects.filter(owner=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user, name=serializer.validated_data["file"].name)


class AgentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Agent.objects.filter(owner=self.request.user).prefetch_related("documents")

    def get_serializer_class(self):
        if self.action == "create":
            return AgentCreateSerializer
        if self.action in ["partial_update", "update"]:
            return AgentUpdateSerializer
        return AgentSerializer

    def list(self, request, *args, **kwargs):
        serializer = AgentSerializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        agent = self.get_object()
        serializer = AgentSerializer(agent)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = AgentCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        docs = list(
            UploadedDocument.objects.filter(id__in=serializer.validated_data["document_ids"], owner=request.user)
        )
        agent = Agent.objects.create(
            owner=request.user,
            name=serializer.validated_data["name"],
            model=serializer.validated_data["model"],
            temperature=serializer.validated_data["temperature"],
            max_tokens=serializer.validated_data["max_tokens"],
            system_prompt=serializer.validated_data.get("system_prompt", ""),
            api_key=serializer.validated_data["api_key"],
            store_path="",  # set after vectorstore build
        )
        agent.documents.set(docs)
        file_paths = [Path(doc.file.path) for doc in docs]
        _, store_path = build_vectorstore(file_paths, user_id=request.user.id, agent_id=agent.id)
        agent.store_path = str(store_path)
        agent.save(update_fields=["store_path"])
        return Response(AgentSerializer(agent).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        agent = self.get_object()
        serializer = AgentUpdateSerializer(data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        docs_changed = False

        if "name" in data:
            agent.name = data["name"]
        if "model" in data:
            agent.model = data["model"]
        if "temperature" in data:
            agent.temperature = data["temperature"]
        if "max_tokens" in data:
            agent.max_tokens = data["max_tokens"]
        if "system_prompt" in data:
            agent.system_prompt = data["system_prompt"]
        if "api_key" in data:
            agent.api_key = data["api_key"]

        if "document_ids" in data:
            docs = list(UploadedDocument.objects.filter(id__in=data["document_ids"], owner=request.user))
            agent.documents.set(docs)
            docs_changed = True

        if docs_changed:
            file_paths = [Path(doc.file.path) for doc in agent.documents.all()]
            # Rebuild vectorstore because docs changed
            self._safe_remove_store(agent.store_path)
            if file_paths:
                _, store_path = build_vectorstore(file_paths, user_id=request.user.id, agent_id=agent.id)
                agent.store_path = str(store_path)
            else:
                agent.store_path = ""

        agent.save()
        return Response(AgentSerializer(agent).data)

    def destroy(self, request, *args, **kwargs):
        agent = self.get_object()
        store_path = agent.store_path
        agent.delete()
        self._safe_remove_store(store_path)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def rebuild(self, request, pk=None):
        agent = self.get_object()
        docs = list(agent.documents.all())
        if not docs:
            return Response({"detail": "Agent has no documents."}, status=status.HTTP_400_BAD_REQUEST)

        file_paths = [Path(doc.file.path) for doc in docs]
        self._safe_remove_store(agent.store_path)
        _, store_path = build_vectorstore(file_paths, user_id=request.user.id, agent_id=agent.id)
        agent.store_path = str(store_path)
        agent.save(update_fields=["store_path"])
        return Response(AgentSerializer(agent).data)

    @action(detail=True, methods=["post"])
    def reset_kb(self, request, pk=None):
        """
        Clears the agent's knowledge base and unlinks all documents.
        """
        agent = self.get_object()
        self._safe_remove_store(agent.store_path)
        agent.store_path = ""
        agent.documents.clear()
        agent.save(update_fields=["store_path"])
        return Response(AgentSerializer(agent).data)

    @staticmethod
    def _safe_remove_store(path_str: str):
        if not path_str:
            return
        path = Path(path_str)
        if path.exists() and path.is_dir():
            shutil.rmtree(path, ignore_errors=True)


class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        agent = get_object_or_404(Agent, id=data["agent_id"], owner=request.user)
        provided_key = data.get("api_key")
        api_key = provided_key or agent.api_key
        if not api_key:
            return Response({"detail": "Agent is missing an API key."}, status=status.HTTP_400_BAD_REQUEST)
        if not agent.store_path:
            return Response({"detail": "Agent has no vectorstore."}, status=status.HTTP_400_BAD_REQUEST)
        # optionally persist a newly provided key
        if provided_key and provided_key != agent.api_key:
            agent.api_key = provided_key
            agent.save(update_fields=["api_key"])

        qa_chain = build_qa_chain(
            model=agent.model,
            api_key=api_key,
            temperature=agent.temperature,
            max_tokens=agent.max_tokens,
            store_path=Path(agent.store_path),
            system_prompt=agent.system_prompt,
        )

        try:
            answer = qa_chain.invoke({"query": data["message"]})
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"answer": answer, "agent_id": str(agent.id), "vectorstore": agent.store_path})


class ModelListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(model_catalog())


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
