import React from "react";

type Props = {
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  onChange: (values: { temperature?: number; maxTokens?: number; systemPrompt?: string }) => void;
};

const AgentSettings: React.FC<Props> = ({ temperature, maxTokens, systemPrompt, onChange }) => {
  return (
    <div className="panel stack">
      <h3>Agent Settings</h3>
      <p className="subtle">Steer the assistant’s tone and verbosity.</p>
      <label>
        Temperature
        <input
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={temperature}
          onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
        />
      </label>
      <label>
        Max Tokens
        <input
          type="number"
          min={64}
          max={4096}
          step={64}
          value={maxTokens}
          onChange={(e) => onChange({ maxTokens: parseInt(e.target.value, 10) })}
        />
      </label>
      <label>
        System Prompt
        <textarea
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
