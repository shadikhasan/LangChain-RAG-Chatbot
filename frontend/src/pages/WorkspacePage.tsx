import React, { useEffect, useMemo, useState } from "react";
import AgentSettings from "../components/AgentSettings";
import ChatWindow from "../components/ChatWindow";
import FileUploader from "../components/FileUploader";
import ModelSelector from "../components/ModelSelector";
import AgentEditModal from "../components/AgentEditModal";
import {
  createAgent,
  fetchAgents,
  fetchDocuments,
  fetchModels,
  fetchMe,
  sendChat,
  updateAgent,
} from "../lib/api";
import { extractError } from "../lib/errors";
import { setAuthToken } from "../lib/http";
import { Agent, AgentSettings as AgentSettingsType, ModelOption, UploadedDocument } from "../types";

type Props = {
  token: string;
  onLogout: () => void;
};

const defaultAgentSettings: AgentSettingsType = {
  temperature: 0.2,
  maxTokens: 512,
  systemPrompt: "You are a helpful assistant that cites the provided files.",
};

const WorkspacePage: React.FC<Props> = ({ token, onLogout }) => {
  const [me, setMe] = useState<{ username: string } | null>(null);
  const [loadingBootstrap, setLoadingBootstrap] = useState(true);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);

  // builder state (independent of selected agent)
  const [agentName, setAgentName] = useState("My Agent");
  const [selectedModel, setSelectedModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [agentSettings, setAgentSettings] = useState<AgentSettingsType>(defaultAgentSettings);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [agentStatus, setAgentStatus] = useState("");
  const [agentError, setAgentError] = useState("");

  // view + edit modal
  const [viewMode, setViewMode] = useState<"build" | "chat">("build");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
  const [editDocIds, setEditDocIds] = useState<number[]>([]);
  const [editSettings, setEditSettings] = useState<AgentSettingsType>(defaultAgentSettings);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    setAuthToken(token);
    const bootstrap = async () => {
      try {
        const [profile, modelList, docs, agentList] = await Promise.all([
          fetchMe(),
          fetchModels(),
          fetchDocuments(),
          fetchAgents(),
        ]);
        setMe(profile);
        setModels(modelList);
        setDocuments(docs);
        setAgents(agentList);
        setSelectedDocIds(docs.map((d) => d.id));
        setCurrentAgent(agentList[0] || null);
      } catch (err) {
        console.error(err);
        onLogout();
      } finally {
        setLoadingBootstrap(false);
      }
    };
    bootstrap();
  }, [token, onLogout]);

  const switchView = (mode: "build" | "chat") => {
    if (mode === "chat" && !currentAgent) return;
    setViewMode(mode);
  };

  const handleCreateAgent = async () => {
    setAgentError("");
    setAgentStatus("");
    if (!selectedModel || !apiKey || selectedDocIds.length === 0) {
      setAgentError("Pick a model, add API key, and select at least one document first.");
      return;
    }
    setCreatingAgent(true);
    try {
      const agent = await createAgent({
        name: agentName || "My Agent",
        model: selectedModel,
        apiKey,
        temperature: agentSettings.temperature,
        maxTokens: agentSettings.maxTokens,
        systemPrompt: agentSettings.systemPrompt,
        documentIds: selectedDocIds,
      });
      setAgents((prev) => [agent, ...prev.filter((a) => a.id !== agent.id)]);
      setCurrentAgent(agent);
      setAgentStatus("Agent created. Switch to chat and start talking.");
      setViewMode("chat");
    } catch (err: any) {
      setAgentError(extractError(err, "Failed to create agent"));
    } finally {
      setCreatingAgent(false);
    }
  };

  const handleSend = async (message: string) => {
    if (!currentAgent) throw new Error("Create/select an agent first.");
    const res = await sendChat(currentAgent.id, message);
    return res.answer;
  };

  const handleSelectAgent = (agent: Agent) => {
    if (currentAgent?.id === agent.id) {
      setCurrentAgent(null);
      setViewMode("build");
      setAgentStatus("");
      return;
    }
    setCurrentAgent(agent);
    setAgentStatus("");
    setViewMode("chat");
  };

  const builderDocOptions = useMemo(
    () =>
      documents.map((doc) => ({
        ...doc,
        checked: selectedDocIds.includes(doc.id),
      })),
    [documents, selectedDocIds]
  );

  const openEditModal = (agent: Agent) => {
    setEditName(agent.name);
    setEditModel(agent.model);
    setEditApiKey(agent.api_key || "");
    setEditDocIds(agent.documents.map((d) => d.id));
    setEditSettings({
      temperature: agent.temperature,
      maxTokens: agent.max_tokens,
      systemPrompt: agent.system_prompt,
    });
    setEditError("");
    setShowEditModal(true);
  };

  const saveAgentEdits = async () => {
    if (!currentAgent) return;
    setSavingEdit(true);
    setEditError("");
    try {
      const updated = await updateAgent(currentAgent.id, {
        name: editName,
        model: editModel,
        apiKey: editApiKey,
        temperature: editSettings.temperature,
        maxTokens: editSettings.maxTokens,
        systemPrompt: editSettings.systemPrompt,
        documentIds: editDocIds,
      });
      setAgents((prev) => [updated, ...prev.filter((a) => a.id !== updated.id)]);
      setCurrentAgent(updated);
      setAgentStatus("Agent updated.");
      setShowEditModal(false);
    } catch (err: any) {
      setEditError(extractError(err, "Update failed"));
    } finally {
      setSavingEdit(false);
    }
  };

  if (loadingBootstrap) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="card px-6 py-4 text-sm text-slate-700">Loading workspace...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
          <header className="card bg-white/70 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">RAG Workbench</p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Build a grounded chatbot <span className="text-accent">without glue code</span>.
            </h1>
            <p className="text-sm text-slate-600">
              Pick any LLM, drop in your docs, and steer the agent with a system prompt. Answers stay tied to your knowledge base.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip">Multi-provider models</span>
              <span className="chip">BYO API keys</span>
              <span className="chip">FAISS retrieval</span>
            </div>
          </header>

          <div className="card p-4 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900">Workspace</h3>
              <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white">
                <button
                  className={`px-4 py-2 text-sm font-semibold transition ${
                    viewMode === "build" ? "bg-accent-soft text-accent" : "text-slate-700 hover:text-accent"
                  }`}
                  onClick={() => switchView("build")}
                >
                  Build
                </button>
                <button
                  className={`px-4 py-2 text-sm font-semibold transition ${
                    viewMode === "chat"
                      ? "bg-accent-soft text-accent"
                      : "text-slate-700 hover:text-accent disabled:text-slate-400"
                  }`}
                  onClick={() => switchView("chat")}
                  disabled={!currentAgent}
                  title={!currentAgent ? "Create an agent first" : ""}
                >
                  Chat
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              {viewMode === "build"
                ? "Upload docs and create an agent. When ready, switch to Chat."
                : "Chat with the selected agent. Switch back to Build to update or create new agents."}
            </p>
          </div>

          {viewMode === "build" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Account</p>
                    <p className="text-sm text-slate-700">Signed in as {me?.username || "you"}</p>
                  </div>
                  <button className="btn-ghost" onClick={onLogout}>
                    Logout
                  </button>
                </div>

                <div className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Agent Builder</h3>
                    <span className="pill-muted">Step 1 of 2</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Name your agent, pick a model, add API key, and set temperature/max tokens.
                  </p>
                  <label className="space-y-1 text-sm text-slate-600 w-full">
                    Agent name
                    <input
                      className="input"
                      placeholder="e.g., Contracts QA Agent"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                    />
                  </label>
                  <ModelSelector
                    models={models}
                    selected={selectedModel}
                    apiKey={apiKey}
                    onChange={setSelectedModel}
                    onApiKey={setApiKey}
                  />
                  <div className="card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-800">Select documents</h4>
                      <span className="pill-muted">{selectedDocIds.length} selected</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {builderDocOptions.length === 0 ? (
                        <p className="text-sm text-slate-500">Upload documents on the right.</p>
                      ) : (
                        builderDocOptions.map((doc) => (
                          <label key={doc.id} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={doc.checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDocIds((prev) => [...prev, doc.id]);
                                } else {
                                  setSelectedDocIds((prev) => prev.filter((id) => id !== doc.id));
                                }
                              }}
                            />
                            <span>{doc.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  <AgentSettings
                    temperature={agentSettings.temperature}
                    maxTokens={agentSettings.maxTokens}
                    systemPrompt={agentSettings.systemPrompt}
                    onChange={(vals) => setAgentSettings((prev) => ({ ...prev, ...vals }))}
                  />
                  <div className="card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold">Review & Create</h3>
                        <p className="text-sm text-slate-600">Ensure API key, model, and at least one document are set.</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`h-2.5 w-2.5 rounded-full ${apiKey ? "bg-accent" : "bg-slate-300"}`} />
                        <span className={`h-2.5 w-2.5 rounded-full ${selectedModel ? "bg-accent" : "bg-slate-300"}`} />
                        <span className={`h-2.5 w-2.5 rounded-full ${selectedDocIds.length ? "bg-accent" : "bg-slate-300"}`} />
                      </div>
                    </div>
                    <button
                      className="btn-primary w-full"
                      onClick={handleCreateAgent}
                      disabled={creatingAgent || selectedDocIds.length === 0}
                    >
                      {creatingAgent ? "Creating agent..." : "Create Agent"}
                    </button>
                    {agentError && <div className="text-sm text-rose-600">{agentError}</div>}
                    {agentStatus && <div className="text-sm text-emerald-700">{agentStatus}</div>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <FileUploader
                  documents={documents}
                  onUploaded={(doc) => {
                    setDocuments((prev) => [...prev, doc]);
                    setSelectedDocIds((prev) => [...prev, doc.id]);
                  }}
                  onRefresh={async () => {
                    const docs = await fetchDocuments();
                    setDocuments(docs);
                  }}
                  onDeleted={(id) => {
                    setDocuments((prev) => prev.filter((d) => d.id !== id));
                    setSelectedDocIds((prev) => prev.filter((docId) => docId !== id));
                  }}
                />
                <div className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Agents</h3>
                    <span className="pill-muted">{agents.length} total</span>
                  </div>
                  <p className="text-sm text-slate-600">Select an agent to chat or edit.</p>
                  {agents.length === 0 ? (
                    <p className="text-sm text-slate-500">No agents yet. Upload docs and click “Create Agent”.</p>
                  ) : (
                    <div className="space-y-2">
                      {agents.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => handleSelectAgent(agent)}
                          className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                            currentAgent?.id === agent.id
                              ? "border-accent bg-accent-soft text-accent"
                              : "border-slate-200 bg-white hover:border-accent hover:text-accent"
                          }`}
                        >
                          <div className="font-semibold">{agent.name}</div>
                          <div className="text-xs text-slate-600">{agent.model}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {currentAgent && (
                  <div className="card p-4 space-y-2">
                    <h3 className="text-lg font-semibold">Current Agent</h3>
                    <p className="text-sm text-slate-700">
                      {currentAgent.name} · {currentAgent.model}
                    </p>
                    <p className="text-sm text-slate-600">
                      Temp {currentAgent.temperature} · Max tokens {currentAgent.max_tokens}
                    </p>
                    <p className="text-sm text-slate-600">{currentAgent.documents.length} linked docs</p>
                    <button className="btn-primary w-full" onClick={() => openEditModal(currentAgent)}>
                      Edit Agent
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {viewMode === "chat" && (
            <ChatWindow
              onSend={handleSend}
              modelLabel={
                currentAgent
                  ? models.find((m) => m.id === currentAgent.model)?.label || currentAgent.model
                  : ""
              }
              docCount={currentAgent ? currentAgent.documents.length : 0}
              systemPrompt={currentAgent ? currentAgent.system_prompt : agentSettings.systemPrompt}
              temperature={currentAgent ? currentAgent.temperature : agentSettings.temperature}
              onCreateAgent={handleCreateAgent}
              agentReady={!!currentAgent}
              creatingAgent={creatingAgent}
              agentStatus={agentStatus}
              agentError={!currentAgent ? "Create an agent first." : agentError}
            />
          )}
        </div>
      </div>

      <AgentEditModal
        open={showEditModal}
        agent={currentAgent}
        documents={documents}
        models={models}
        editName={editName}
        editModel={editModel}
        editApiKey={editApiKey}
        editDocIds={editDocIds}
        editSettings={editSettings}
        saving={savingEdit}
        error={editError}
        onClose={() => setShowEditModal(false)}
        onChangeName={setEditName}
        onChangeModel={setEditModel}
        onChangeApiKey={setEditApiKey}
        onToggleDoc={(id, checked) => {
          setEditDocIds((prev) => (checked ? [...prev, id] : prev.filter((d) => d !== id)));
        }}
        onChangeSettings={(vals) => setEditSettings((prev) => ({ ...prev, ...vals }))}
        onSave={saveAgentEdits}
        onFileAdded={(doc) => setDocuments((prev) => [...prev, doc])}
        onFileDeleted={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
        onRefreshFiles={async () => {
          const docs = await fetchDocuments();
          setDocuments(docs);
        }}
      />
    </>
  );
};

export default WorkspacePage;
