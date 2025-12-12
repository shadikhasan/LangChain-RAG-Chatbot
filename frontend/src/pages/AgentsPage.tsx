import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AgentCard from "../components/AgentCard";
import AgentEditModal from "../components/AgentEditModal";
import {
  fetchAgents,
  fetchDocuments,
  fetchModels,
  updateAgent,
  deleteAgent,
  rebuildAgent,
  resetAgentKb,
} from "../lib/api";
import { extractError } from "../lib/errors";
import { Agent, AgentSettings as AgentSettingsType, ModelOption, UploadedDocument } from "../types";

const defaultSettings: AgentSettingsType = {
  temperature: 0.2,
  maxTokens: 512,
  systemPrompt: "You are a helpful assistant that cites the provided files.",
};

const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [editName, setEditName] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
  const [editDocIds, setEditDocIds] = useState<number[]>([]);
  const [editSettings, setEditSettings] = useState<AgentSettingsType>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Agent | null>(null);
  const [rebuilding, setRebuilding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [rebuildStatus, setRebuildStatus] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [agentList, docs, modelList] = await Promise.all([fetchAgents(), fetchDocuments(), fetchModels()]);
        setAgents(agentList);
        setDocuments(docs);
        setModels(modelList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(
    () => agents.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())),
    [agents, search]
  );

  const openEdit = (agent: Agent) => {
    setCurrentAgent(agent);
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
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!currentAgent) return;
    setSaving(true);
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
      setShowEdit(false);
    } catch (err: any) {
      setEditError(extractError(err, "Failed to update agent"));
    } finally {
      setSaving(false);
    }
  };

  const rebuildKb = async () => {
    if (!currentAgent) return;
    setRebuilding(true);
    setEditError("");
    setRebuildStatus("");
    try {
      const updated = await rebuildAgent(currentAgent.id);
      setAgents((prev) => [updated, ...prev.filter((a) => a.id !== updated.id)]);
      setCurrentAgent(updated);
      setRebuildStatus("Knowledge base rebuilt successfully.");
    } catch (err: any) {
      setEditError(extractError(err, "Failed to rebuild knowledge base"));
    } finally {
      setRebuilding(false);
    }
  };

  const resetKb = async () => {
    if (!currentAgent) return;
    setResetting(true);
    setEditError("");
    setRebuildStatus("");
    try {
      const updated = await resetAgentKb(currentAgent.id);
      setAgents((prev) => [updated, ...prev.filter((a) => a.id !== updated.id)]);
      setCurrentAgent(updated);
      setEditDocIds([]);
      setRebuildStatus("Knowledge base reset. No documents linked.");
    } catch (err: any) {
      setEditError(extractError(err, "Failed to reset knowledge base"));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <div className="card p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Agents</p>
            <h1 className="text-2xl font-semibold text-slate-900">Manage your agents</h1>
            <p className="text-sm text-slate-600">View and update your existing agents. CRUD actions will expand here.</p>
          </div>
        </div>
        <input
          className="input"
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="card p-6 text-sm text-slate-600">Loading agents...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-6 text-sm text-slate-600">
          No agents found. <button className="btn-ghost ml-2" onClick={() => navigate("/create-agent")}>Create one</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onChat={() => navigate("/workspace")}
              onEdit={openEdit}
              onDelete={(a) => {
                setPendingDelete(a);
                setShowDelete(true);
              }}
            />
          ))}
        </div>
      )}

      <AgentEditModal
        open={showEdit}
        agent={currentAgent}
        documents={documents}
        models={models}
        editName={editName}
        editModel={editModel}
        editApiKey={editApiKey}
        editDocIds={editDocIds}
        editSettings={editSettings}
        saving={saving}
        rebuilding={rebuilding}
        resetting={resetting}
        error={editError}
        status={rebuildStatus}
        onClose={() => setShowEdit(false)}
        onChangeName={setEditName}
        onChangeModel={setEditModel}
        onChangeApiKey={setEditApiKey}
        onToggleDoc={(id, checked) =>
          setEditDocIds((prev) => (checked ? [...prev, id] : prev.filter((d) => d !== id)))
        }
        onChangeSettings={(vals) => setEditSettings((prev) => ({ ...prev, ...vals }))}
        onSave={saveEdit}
        onRebuild={rebuildKb}
        onReset={resetKb}
        onFileAdded={(doc) => setDocuments((prev) => [...prev, doc])}
        onFileDeleted={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
        onRefreshFiles={async () => {
          const docs = await fetchDocuments();
          setDocuments(docs);
        }}
      />

      {showDelete && pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="card w-full max-w-md space-y-4 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Delete agent</h3>
            <p className="text-sm text-slate-700">
              Are you sure you want to delete <span className="font-semibold">{pendingDelete.name}</span>? This
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="btn-ghost"
                onClick={() => {
                  setShowDelete(false);
                  setPendingDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary bg-rose-600 hover:bg-rose-700"
                onClick={async () => {
                  if (!pendingDelete) return;
                  try {
                    await deleteAgent(pendingDelete.id);
                    setAgents((prev) => prev.filter((p) => p.id !== pendingDelete.id));
                    if (currentAgent?.id === pendingDelete.id) {
                      setCurrentAgent(null);
                      setShowEdit(false);
                    }
                  } catch (err) {
                    console.error(err);
                    setEditError("Failed to delete agent");
                  } finally {
                    setShowDelete(false);
                    setPendingDelete(null);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentsPage;
