import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModelSelector from "../components/ModelSelector";
import AgentSettings from "../components/AgentSettings";
import FileUploader from "../components/FileUploader";
import Stepper from "../components/Stepper";
import { createAgent, fetchDocuments, fetchModels } from "../lib/api";
import { extractError } from "../lib/errors";
import { AgentSettings as AgentSettingsType, ModelOption, UploadedDocument } from "../types";

const defaultSettings: AgentSettingsType = {
  temperature: 0.2,
  maxTokens: 512,
  systemPrompt: "You are a helpful assistant that cites the provided files.",
};

const providers = ["all", "google", "openai", "anthropic", "groq", "local"] as const;

const CreateAgentPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("My Agent");
  const [providerFilter, setProviderFilter] = useState<(typeof providers)[number]>("all");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saveKey, setSaveKey] = useState(true);
  const [settings, setSettings] = useState<AgentSettingsType>(defaultSettings);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [docSearch, setDocSearch] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoadingModels(true);
      setLoadingDocs(true);
      try {
        const [modelList, docs] = await Promise.all([fetchModels(), fetchDocuments()]);
        setModels(modelList);
        setDocuments(docs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingModels(false);
        setLoadingDocs(false);
      }
    };
    load();
  }, []);

  const filteredModels = useMemo(() => {
    if (providerFilter === "all") return models;
    return models.filter((m) => m.provider.toLowerCase() === providerFilter);
  }, [models, providerFilter]);

  const filteredDocs = useMemo(() => {
    const term = docSearch.toLowerCase();
    return documents.filter((d) => d.name.toLowerCase().includes(term));
  }, [documents, docSearch]);

  const canNext = name.trim().length > 0 && !!model && !!apiKey;
  const canCreate = selectedDocIds.length > 0 && canNext;

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    setError("");
    setStatus("");
    try {
      await createAgent({
        name,
        model,
        apiKey,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        systemPrompt: settings.systemPrompt,
        documentIds: selectedDocIds,
      });
      setStatus("Agent created successfully.");
    } catch (err: any) {
      setError(extractError(err, "Failed to create agent"));
    } finally {
      setCreating(false);
    }
  };

  const reset = () => {
    setStep(1);
    setName("My Agent");
    setModel("");
    setApiKey("");
    setSaveKey(true);
    setSettings(defaultSettings);
    setSelectedDocIds([]);
    setStatus("");
    setError("");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <div className="card p-5 space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Create a new agent</p>
        <h1 className="text-2xl font-semibold text-slate-900">Build an agent in 2 steps.</h1>
        <Stepper step={step} labels={["Model & Key", "Knowledge Base"]} />
      </div>

      {status && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {status}
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => navigate("/workspace")}>
              Go to Chat
            </button>
            <button className="btn-ghost" onClick={reset}>
              Create another agent
            </button>
            <button className="btn-ghost" onClick={() => navigate("/agents")}>
              Go to Agents
            </button>
          </div>
        </div>
      )}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {step === 1 && (
        <div className="card p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Model & API Key</h3>
              <p className="text-sm text-slate-600">Name your agent, pick a provider/model, add an API key.</p>
            </div>
            <span className="pill-muted">Step 1 of 2</span>
          </div>

          <label className="space-y-1 text-sm text-slate-700">
            Agent name
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">Provider</p>
            <div className="flex flex-wrap gap-2">
              {providers.map((prov) => (
                <button
                  key={prov}
                  className={`btn-ghost text-sm ${providerFilter === prov ? "border-accent text-accent" : ""}`}
                  onClick={() => setProviderFilter(prov)}
                >
                  {prov === "all" ? "All" : prov.charAt(0).toUpperCase() + prov.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {loadingModels ? (
              <div className="text-sm text-slate-500">Loading models...</div>
            ) : (
              <ModelSelector models={filteredModels} selected={model} apiKey={apiKey} onChange={setModel} onApiKey={setApiKey} />
            )}
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={showKey} onChange={(e) => setShowKey(e.target.checked)} />
                Show API key
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={saveKey} onChange={(e) => setSaveKey(e.target.checked)} />
                Save key to this agent
              </label>
            </div>
            <input
              className="input"
              type={showKey ? "text" : "password"}
              placeholder="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <details className="rounded-2xl border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Advanced settings</summary>
            <div className="mt-3">
              <AgentSettings
                temperature={settings.temperature}
                maxTokens={settings.maxTokens}
                systemPrompt={settings.systemPrompt}
                onChange={(vals) => setSettings((prev) => ({ ...prev, ...vals }))}
              />
            </div>
          </details>

          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={reset}>
              Cancel
            </button>
            <button className="btn-primary" disabled={!canNext} onClick={() => setStep(2)}>
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Knowledge Base</h3>
              <p className="text-sm text-slate-600">Upload or select documents for this agent.</p>
            </div>
            <span className="pill-muted">Step 2 of 2</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <FileUploader
                documents={documents}
                onUploaded={(doc) => {
                  setDocuments((prev) => [...prev, doc]);
                  setSelectedDocIds((prev) => [...prev, doc.id]);
                }}
                onRefresh={async () => {
                  setLoadingDocs(true);
                  try {
                    const docs = await fetchDocuments();
                    setDocuments(docs);
                  } finally {
                    setLoadingDocs(false);
                  }
                }}
                onDeleted={(id) => {
                  setSelectedDocIds((prev) => prev.filter((d) => d !== id));
                }}
              />
              <div className="card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">Document Library</h4>
                  <input
                    className="input"
                    placeholder="Search docs..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-52 overflow-y-auto space-y-2">
                  {loadingDocs ? (
                    <p className="text-sm text-slate-500">Loading documents...</p>
                  ) : filteredDocs.length === 0 ? (
                    <p className="text-sm text-slate-500">No documents.</p>
                  ) : (
                    filteredDocs.map((doc) => (
                      <button
                        key={doc.id}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700"
                        onClick={() =>
                          setSelectedDocIds((prev) => (prev.includes(doc.id) ? prev : [...prev, doc.id]))
                        }
                      >
                        {doc.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">Selected for this agent</h4>
                <button className="btn-ghost text-xs" onClick={() => setSelectedDocIds([])}>
                  Clear
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {selectedDocIds.length === 0 ? (
                  <p className="text-sm text-slate-500">Select at least one document.</p>
                ) : (
                  documents
                    .filter((d) => selectedDocIds.includes(d.id))
                    .map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                      >
                        <span className="truncate">{doc.name}</span>
                        <button
                          className="btn-ghost text-xs"
                          onClick={() => setSelectedDocIds((prev) => prev.filter((d) => d !== doc.id))}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button className="btn-ghost" onClick={() => setStep(1)}>
              ← Back
            </button>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={reset}>
                Cancel
              </button>
              <button className="btn-primary" disabled={!canCreate || creating} onClick={handleCreate}>
                {creating ? "Creating..." : "Create Agent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAgentPage;
