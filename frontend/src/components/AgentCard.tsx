import React from "react";
import { Agent } from "../types";

type Props = {
  agent: Agent;
  onChat: (agent: Agent) => void;
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
};

const AgentCard: React.FC<Props> = ({ agent, onChat, onEdit, onDelete }) => {
  const updated = new Date(agent.updated_at || agent.created_at);
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Agent</p>
          <h3 className="text-lg font-semibold text-slate-900">{agent.name}</h3>
          <p className="text-sm text-slate-600">{agent.model}</p>
        </div>
        <div className="flex gap-1">
          <button className="btn-ghost text-xs" onClick={() => onEdit(agent)}>
            Edit
          </button>
          <button className="btn-ghost text-xs text-rose-600" onClick={() => onDelete(agent)}>
            Delete
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-600">
        <span className="pill-muted">{agent.documents.length} docs</span>
        <span>Updated {updated.toLocaleDateString()}</span>
      </div>
      <div className="flex gap-2">
        <button className="btn-primary flex-1" onClick={() => onChat(agent)}>
          Chat
        </button>
      </div>
    </div>
  );
};

export default AgentCard;
