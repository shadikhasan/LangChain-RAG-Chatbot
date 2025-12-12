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
    <div className="panel chat-window">
      <div className="chat-header">
        <div>
          <p className="eyebrow">Conversational RAG</p>
          <h3>Chat</h3>
          <p className="subtle">
            {systemPrompt || "You are a helpful assistant."} · temp {temperature.toFixed(1)} ·{" "}
            {docCount} {docCount === 1 ? "file" : "files"}
          </p>
        </div>
        <div className="badge">
          {agentReady ? "Agent ready" : "Create agent to start"}
          {modelLabel ? ` · ${modelLabel}` : ""}
        </div>
      </div>
      {!agentReady && (
        <div className="callout">
          <div>
            <div className="callout-title">No agent yet</div>
            <div className="subtle">
              Build the agent with your current model, API key, and uploaded files before chatting.
            </div>
            {agentError && <div className="callout-error">{agentError}</div>}
          </div>
          <button onClick={onCreateAgent} disabled={creatingAgent}>
            {creatingAgent ? "Creating..." : "Create Agent"}
          </button>
        </div>
      )}
      {agentReady && agentStatus && <div className="callout success">{agentStatus}</div>}
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`bubble ${msg.role === "user" ? "user" : "bot"}`}>
            <div className="bubble-meta">{msg.role === "user" ? "You" : "Assistant"}</div>
            <div>{msg.content}</div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-title">Drop in your files and start asking questions.</div>
            <div className="empty-subtitle">
              We will ground answers in your uploaded knowledge base using retrieval.
            </div>
          </div>
        )}
      </div>
      <div className="input-row">
        <input
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
        <button onClick={handleSend} disabled={loading || !agentReady}>
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
