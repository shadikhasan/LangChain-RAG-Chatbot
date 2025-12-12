# RAG Workbench (Django + React + Tailwind)

Full-stack RAG workbench with JWT auth, agent management, document uploads, and LangChain-based vectorstores (FAISS). Users can create agents with their own API keys, attach documents, rebuild/reset knowledge bases, and chat securely.

## Features
- JWT auth (access/refresh) with `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/me`.
- Agent builder: provider/model picker (Google, OpenAI, Anthropic, Groq, Local), API key, temperature/max tokens, system prompt, doc selection.
- Knowledge base controls: rebuild KB from selected docs, reset KB (clear docs and vectorstore) with confirmations and progress feedback.
- Document management page: upload/delete/refresh PDF/TXT/DOC/DOCX.
- Chat workspace: select an agent and chat using its vectorstore and settings.
- UI: Vite + React + TypeScript + Tailwind; components include ModelSelector, FileUploader, AgentSettings, AgentEditModal, CreateAgent wizard, and ChatWindow.

## Prerequisites
- Python 3.10+
- Node.js 18+
- Provider API keys (set per agent)

## Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Vite dev server proxies `/api` to `http://localhost:8000`.

## Key API Endpoints
- Auth: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`, `GET /api/auth/me`
- Models: `GET /api/models`
- Documents: `GET/POST /api/documents/`, `DELETE /api/documents/{id}/`
- Agents:
  - `GET/POST /api/agents/`
  - `PATCH /api/agents/{id}/`
  - `DELETE /api/agents/{id}/`
  - `POST /api/agents/{id}/rebuild/` (rebuild vectorstore from linked docs)
  - `POST /api/agents/{id}/reset_kb/` (clear docs + vectorstore)
- Chat: `POST /api/chat` (body: `agent_id`, `message`, optional `api_key`)

## Frontend Views
- Create Agent: 2-step wizard (Model & Key → Knowledge Base) with provider tabs, advanced settings, doc upload/search/select.
- Agents: list, search, edit (model/key/docs/settings), rebuild/reset KB with warnings/progress, delete with confirmation.
- Documents: upload/delete/refresh and list docs.
- Workspace: select an agent and chat; blocks send until an agent is chosen.

## Notes
- Vectorstores are stored under `backend/vectorstores/`; uploads under `backend/media/`.
- Rebuild KB regenerates the store from currently selected docs. Reset KB unlinks docs and deletes the store.
- Ensure trailing slashes for DRF actions (e.g., `/agents/{id}/rebuild/`, `/agents/{id}/reset_kb/`).

## Security
- JWT auth enforced on all core endpoints (except models/auth).
- API keys are stored per agent; provide the correct key for the chosen provider.
