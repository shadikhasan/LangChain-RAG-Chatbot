import React, { useEffect, useState } from "react";
import ChatWindow from "../components/ChatWindow";
import { fetchAgents, fetchModels, fetchMe, sendChat } from "../lib/api";
import { setAuthToken } from "../lib/http";
import { Agent, ModelOption } from "../types";

type Props = {
  token: string;
  onLogout: () => void;
};

const WorkspacePage: React.FC<Props> = ({ token, onLogout }) => {
  const [loadingBootstrap, setLoadingBootstrap] = useState(true);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);

  useEffect(() => {
    setAuthToken(token);
    const bootstrap = async () => {
      try {
        await fetchMe();
        const [modelList, agentList] = await Promise.all([fetchModels(), fetchAgents()]);
        setModels(modelList);
        setAgents(agentList);
        setCurrentAgent(agentList[0] || null);
      } catch (err) {
        console.error(err);
        onLogout();
      } finally {
        setLoadingBootstrap(false);
      }
    };
    bootstrap();
  }, [token, onLogout]);

  const handleSend = async (message: string) => {
    if (!currentAgent) {
      throw new Error("Create/select an agent first.");
    }
    const res = await sendChat(currentAgent.id, message);
    return res.answer;
  };

  if (loadingBootstrap) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="card px-6 py-4 text-sm text-slate-700">Loading workspace...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <div className="card p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Chat</p>
                <h1 className="text-3xl font-semibold text-slate-900">Chat with your agent</h1>
                <p className="text-sm text-slate-600">Select an agent and start chatting.</p>
              </div>
              <div className="flex gap-2">
                <select
                  className="input"
                  value={currentAgent?.id || ""}
                  onChange={(e) => {
                    const selected = agents.find((a) => a.id === e.target.value);
                    setCurrentAgent(selected || null);
                  }}
                >
                  <option value="">Select agent</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <ChatWindow
            onSend={handleSend}
            modelLabel={
              currentAgent ? models.find((m) => m.id === currentAgent.model)?.label || currentAgent.model : ""
            }
            docCount={currentAgent ? currentAgent.documents.length : 0}
            systemPrompt={currentAgent ? currentAgent.system_prompt : ""}
            temperature={currentAgent ? currentAgent.temperature : 0.2}
            agentReady={!!currentAgent}
            agentError={!currentAgent ? "Create/select an agent first." : ""}
          />
        </div>
      </div>
    </>
  );
};

export default WorkspacePage;
