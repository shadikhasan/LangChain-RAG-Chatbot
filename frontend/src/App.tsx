import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import WorkspacePage from "./pages/WorkspacePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { setAuthToken } from "./lib/http";

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

const AppRoutes: React.FC<{
  token: string | null;
  onAuthenticated: (tok: string) => Promise<void>;
  onLogout: () => void;
}> = ({ token, onAuthenticated, onLogout }) => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginPage
            onAuthenticated={async (tok) => {
              await onAuthenticated(tok);
              navigate("/", { replace: true });
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
              navigate("/", { replace: true });
            }}
            onSwitch={() => navigate("/login")}
          />
        }
      />
      <Route path="/logout" element={<LogoutRoute onLogout={onLogout} />} />
      <Route
        path="/"
        element={
          <ProtectedRoute token={token}>
            <WorkspacePage token={token!} onLogout={onLogout} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("token");
    if (saved) {
      setToken(saved);
      setAuthToken(saved);
    }
    setReady(true);
  }, []);

  const handleAuthenticated = async (tok: string) => {
    localStorage.setItem("token", tok);
    setAuthToken(tok);
    setToken(tok);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken(undefined);
    setToken(null);
  };

  if (!ready) return null;

  return (
    <BrowserRouter>
      <AppRoutes token={token} onAuthenticated={handleAuthenticated} onLogout={handleLogout} />
    </BrowserRouter>
  );
};

export default App;
