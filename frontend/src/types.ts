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

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
