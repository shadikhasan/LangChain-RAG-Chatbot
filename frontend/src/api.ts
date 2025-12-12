import axios from "axios";
import { AgentSettings, ModelOption, UploadedDocument } from "./types";

const client = axios.create({
  baseURL: "/api",
});

export async function fetchModels(): Promise<ModelOption[]> {
  const res = await client.get("/models");
  return res.data;
}

export async function uploadFile(file: File): Promise<UploadedDocument> {
  const form = new FormData();
  form.append("file", file);
  const res = await client.post("/upload/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function createAgent(config: {
  model: string;
  apiKey: string;
  documentIds: number[];
} & AgentSettings) {
  const payload = {
    model: config.model,
    api_key: config.apiKey,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    system_prompt: config.systemPrompt,
    document_ids: config.documentIds,
  };
  const res = await client.post("/create-agent", payload);
  return res.data as { session_id: string; vectorstore: string };
}

export async function sendChat(config: {
  sessionId?: string;
  message: string;
  model: string;
  apiKey: string;
  documentIds?: number[];
} & AgentSettings) {
  const payload = {
    session_id: config.sessionId,
    message: config.message,
    model: config.model,
    api_key: config.apiKey,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    system_prompt: config.systemPrompt,
    document_ids: config.documentIds || [],
  };
  const res = await client.post("/chat", payload);
  return res.data as { answer: string; session_id?: string; vectorstore?: string };
}
