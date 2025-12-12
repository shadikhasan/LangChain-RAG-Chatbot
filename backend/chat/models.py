import uuid

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class UploadedDocument(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="documents")
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to="uploads/")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name


class Agent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="agents")
    name = models.CharField(max_length=255)
    model = models.CharField(max_length=255, default="gemini-2.5-flash")
    temperature = models.FloatField(default=0.2)
    max_tokens = models.IntegerField(default=512)
    system_prompt = models.TextField(blank=True, default="")
    api_key = models.CharField(max_length=255, blank=True, default="")
    store_path = models.CharField(max_length=512)
    documents = models.ManyToManyField(UploadedDocument, related_name="agents", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name
