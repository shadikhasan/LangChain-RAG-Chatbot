import React, { useState } from "react";
import { ChatMessage } from "../types";

type Props = {
  onSend: (message: string) => Promise<string>;
  onCreateAgent: () => Promise<void>;
  modelLabel?: string;
  docCount: number;
  systemPrompt: string;
  temperature: number;
  agentReady: boolean;
  creatingAgent: boolean;
  agentStatus: string;
  agentError: string;
};

const ChatWindow: React.FC<Props> = ({
  onSend,
  onCreateAgent,
  modelLabel,
  docCount,
  systemPrompt,
  temperature,
  agentReady,
  creatingAgent,
  agentStatus,
  agentError,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!agentReady) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Create the agent before starting a chat." },
      ]);
      return;
    }
    const message = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    try {
      const answer = await onSend(message);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err?.response?.data?.detail || err?.message || "Error while chatting",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4 md:p-6 flex flex-col min-h-[60vh] gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Conversational RAG</p>
          <h3 className="text-xl font-semibold">Chat</h3>
          <p className="text-sm text-slate-600">
            {(systemPrompt || "You are a helpful assistant.")} · temp {temperature.toFixed(1)} ·{" "}
            {docCount} {docCount === 1 ? "file" : "files"}
          </p>
        </div>
        <div className="pill">
          {agentReady ? "Agent ready" : "Create agent to start"}
          {modelLabel ? ` · ${modelLabel}` : ""}
        </div>
      </div>

      {!agentReady && (
        <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3">
          <div className="text-sm font-semibold text-slate-800">No agent yet</div>
          <div className="text-sm text-slate-600">
            Build the agent with your current model, API key, and uploaded files before chatting.
          </div>
          {agentError && <div className="text-sm text-rose-600">{agentError}</div>}
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={onCreateAgent} disabled={creatingAgent}>
              {creatingAgent ? "Creating..." : "Create Agent"}
            </button>
          </div>
        </div>
      )}
      {agentReady && agentStatus && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {agentStatus}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 rounded-xl border border-slate-100 bg-white/70 p-3 shadow-inner">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-slate-500">
            Drop in your files and start asking questions. We’ll ground answers in your knowledge base.
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm shadow-sm ${
                msg.role === "user"
                  ? "ml-auto border-accent/30 bg-gradient-to-r from-accent-soft to-white text-slate-900"
                  : "border-slate-100 bg-white text-slate-800"
              }`}
            >
              <div className="text-[11px] uppercase tracking-wide text-accent mb-1">
                {msg.role === "user" ? "You" : "Assistant"}
              </div>
              <div className="leading-relaxed">{msg.content}</div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="input sm:flex-1"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!agentReady}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button className="btn-primary sm:w-32" onClick={handleSend} disabled={loading || !agentReady}>
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
