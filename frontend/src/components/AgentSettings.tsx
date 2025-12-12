import React from "react";

type Props = {
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  onChange: (values: { temperature?: number; maxTokens?: number; systemPrompt?: string }) => void;
};

const AgentSettings: React.FC<Props> = ({ temperature, maxTokens, systemPrompt, onChange }) => {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Agent Settings</h3>
        <span className="pill-muted">Tone & length</span>
      </div>
      <label className="space-y-1 text-sm text-slate-600">
        Temperature
        <input
          className="input"
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={temperature}
          onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
        />
      </label>
      <label className="space-y-1 text-sm text-slate-600">
        Max Tokens
        <input
          className="input"
          type="number"
          min={64}
          max={4096}
          step={64}
          value={maxTokens}
          onChange={(e) => onChange({ maxTokens: parseInt(e.target.value, 10) })}
        />
      </label>
      <label className="space-y-1 text-sm text-slate-600">
        System Prompt
        <textarea
          className="input"
          rows={3}
          value={systemPrompt}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          placeholder="You are a helpful assistant..."
        />
      </label>
    </div>
  );
};

export default AgentSettings;
