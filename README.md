# AI Codebase Assistant — Production-Grade RAG Architecture

[![Node.js](https://img.shields.io/badge/Node.js-v20+-68a063?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Groq](https://img.shields.io/badge/Inference-Groq%20LPU-f55036?logo=groq&logoColor=white)](https://groq.com/)
[![Pinecone](https://img.shields.io/badge/Vector%20DB-Pinecone%20Cloud-000000?logo=pinecone&logoColor=white)](https://www.pinecone.io/)
[![LangChain](https://img.shields.io/badge/Orchestration-LangChain%20JS-1c3c3c?logo=langchain&logoColor=white)](https://js.langchain.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-00ad9f?logo=netlify&logoColor=white)](https://ai-codebase-chat-assistant.netlify.app)

An intelligent code exploration and repository Q&A platform. Index any public GitHub repository, parse syntax trees into logical AST chunks, vectorize code into **Pinecone Cloud**, and stream sub-second contextualized answers with exact file and line citations powered by **Groq LPU Acceleration**.

> 🌐 **Live Application**: [https://ai-codebase-chat-assistant.netlify.app](https://ai-codebase-chat-assistant.netlify.app)

---

## 🌟 Key Technical Highlights

- **⚡ Sub-Second Groq Inference**: High-throughput LLM reasoning with real-time Server-Sent Events (SSE) token streaming.
- **🌳 AST-Aware Syntactic Chunking**: Intelligent code splitting that preserves function, class, and method boundaries with start/end line tracking—never cutting logic mid-statement.
- **🌲 Pinecone Cloud Vector Engine**: 1536-dimensional vector space with metadata filtering (file paths, line spans, programming language, repository tags).
- **🎯 Two-Stage Retrieval & Semantic Re-ranking**: Fast candidate search (top-20) filtered by metadata, followed by keyword overlap and syntactic definition boosting to isolate the top-5 most relevant chunks.
- **📎 Grounded Source Citations**: Every answer provides verified file paths, language tags, and line numbers (`file.js:L15-L42`) with interactive UI citation chips.
- **🎨 Editorial Modern UI**: Styled with frosted glassmorphism, responsive navigation, syntax-highlighted code blocks, copy-to-clipboard, and query locking safeguards.
- **🛡️ Resilience & Fallback Engine**: Multi-provider embedding strategy that gracefully degrades to avoid pipeline halts during external provider rate limits.

---

## 📐 System Architecture

```
                                  USER QUERY
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   React 19 Frontend       │
                        │   (EventSource SSE Stream)│
                        └─────────────┬─────────────┘
                                      │ HTTP POST /api/chat/query
                                      ▼
                        ┌───────────────────────────┐
                        │    Express.js API Gateway │
                        └─────────────┬─────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
   ┌───────────────────────┐                       ┌───────────────────────┐
   │ Ingestion Pipeline    │                       │ Query Retrieval RAG   │
   │ (Triggered on Index)  │                       │ (Real-time Execution) │
   └──────────┬────────────┘                       └──────────┬────────────┘
              │                                               │
   1. Octokit GitHub Loader                        1. Query Embedding
   2. File Parser & Filter                         2. Pinecone Top-20 Search
   3. AST Syntax Chunker                           3. Metadata Filtering
   4. Vector Embeddings                            4. Top-5 Re-Ranking
              │                                               │
              ▼                                               ▼
   ┌───────────────────────┐                       ┌───────────────────────┐
   │ Pinecone Cloud Vector │ ◄──────────────────── │ Context Synthesis &   │
   │ (1536-dim Namespace)  │     Vector Lookup     │ Groq LLM Inference    │
   └───────────────────────┘                       └──────────┬────────────┘
                                                              │
                                                              ▼
                                                   Server-Sent Events (SSE)
                                                   Streamed back to Client
```

---

## 🔬 Ingestion & RAG Pipeline Breakdown

### 1. Ingestion (`backend/rag/ingestion/`)
- **`githubLoader.js`**: Connects via GitHub REST API / Octokit to fetch the recursive Git tree of the target repository. Filters out binaries, minified bundles, lock files, and non-source extensions.
- **`fileParser.js`**: Enforces language detection (JavaScript, TypeScript, Python, Go, Rust, Java, etc.) and file size ceilings.

### 2. AST Chunking (`backend/rag/chunking/`)
- **`chunkCode.js`**: Analyzes syntax structures to partition code into semantically coherent blocks (functions, classes, interface definitions). Attaches rich metadata:
  ```json
  {
    "file": "controllers/chatController.js",
    "startLine": 20,
    "endLine": 99,
    "language": "javascript",
    "type": "function",
    "repo": "https://github.com/user/repo"
  }
  ```

### 3. Embeddings & Vector Database (`backend/services/`)
- **`embeddingService.js`**: Converts code text into 1536-dimensional embeddings with batch rate-limiting and deterministic fallback protection.
- **`vectorService.js`**: Batches and upserts vectors into **Pinecone Cloud** (`codebase-rag` index), supporting scalable cosine similarity retrieval.

### 4. Retrieval & Re-ranking (`backend/rag/reranking/`)
- **`retrievalService.js`**: Applies metadata filtering to eliminate duplicates or irrelevant files.
- **`rerank.js`**: Scores candidates based on cosine similarity, exact query keyword overlap, and syntactic weight (boosting function/class definitions).

### 5. High-Speed Inference (`backend/services/llmService.js`)
- Uses Groq's high-speed endpoint (`https://api.groq.com/openai/v1`) with model `openai/gpt-oss-120b` (or `llama-3.3-70b-versatile`).
- Context window of **131,072 tokens** ensures deep multi-file reasoning with line-accurate source attribution.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Frontend** | React 19, Vite, Vanilla CSS | Responsive frosted glass UI, SSE stream parser |
| **Backend** | Node.js (v22), Express.js | REST API, SSE streaming endpoints, pipeline orchestration |
| **Inference Engine**| Groq API (`openai/gpt-oss-120b`) | Ultra-fast token generation and code reasoning |
| **Vector DB** | Pinecone Cloud | Cloud vector database with cosine similarity indexing |
| **Orchestration**| LangChain JS (`@langchain/core`) | Model integration, chat memory, prompt orchestration |
| **Code Parser** | Tree-sitter AST & Regex Parsers | Syntax-aware chunking and function boundary detection |
| **Code Highlight**| Prism (`react-syntax-highlighter`)| Syntax highlighting with one-click copy |

---

## 🔌 API Reference

### 1. Ingest & Index Repository
```http
POST /api/repo/index
Content-Type: application/json

{
  "repoUrl": "https://github.com/owner/repository"
}
```
**Response (200 OK):**
```json
{
  "message": "Repository indexed successfully",
  "repo": "https://github.com/owner/repository",
  "totalFiles": 42,
  "totalChunks": 169
}
```

### 2. Stream Chat Query (Server-Sent Events)
```http
POST /api/chat/query
Content-Type: application/json

{
  "question": "Where is authentication handled?",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "bot", "content": "Hi! How can I help with the codebase?" }
  ]
}
```
**Stream Events:**
- `data: {"token": "The"}`
- `data: {"token": " authentication"}`
- `data: {"references": [{"file": "auth.js", "lines": "1-35", "language": "javascript"}]}`
- `data: [DONE]`

### 3. Check Repository Status
```http
GET /api/repo/status
```
**Response (200 OK):**
```json
{
  "indexed": true,
  "totalChunks": 169,
  "repo": "https://github.com/owner/repository"
}
```

### 4. Health Check
```http
GET /api/status
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js **>= 20.0.0**
- A free **Groq API Key** ([console.groq.com](https://console.groq.com/))
- A free **Pinecone API Key & Index** ([pinecone.io](https://www.pinecone.io/))
- *(Optional)* A **GitHub Personal Access Token** for higher rate limits

---

### Step 1: Configure Backend

```bash
cd backend
npm install
```

Create `.env` in `backend/`:
```env
# Server
PORT=5000

# Groq API (Ultra-Fast Inference)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# GitHub API (Optional, for higher rate limits)
GITHUB_TOKEN=your_github_token_here

# Pinecone Cloud Vector Database
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=codebase-rag
```

Start the backend:
```bash
npm run dev
# Server running at http://localhost:5000
```

---

### Step 2: Configure Frontend

```bash
cd ../frontend
npm install
npm run dev
# App running at http://127.0.0.1:5173
```

---

## 🧪 Verification & Test Scripts

The repository includes standalone CLI scripts in `/scripts` to verify pipeline components:

```bash
# 1. Verify Pinecone Vector Store Upsert & Search
node scripts/testVectorStore.js

# 2. Verify GitHub Ingestion Tree & AST Chunking
node scripts/testIngestion.js

# 3. Index a Repository directly from CLI
node scripts/indexRepository.js https://github.com/expressjs/express
```

---

## 📂 Project Structure

```
AI-Codebase-Chat-Assistant/
├── backend/
│   ├── controllers/
│   │   ├── chatController.js       # SSE stream & pipeline coordinator
│   │   └── repoController.js       # Indexing & status endpoints
│   ├── rag/
│   │   ├── chunking/chunkCode.js   # AST-aware code chunking
│   │   ├── indexing/indexRepo.js   # End-to-end ingestion pipeline
│   │   ├── ingestion/fileParser.js # Source file extension filters
│   │   ├── ingestion/githubLoader.js# Octokit tree extractor
│   │   └── reranking/rerank.js     # Semantic scoring & definition booster
│   ├── routes/
│   │   ├── chatRoutes.js           # /api/chat/query
│   │   └── repoRoutes.js           # /api/repo/index, /api/repo/status
│   ├── services/
│   │   ├── embeddingService.js     # Vector embedding generation & fallback
│   │   ├── llmService.js           # Groq streaming completion client
│   │   ├── retrievalService.js     # Metadata filtering
│   │   └── vectorService.js        # Pinecone upsert & similarity search
│   ├── server.js                   # Express application entry point
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg             # Custom brand vector logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBox.jsx         # Chat console, suggestion chips, citations
│   │   │   ├── CodeSnippet.jsx     # Prism syntax highlighter with copy
│   │   │   ├── HeroHeader.jsx      # Editorial headline & feature pills
│   │   │   ├── InfoSections.jsx    # Architecture, How It Works, Features
│   │   │   ├── Message.jsx         # Chat message rows & avatar styling
│   │   │   ├── Navbar.jsx          # Floating frosted pill navbar
│   │   │   └── RepoIngestCard.jsx  # Repository indexing modal
│   │   ├── pages/ChatPage.jsx      # Main layout & scroll coordinator
│   │   ├── services/api.js         # SSE stream & REST client
│   │   ├── index.css               # Design system & tokens
│   │   └── main.jsx
│   └── package.json
│
├── scripts/
│   ├── testIngestion.js            # CLI ingestion unit tests
│   ├── testVectorStore.js          # CLI Pinecone vector tests
│   └── indexRepository.js          # Standalone repository indexing CLI
│
└── README.md
```

---

## 🎯 Production Engineering Highlights for Interview Evaluation

1. **AST Syntactic Integrity**: Avoids naive sliding-window text splitters by detecting semantic blocks (methods, classes, functions), preventing hallucinated imports or cut logic.
2. **Sub-300ms First Token**: Replaces slow standard LLM APIs with Groq LPUs, streaming tokens to client via standard HTTP SSE.
3. **Graceful Quota Handling**: Dual-layer vector fallback handles API quota limits cleanly without 500 runtime crashes.
4. **Context Isolation**: Questions are locked until a repository is active, ensuring all queries are grounded in verified vector embeddings.

---

## 📄 License

This project is licensed under the ISC License.
