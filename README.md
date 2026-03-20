# AI Codebase Chat Assistant (RAG System)

An AI-powered assistant that lets developers **ask natural language questions** about any GitHub codebase and receive code snippets, explanations, and file references.

## Live Link - https://ai-codebase-chat-assistant.netlify.app

## Features

- 🔍 **Semantic Code Search** — Ask questions in plain English, get relevant code
- 📁 **GitHub Ingestion** — Index any public GitHub repository
- 🧠 **RAG Pipeline** — Retrieval-Augmented Generation with FAISS vector search
- 💬 **Streaming Chat** — Real-time token streaming (like ChatGPT)
- 🎨 **Syntax Highlighting** — Code blocks with full syntax highlighting
- 📎 **File References** — See exactly which files and lines were used
- 🔄 **Multi-turn** — Conversation history for follow-up questions

## Quick Start

### 1. Backend

```bash
cd backend
npm install --legacy-peer-deps
cp .env.example .env
# Edit .env → add your OPENAI_API_KEY and GITHUB_TOKEN
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Open http://localhost:5173

1. Enter a GitHub repo URL in the sidebar
2. Click **Index Repository** (wait for completion)
3. Ask questions about the code!

## API Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/repo/index` | `{ repoUrl }` | Index a GitHub repo |
| `POST` | `/api/chat/query` | `{ question, history? }` | Ask a question (SSE streaming) |
| `GET`  | `/api/repo/status` | — | Index status |
| `GET`  | `/api/status` | — | Health check |

## Architecture

```
User Question → Embedding → FAISS Search → Metadata Filter → Re-rank → LLM → Streaming Response
```

## Project Structure

```
├── frontend/            # React + Vite + Tailwind
│   └── src/
│       ├── components/  # ChatBox, Message, CodeSnippet
│       ├── pages/       # ChatPage
│       └── services/    # API client
├── backend/
│   ├── routes/          # chatRoutes, repoRoutes
│   ├── controllers/     # chatController, repoController
│   ├── services/        # embedding, vector, retrieval, LLM
│   ├── rag/             # ingestion, chunking, indexing, reranking
│   └── utils/           # metadataBuilder
├── scripts/             # CLI tools & test scripts
└── .github/workflows/   # CI/CD
```

## Test Scripts

```bash
# Test FAISS vector store (no API key needed)
node scripts/testVectorStore.js

# Test ingestion pipeline (needs GITHUB_TOKEN)
node scripts/testIngestion.js

# Index a repo via CLI
node scripts/indexRepository.js https://github.com/user/repo
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| AI/ML | LangChain JS, OpenAI API |
| Vector DB | FAISS (local) |
| Code Parsing | Regex-based with Tree-sitter ready |
| CI/CD | GitHub Actions |


