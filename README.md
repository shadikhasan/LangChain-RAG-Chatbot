# LangChain RAG Chatbot (Django + React)

Full-stack chatbot starter that lets users choose an LLM provider, bring their own API key, upload knowledge-base files, and chat via Retrieval-Augmented Generation (RAG) built with LangChain.

## Features
- Model picker supporting OpenAI, Anthropic, Google, Groq, HuggingFace Hub, and Ollama entries.
- Upload PDF/TXT/DOCX files; stored under `media/` with vector indexes in `vectorstores/` using FAISS.
- Agent controls: temperature, max tokens, and system prompt.
- REST API: `/api/models`, `/api/upload/`, `/api/create-agent`, `/api/chat`.
- React (TypeScript) frontend with ModelSelector, FileUploader, AgentSettings, and ChatWindow components.

## Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) Ollama or provider-specific credentials depending on the chosen model

## Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
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
The Vite dev server proxies `/api` requests to `http://localhost:8000`.

## API Flow
1) `GET /api/models` – fetch available model options.  
2) `POST /api/upload/` – multipart upload with `file`. Response contains `id`.  
3) `POST /api/create-agent` – body: `model`, `api_key`, `document_ids`, `temperature`, `max_tokens`, `system_prompt`. Returns `session_id`.  
4) `POST /api/chat` – body: `session_id`, `message`, `model`, `api_key` (and optional settings). Response: `answer`.

## Notes
- Vectorstores and uploads are persisted to disk; clear `media/` or `vectorstores/` to reset.
- Agent sessions are tracked in-memory (`chat.views.AGENT_SESSIONS`) for simplicity; swap for a database or cache for production.
- HuggingFace embeddings (`sentence-transformers/all-MiniLM-L6-v2`) are used for FAISS indexing by default. Install GPU-accelerated FAISS if desired.
- Extend providers by updating `chat/langchain_utils.py:model_catalog` and adding a matching `get_chat_model` branch.

## Security
- The demo expects users to supply their own API keys per request. Do not expose real keys in a shared deployment.
- Enable proper CORS settings and authentication before production use.
