from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Agent, UploadedDocument

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")
        extra_kwargs = {"email": {"required": False}}

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email") or "",
            password=validated_data["password"],
        )


class UploadedDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedDocument
        fields = ["id", "name", "file", "created_at"]
        read_only_fields = ["id", "created_at", "name"]


class AgentSerializer(serializers.ModelSerializer):
    documents = UploadedDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Agent
        fields = [
            "id",
            "name",
            "model",
            "temperature",
            "max_tokens",
            "system_prompt",
            "api_key",
            "store_path",
            "documents",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "store_path", "documents", "created_at", "updated_at"]


class AgentCreateSerializer(serializers.Serializer):
    name = serializers.CharField()
    model = serializers.CharField(default="gemini-2.5-flash")
    temperature = serializers.FloatField(default=0.2)
    max_tokens = serializers.IntegerField(default=512)
    system_prompt = serializers.CharField(allow_blank=True, required=False, default="")
    api_key = serializers.CharField(write_only=True)
    document_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False, required=True
    )

    def validate_document_ids(self, value):
        request = self.context["request"]
        docs = UploadedDocument.objects.filter(id__in=value, owner=request.user)
        if docs.count() != len(set(value)):
            raise serializers.ValidationError("One or more documents do not belong to you.")
        return value


class AgentUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)
    model = serializers.CharField(required=False)
    temperature = serializers.FloatField(required=False)
    max_tokens = serializers.IntegerField(required=False)
    system_prompt = serializers.CharField(required=False, allow_blank=True)
    api_key = serializers.CharField(required=False, allow_blank=False)
    document_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=True, required=False
    )

    def validate_document_ids(self, value):
        request = self.context["request"]
        docs = UploadedDocument.objects.filter(id__in=value, owner=request.user)
        if docs.count() != len(set(value)):
            raise serializers.ValidationError("One or more documents do not belong to you.")
        return value

    def validate_api_key(self, value):
        if value is not None and value.strip() == "":
            raise serializers.ValidationError("API key cannot be blank.")
        return value


class ChatRequestSerializer(serializers.Serializer):
    agent_id = serializers.UUIDField()
    message = serializers.CharField()
    api_key = serializers.CharField(required=False, allow_blank=False)
