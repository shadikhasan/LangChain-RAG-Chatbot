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
    <div className="panel stack">
      <h3>Model</h3>
      <p className="subtle">Choose your provider and paste the corresponding API key.</p>
      <select value={selected} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select a model</option>
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      <input
        type="password"
        placeholder="API Key"
        value={apiKey}
        onChange={(e) => onApiKey(e.target.value)}
      />
      <small>Provide the API key for the chosen provider.</small>
    </div>
  );
};

export default ModelSelector;
