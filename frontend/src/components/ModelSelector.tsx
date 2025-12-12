import React from "react";
import { ModelOption } from "../types";

type Props = {
  models: ModelOption[];
  selected: string;
  apiKey: string;
  onChange: (model: string) => void;
  onApiKey: (key: string) => void;
};

const ModelSelector: React.FC<Props> = ({ models, selected, apiKey, onChange, onApiKey }) => {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Model</p>
          <p className="text-sm text-slate-600">Choose provider and paste its API key.</p>
        </div>
      </div>
      <select
        className="input"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select a model</option>
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      <input
        className="input"
        type="password"
        placeholder="API Key"
        value={apiKey}
        onChange={(e) => onApiKey(e.target.value)}
      />
      <p className="text-xs text-slate-500">Provide the API key for the chosen provider.</p>
    </div>
  );
};

export default ModelSelector;
