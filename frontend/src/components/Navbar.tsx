import React from "react";

type NavKey = "create-agent" | "agents" | "documents";

type Props = {
  username?: string;
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  onLogout: () => void;
};

const Navbar: React.FC<Props> = ({ username, active, onNavigate, onLogout }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const navItem = (key: NavKey, label: string) => (
    <button
      onClick={() => onNavigate(key)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active === key
          ? "bg-accent text-white shadow-sm shadow-accent/30"
          : "text-slate-700 hover:text-accent hover:bg-accent-soft"
      }`}
    >
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-30 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3">
        <button
          onClick={() => onNavigate("create-agent")}
          className="flex items-center gap-3 text-slate-900 transition hover:text-accent"
        >
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-accent to-emerald-500 shadow-lg shadow-accent/30 ring-4 ring-accent-soft" />
          <div className="text-left">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">RAG</p>
            <p className="text-base font-semibold">Workbench</p>
          </div>
        </button>
        <div className="flex items-center gap-3 rounded-full px-3 py-1 ">
          {navItem("create-agent", "Create Agent")}
          {navItem("agents", "Agents")}
          {navItem("documents", "Documents")}
        </div>
        <div className="flex items-center gap-2 rounded-full px-3 py-2 ">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-xs font-semibold text-accent shadow-inner">
            {(username || "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="relative flex items-center gap-1">
            <button
              className="flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-slate-800 transition hover:text-accent"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span>Hi, {username || "User"}</span>
              <span className="text-slate-500">▾</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-40 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10">
                <button
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
