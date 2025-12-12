import React from "react";
import { Agent, AgentSettings as AgentSettingsType, ModelOption, UploadedDocument } from "../types";
import ModelSelector from "./ModelSelector";
import AgentSettings from "./AgentSettings";
import FileUploader from "./FileUploader";

type Props = {
  open: boolean;
  agent: Agent | null;
  documents: UploadedDocument[];
  models: ModelOption[];
  editName: string;
  editModel: string;
  editApiKey: string;
  editDocIds: number[];
  editSettings: AgentSettingsType;
  saving: boolean;
  error: string;
  onClose: () => void;
  onChangeName: (val: string) => void;
  onChangeModel: (val: string) => void;
  onChangeApiKey: (val: string) => void;
  onToggleDoc: (id: number, checked: boolean) => void;
  onChangeSettings: (vals: Partial<AgentSettingsType>) => void;
  onSave: () => void;
  onFileAdded: (doc: UploadedDocument) => void;
  onFileDeleted: (id: number) => void;
  onRefreshFiles: () => Promise<void>;
};

const AgentEditModal: React.FC<Props> = ({
  open,
  agent,
  documents,
  models,
  editName,
  editModel,
  editApiKey,
  editDocIds,
  editSettings,
  saving,
  error,
  onClose,
  onChangeName,
  onChangeModel,
  onChangeApiKey,
  onToggleDoc,
  onChangeSettings,
  onSave,
  onFileAdded,
  onFileDeleted,
  onRefreshFiles,
}) => {
  if (!open || !agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-6">
      <div className="w-full max-w-3xl">
        <div className="card w-full max-h-[90vh] overflow-y-auto p-5 md:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Edit Agent</p>
              <h3 className="text-xl font-semibold">Update model, API key, prompt, and docs</h3>
            </div>
            <button className="btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-700">
              Agent name
              <input className="input" value={editName} onChange={(e) => onChangeName(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              API Key
              <input
                className="input"
                type="password"
                value={editApiKey}
                onChange={(e) => onChangeApiKey(e.target.value)}
              />
            </label>
          </div>

          <ModelSelector
            models={models}
            selected={editModel}
            apiKey={editApiKey}
            onChange={onChangeModel}
            onApiKey={onChangeApiKey}
          />

          <AgentSettings
            temperature={editSettings.temperature}
            maxTokens={editSettings.maxTokens}
            systemPrompt={editSettings.systemPrompt}
            onChange={onChangeSettings}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <div className="card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">Documents</h4>
                <span className="pill-muted">{editDocIds.length} selected</span>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-2">
                {documents.length === 0 ? (
                  <p className="text-sm text-slate-500">No documents uploaded yet.</p>
                ) : (
                  documents.map((doc) => (
                    <label key={doc.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={editDocIds.includes(doc.id)}
                        onChange={(e) => onToggleDoc(doc.id, e.target.checked)}
                      />
                      <span>{doc.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">Manage knowledge base</h4>
                <span className="pill-muted">{documents.length} total</span>
              </div>
              <FileUploader
                documents={documents}
                onUploaded={(doc) => {
                  onFileAdded(doc);
                  onToggleDoc(doc.id, true);
                }}
                onRefresh={onRefreshFiles}
                onDeleted={(id) => {
                  onFileDeleted(id);
                  onToggleDoc(id, false);
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:justify-end">
            <button className="btn-ghost md:min-w-[120px]" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary md:min-w-[140px]" disabled={saving} onClick={onSave}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
          {error && <div className="text-sm text-rose-600">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default AgentEditModal;
