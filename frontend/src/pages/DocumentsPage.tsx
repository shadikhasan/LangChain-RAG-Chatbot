import React from "react";
import { useNavigate } from "react-router-dom";

const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <div className="card p-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Documents</p>
        <h1 className="text-2xl font-semibold text-slate-900">Documents page coming soon</h1>
        <p className="text-sm text-slate-600">We’ll add document management here. For now, attach docs in Create Agent.</p>
        <button className="btn-primary w-fit" onClick={() => navigate("/create-agent")}>
          Go to Create Agent
        </button>
      </div>
    </div>
  );
};

export default DocumentsPage;
