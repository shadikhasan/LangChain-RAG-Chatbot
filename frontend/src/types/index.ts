export type ModelOption = { id: string; provider: string; label: string };

export type UploadedDocument = {
  id: number;
  name: string;
  file: string;
  created_at: string;
};

export type AgentSettings = {
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
};

export type Agent = {
  id: string;
  name: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  api_key: string;
  store_path: string;
  documents: UploadedDocument[];
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
