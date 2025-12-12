import { http } from "./http";
import { Agent, ModelOption, UploadedDocument } from "../types";

export const register = async (username: string, password: string, email?: string) => {
  const res = await http.post("/auth/register", { username, password, email });
  return res.data;
};

export const login = async (username: string, password: string) => {
  const res = await http.post("/auth/login", { username, password });
  return res.data;
};

export const fetchMe = async () => {
  const res = await http.get("/auth/me");
  return res.data;
};

export const refreshToken = async (refresh: string) => {
  const res = await http.post("/auth/refresh", { refresh });
  return res.data;
};

export const fetchModels = async (): Promise<ModelOption[]> => {
  const res = await http.get("/models");
  return res.data;
};

export const fetchDocuments = async (): Promise<UploadedDocument[]> => {
  const res = await http.get("/documents/");
  return res.data;
};

export const uploadFile = async (file: File): Promise<UploadedDocument> => {
  const form = new FormData();
  form.append("file", file);
  const res = await http.post("/documents/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteDocument = async (id: number) => {
  await http.delete(`/documents/${id}/`);
};

export const fetchAgents = async (): Promise<Agent[]> => {
  const res = await http.get("/agents/");
  return res.data;
};

export const deleteAgent = async (id: string) => {
  await http.delete(`/agents/${id}/`);
};

type CreateAgentPayload = {
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  apiKey: string;
  documentIds: number[];
};

export const createAgent = async (payload: CreateAgentPayload): Promise<Agent> => {
  const res = await http.post("/agents/", {
    name: payload.name,
    model: payload.model,
    temperature: payload.temperature,
    max_tokens: payload.maxTokens,
    system_prompt: payload.systemPrompt,
    api_key: payload.apiKey,
    document_ids: payload.documentIds,
  });
  return res.data;
};

type UpdateAgentPayload = Partial<CreateAgentPayload>;

export const updateAgent = async (id: string, payload: UpdateAgentPayload): Promise<Agent> => {
  const res = await http.patch(`/agents/${id}/`, {
    name: payload.name,
    model: payload.model,
    temperature: payload.temperature,
    max_tokens: payload.maxTokens,
    system_prompt: payload.systemPrompt,
    api_key: payload.apiKey,
    document_ids: payload.documentIds,
  });
  return res.data;
};

export const sendChat = async (agentId: string, message: string) => {
  const res = await http.post("/chat", { agent_id: agentId, message });
  return res.data;
};
