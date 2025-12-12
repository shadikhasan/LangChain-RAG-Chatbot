import React, { useState } from "react";
import { login } from "../lib/api";
import { extractError } from "../lib/errors";

type Props = {
  onAuthenticated: (tokens: { access: string; refresh?: string }) => Promise<void>;
  onSwitch: () => void;
};

const LoginPage: React.FC<Props> = ({ onAuthenticated, onSwitch }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await login(username, password);
      await onAuthenticated({ access: res.access, refresh: res.refresh });
    } catch (err: any) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 lg:grid lg:grid-cols-2">
        <div className="card p-8 space-y-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">RAG Workbench</p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Welcome back.<br />
            <span className="text-accent">Sign in to continue.</span>
          </h1>
          <p className="text-sm text-slate-600">
            Create and reuse agents with isolated knowledge bases. Upload files, pick an LLM, and start chatting securely.
          </p>
          <div className="flex gap-2">
            <span className="chip">Multi-provider</span>
            <span className="chip">BYO Keys</span>
            <span className="chip">FAISS retrieval</span>
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <div>
            <h3 className="text-xl font-semibold">Login</h3>
            <p className="text-sm text-slate-600">Sign in with your credentials to manage agents.</p>
          </div>
          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <button className="btn-primary w-full" onClick={handleLogin} disabled={loading}>
            {loading ? "Please wait..." : "Login"}
          </button>
          <button onClick={onSwitch} className="btn-ghost w-full">
            Need an account? Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
