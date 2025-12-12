import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import WorkspacePage from "./pages/WorkspacePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CreateAgentPage from "./pages/CreateAgentPage";
import AgentsPage from "./pages/AgentsPage";
import DocumentsPage from "./pages/DocumentsPage";
import { setAuthToken } from "./lib/http";
import { fetchMe } from "./lib/api";
import Navbar from "./components/Navbar";

const ProtectedRoute: React.FC<{ token: string | null; children: React.ReactNode }> = ({
  token,
  children,
}) => {
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const LogoutRoute: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const navigate = useNavigate();
  useEffect(() => {
    onLogout();
    navigate("/login", { replace: true });
  }, [navigate, onLogout]);
  return null;
};

type Tokens = { access: string; refresh?: string };

const AppRoutes: React.FC<{
  token: string | null;
  onAuthenticated: (tokens: Tokens) => Promise<void>;
  onLogout: () => void;
  username?: string;
}> = ({ token, onAuthenticated, onLogout, username }) => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginPage
            onAuthenticated={async (tok) => {
              await onAuthenticated(tok);
              navigate("/create-agent", { replace: true });
            }}
            onSwitch={() => navigate("/register")}
          />
        }
      />
      <Route
        path="/register"
        element={
          <RegisterPage
            onAuthenticated={async (tok) => {
              await onAuthenticated(tok);
              navigate("/create-agent", { replace: true });
            }}
            onSwitch={() => navigate("/login")}
          />
        }
      />
      <Route path="/logout" element={<LogoutRoute onLogout={onLogout} />} />
      <Route
        path="/create-agent"
        element={
          <ProtectedRoute token={token}>
            <Shell active="create-agent" username={username} onNavigate={(key) => navigate(`/${key === "create-agent" ? "create-agent" : key}`)} onLogout={onLogout}>
              <CreateAgentPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agents"
        element={
          <ProtectedRoute token={token}>
            <Shell active="agents" username={username} onNavigate={(key) => navigate(`/${key === "create-agent" ? "create-agent" : key}`)} onLogout={onLogout}>
              <AgentsPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute token={token}>
            <Shell active="documents" username={username} onNavigate={(key) => navigate(`/${key === "create-agent" ? "create-agent" : key}`)} onLogout={onLogout}>
              <DocumentsPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspace"
        element={
          <ProtectedRoute token={token}>
            <Shell
              active="agents"
              username={username}
              onNavigate={(key) => navigate(`/${key === "create-agent" ? "create-agent" : key}`)}
              onLogout={onLogout}
            >
              <WorkspacePage token={token!} onLogout={onLogout} />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={token ? "/create-agent" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={token ? "/create-agent" : "/login"} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState<string | undefined>(undefined);

  useEffect(() => {
    const saved = localStorage.getItem("token");
    const savedRefresh = localStorage.getItem("refreshToken");
    if (saved) {
      setToken(saved);
      setAuthToken(saved);
      fetchMe()
        .then((me) => setUsername(me?.username))
        .catch(() => setUsername(undefined));
    }
    if (!saved && savedRefresh) {
      // if only refresh exists, keep it for later refresh attempts
      localStorage.setItem("refreshToken", savedRefresh);
    }
    setReady(true);
  }, []);

  const handleAuthenticated = async (tokens: Tokens) => {
    localStorage.setItem("token", tokens.access);
    if (tokens.refresh) localStorage.setItem("refreshToken", tokens.refresh);
    setAuthToken(tokens.access);
    setToken(tokens.access);
    try {
      const me = await fetchMe();
      setUsername(me?.username);
    } catch {
      setUsername(undefined);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setAuthToken(undefined);
    setToken(null);
    setUsername(undefined);
  };

  if (!ready) return null;

  return (
    <BrowserRouter>
      <AppRoutes
        token={token}
        username={username}
        onAuthenticated={handleAuthenticated}
        onLogout={handleLogout}
      />
    </BrowserRouter>
  );
};

export default App;

type NavKey = "create-agent" | "agents" | "documents";

const Shell: React.FC<{
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  onLogout: () => void;
  username?: string;
  children: React.ReactNode;
}> = ({ active, onNavigate, onLogout, username, children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar active={active} onNavigate={onNavigate} onLogout={onLogout} username={username} />
      <main className="bg-slate-50">{children}</main>
    </div>
  );
};
