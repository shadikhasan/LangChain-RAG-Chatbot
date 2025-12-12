import uuid
from pathlib import Path

from django.conf import settings
from django.http import Http404
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .langchain_utils import build_qa_chain, build_vectorstore, model_catalog
from .models import UploadedDocument
from .serializers import AgentConfigSerializer, ChatRequestSerializer, UploadedDocumentSerializer

# In-memory agent session store for demo purposes
AGENT_SESSIONS = {}


@api_view(["GET"])
def list_models(request):
    return Response(model_catalog())


class UploadViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser]

    def create(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        doc = UploadedDocument.objects.create(name=uploaded_file.name, file=uploaded_file)
        serializer = UploadedDocumentSerializer(doc)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def create_agent(request):
    serializer = AgentConfigSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    document_ids = data.get("document_ids") or []
    documents = UploadedDocument.objects.filter(id__in=document_ids)
    if not documents:
        return Response({"detail": "No documents found. Upload at least one file."}, status=status.HTTP_400_BAD_REQUEST)

    file_paths = [Path(doc.file.path) for doc in documents]
    vectorstore, store_path = build_vectorstore(file_paths)

    session_id = str(uuid.uuid4())
    AGENT_SESSIONS[session_id] = {
        "store_path": str(store_path),
        "model": data["model"],
        "temperature": data.get("temperature", 0.2),
        "max_tokens": data.get("max_tokens", 512),
        "system_prompt": data.get("system_prompt", ""),
    }

    return Response({"session_id": session_id, "vectorstore": str(store_path)})


@api_view(["POST"])
def chat(request):
    serializer = ChatRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    session_id = data.get("session_id")
    session = AGENT_SESSIONS.get(session_id or "")

    store_path = None
    if session:
        store_path = Path(session["store_path"])
        temperature = session.get("temperature", data["temperature"])
        max_tokens = session.get("max_tokens", data["max_tokens"])
        system_prompt = session.get("system_prompt", data.get("system_prompt", ""))
    else:
        # allow ad-hoc chat with provided document ids
        doc_ids = data.get("document_ids") or []
        documents = UploadedDocument.objects.filter(id__in=doc_ids)
        if documents:
            file_paths = [Path(doc.file.path) for doc in documents]
            _, store_path = build_vectorstore(file_paths)
        temperature = data.get("temperature", 0.2)
        max_tokens = data.get("max_tokens", 512)
        system_prompt = data.get("system_prompt", "")

    if not store_path:
        return Response({"detail": "No session found and no documents provided."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        qa_chain = build_qa_chain(
            model=data["model"],
            api_key=data["api_key"],
            temperature=temperature,
            max_tokens=max_tokens,
            store_path=store_path,
            system_prompt=system_prompt,
        )
        # 🔑 NEW: Runnable invocation
        answer = qa_chain.invoke({"query": data["message"]})
    except Exception as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(
        {
            "answer": answer,
            "session_id": session_id,
            "vectorstore": str(store_path),
        }
    )
