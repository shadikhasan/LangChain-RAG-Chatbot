import React, { useState } from "react";
import { register } from "../lib/api";
import { extractError } from "../lib/errors";

type Props = {
  onAuthenticated: (token: string) => Promise<void>;
  onSwitch: () => void;
};

const RegisterPage: React.FC<Props> = ({ onAuthenticated, onSwitch }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await register(username, password, email || undefined);
      await onAuthenticated(res.access);
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
            Create your account.<br />
            <span className="text-accent">Start building agents.</span>
          </h1>
          <p className="text-sm text-slate-600">
            Upload files, pick an LLM, and steer your agent with system prompts. Answers stay tied to your knowledge base.
          </p>
          <div className="flex gap-2">
            <span className="chip">Multi-provider</span>
            <span className="chip">BYO Keys</span>
            <span className="chip">FAISS retrieval</span>
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <div>
            <h3 className="text-xl font-semibold">Register</h3>
            <p className="text-sm text-slate-600">Create an account to start building agents.</p>
          </div>
          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="input"
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <button className="btn-primary w-full" onClick={handleRegister} disabled={loading}>
            {loading ? "Please wait..." : "Register & Login"}
          </button>
          <button onClick={onSwitch} className="btn-ghost w-full">
            Have an account? Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
