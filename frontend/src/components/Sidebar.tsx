import React from "react";

type NavKey = "create-agent" | "agents" | "documents";

type Props = {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
};

const Sidebar: React.FC<Props> = ({ active, onNavigate }) => {
  const item = (key: NavKey, label: string) => (
    <button
      onClick={() => onNavigate(key)}
      className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
        active === key ? "bg-accent-soft text-accent" : "text-slate-700 hover:text-accent"
      }`}
    >
      {label}
    </button>
  );

  return (
    <aside className="w-full max-w-xs border-r border-slate-200 bg-white/70 backdrop-blur">
      <div className="flex flex-col gap-2 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Navigation</p>
        {item("create-agent", "Create Agent")}
        {item("agents", "Agents")}
        {item("documents", "Documents")}
      </div>
    </aside>
  );
};

export default Sidebar;
