from rest_framework import serializers

from .models import UploadedDocument


class UploadedDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedDocument
        fields = ["id", "name", "file", "created_at"]


class AgentConfigSerializer(serializers.Serializer):
    # Default Gemini 2.5 Flash
    model = serializers.CharField(default="gemini-2.5-flash")
    api_key = serializers.CharField(write_only=True)
    temperature = serializers.FloatField(default=0.2)
    max_tokens = serializers.IntegerField(default=512)
    system_prompt = serializers.CharField(allow_blank=True, required=False)
    document_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=True, required=False
    )


class ChatRequestSerializer(serializers.Serializer):
    session_id = serializers.CharField(required=False, allow_blank=True)
    message = serializers.CharField()
    # Default Gemini 2.5 Flash
    model = serializers.CharField(default="gemini-2.5-flash")
    api_key = serializers.CharField(write_only=True)
    temperature = serializers.FloatField(default=0.2)
    max_tokens = serializers.IntegerField(default=512)
    system_prompt = serializers.CharField(allow_blank=True, required=False)
    document_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=True, required=False
    )
