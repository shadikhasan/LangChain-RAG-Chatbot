# admin.py
from django.contrib import admin

from .models import Agent, UploadedDocument


@admin.register(UploadedDocument)
class UploadedDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "created_at")
    list_filter = ("created_at", "owner")
    search_fields = ("name", "owner__username", "owner__email")
    readonly_fields = ("created_at",)


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "model", "temperature", "max_tokens", "created_at", "updated_at")
    list_filter = ("model", "owner", "created_at")
    search_fields = ("name", "owner__username", "owner__email", "model")
    readonly_fields = ("id", "created_at", "updated_at")
    filter_horizontal = ("documents",)  # nice UI for ManyToMany
