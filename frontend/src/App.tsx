import React, { useEffect, useState } from "react";
import AgentSettings from "./components/AgentSettings";
import ChatWindow from "./components/ChatWindow";
import FileUploader from "./components/FileUploader";
import ModelSelector from "./components/ModelSelector";
import { createAgent, fetchModels, sendChat } from "./api";
import { AgentSettings as AgentSettingsType, ModelOption, UploadedDocument } from "./types";

const App: React.FC = () => {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [agentStatus, setAgentStatus] = useState("");
  const [agentError, setAgentError] = useState("");
  const [agentSettings, setAgentSettings] = useState<AgentSettingsType>({
    temperature: 0.2,
    maxTokens: 512,
    systemPrompt: "You are a helpful assistant that cites the provided files.",
  });

  useEffect(() => {
    fetchModels().then(setModels).catch(console.error);
  }, []);

  const invalidateSession = () => {
    setSessionId(undefined);
    setAgentStatus("");
    setAgentError("");
  };

  const handleCreateAgent = async () => {
    setAgentError("");
    if (!selectedModel || !apiKey || documents.length === 0) {
      setAgentError("Select a model, provide an API key, and upload at least one document first.");
      return;
    }

    setCreatingAgent(true);
    try {
      const docIds = documents.map((d) => d.id);
      const agent = await createAgent({
        model: selectedModel,
        apiKey,
        documentIds: docIds,
        ...agentSettings,
      });
      setSessionId(agent.session_id);
      setAgentStatus("Agent created. You can start chatting.");
    } catch (err: any) {
      setAgentError(err?.response?.data?.detail || "Failed to create agent.");
    } finally {
      setCreatingAgent(false);
    }
  };

  const handleSend = async (message: string) => {
    if (!selectedModel || !apiKey || documents.length === 0) {
      throw new Error("Select a model, add API key, and upload documents first.");
    }
    if (!sessionId) {
      throw new Error("Create the agent first.");
    }
    const res = await sendChat({
      sessionId,
      message,
      model: selectedModel,
      apiKey,
      documentIds: documents.map((d) => d.id),
      ...agentSettings,
    });
    return res.answer;
  };

  return (
    <div className="page">
      <header className="panel hero">
        <div>
          <p className="eyebrow">RAG Workbench</p>
          <h1>
            Build a grounded chatbot <span className="accent">without glue code</span>.
          </h1>
          <p className="subtle">
            Pick any LLM, drop in your docs, and steer the agent with a system prompt. Answers stay
            tied to your knowledge base.
          </p>
          <div className="chip-row">
            <span className="chip">Multi-provider models</span>
            <span className="chip">BYO API keys</span>
            <span className="chip">FAISS retrieval</span>
          </div>
        </div>
      </header>

      <div className="app-shell">
        <div className="stack">
          <ModelSelector
            models={models}
            selected={selectedModel}
            apiKey={apiKey}
            onChange={(model) => {
              setSelectedModel(model);
              invalidateSession();
            }}
            onApiKey={(key) => {
              setApiKey(key);
              invalidateSession(); // reset session on key change
            }}
          />
          <FileUploader
            documents={documents}
            onUploaded={(doc) => {
              setDocuments((prev) => [...prev, doc]);
              invalidateSession();
            }}
          />
          <AgentSettings
            temperature={agentSettings.temperature}
            maxTokens={agentSettings.maxTokens}
            systemPrompt={agentSettings.systemPrompt}
            onChange={(vals) => {
              setAgentSettings((prev) => ({ ...prev, ...vals }));
              invalidateSession();
            }}
          />
        </div>
        <ChatWindow
          onSend={handleSend}
          modelLabel={models.find((m) => m.id === selectedModel)?.label}
          docCount={documents.length}
          systemPrompt={agentSettings.systemPrompt}
          temperature={agentSettings.temperature}
          onCreateAgent={handleCreateAgent}
          agentReady={!!sessionId}
          creatingAgent={creatingAgent}
          agentStatus={agentStatus}
          agentError={agentError}
        />
      </div>
    </div>
  );
};

export default App;
