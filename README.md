# AI Codebase Assistant — Production-Grade RAG Architecture

[![Node.js](https://img.shields.io/badge/Node.js-v20+-68a063?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Groq](https://img.shields.io/badge/Inference-Groq%20LPU-f55036?logo=groq&logoColor=white)](https://groq.com/)
[![Pinecone](https://img.shields.io/badge/Vector%20DB-Pinecone%20Namespaces-000000?logo=pinecone&logoColor=white)](https://www.pinecone.io/)
[![JWT](https://img.shields.io/badge/Auth-JWT%20(Access%20%2B%20Refresh)-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Multi--Tenant](https://img.shields.io/badge/Security-Multi--Tenant%20Isolated-blueviolet)](https://www.pinecone.io/learn/namespaces/)
[![Bcrypt](https://img.shields.io/badge/Security-Bcrypt%20Hashed-2b5797)](https://www.npmjs.com/package/bcryptjs)
[![LangChain](https://img.shields.io/badge/Orchestration-LangChain%20JS-1c3c3c?logo=langchain&logoColor=white)](https://js.langchain.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-00ad9f?logo=netlify&logoColor=white)](https://ai-codebase-chat-assistant.netlify.app)

An intelligent code exploration and repository Q&A platform with **strict multi-tenant data isolation**. Index any public GitHub repository, parse syntax trees into logical AST chunks, vectorize code into **Pinecone Cloud namespaces**, and stream sub-second contextualized answers with exact file and line citations powered by **Groq LPU Acceleration**.

> 🌐 **Live Application**: [https://ai-codebase-chat-assistant.netlify.app](https://ai-codebase-chat-assistant.netlify.app)

---

## 🌟 Key Technical Highlights

- **🔒 Strict Multi-Tenant Isolation (Pinecone Namespaces)**: Every user account operates inside their own dedicated Pinecone namespace (`ns_usr_*`). User A's indexed repositories and query results are 100% invisible to User B.
- **⚡ Sub-Second Groq Inference**: High-throughput LLM reasoning with real-time Server-Sent Events (SSE) token streaming, achieving first-token latency in ~270ms.
- **🌳 AST-Aware Syntactic Chunking**: Intelligent code splitting that preserves function, class, and method boundaries with start/end line tracking—never cutting logic mid-statement.
- **🌲 Pinecone Cloud Vector Engine**: 1536-dimensional vector space with metadata filtering (file paths, line spans, programming language, repository tags).
- **🎯 Two-Stage Retrieval & Semantic Re-ranking**: Fast candidate search (top-20) filtered by metadata, followed by keyword overlap and syntactic definition boosting to isolate the top-5 most relevant chunks.
- **📎 Grounded Source Citations**: Every answer provides verified file paths, language tags, and line numbers (`file.js:L15-L42`) with interactive UI citation chips.
- **🔄 Multi-Repository History & Instant Switching**: Users can index multiple repositories in their personal workspace and switch between them anytime—zero repeat indexing needed.
- **💬 Persistent Multi-Turn Chat History**: Conversations are saved per-repository and restored automatically whenever a user switches repositories or returns to the platform.
- **🔐 JWT Authentication with Access & Refresh Tokens**: Secure user registration and sign-in with bcrypt-hashed passwords, short-lived access tokens, and long-lived auto-refreshing sessions.
- **🎨 Editorial Modern UI**: Styled with frosted glassmorphism, responsive navigation, syntax-highlighted code blocks, copy-to-clipboard, and query locking safeguards.
- **🛡️ Resilience & Fallback Engine**: Multi-provider embedding strategy that gracefully degrades to avoid pipeline halts during external provider rate limits.

---

## 🔐 Multi-Tenant Architecture & Namespace Isolation

### The Problem in Standard Shared RAG Systems
In naive RAG implementations, all indexed code chunks are stored in a single shared index or global namespace. When User A indexes a large repository (e.g., `facebook/react`, 169 chunks), any other user visiting the website immediately sees User A's indexed status and can inadvertently query User A's code context, leading to **critical cross-tenant data leakage**.

### Our Solution: Hard Namespace Isolation
1. **Per-User Namespaces**: When a user indexes a repository or queries the system, their requests are tagged with a unique tenant ID (`req.user.namespace`).
2. **Pinecone Namespaces**: Vector operations (`index.namespace(ns).upsert()`, `index.namespace(ns).query()`, `stats.namespaces[ns]`) execute **exclusively** within that user's partition.
3. **JWT Authentication & Account Isolation**:
   - Users register with Name, Email, and Password (hashed with `bcryptjs`).
   - Sessions are protected via JWT Access Tokens (1h) and Refresh Tokens (7d).
   - Every user account is deterministically mapped to a private namespace (`ns_usr_<id>`).
   - When a different user logs in, they only see their own previous repositories, vectors, and chat history.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Pinecone Cloud Index                            │
│                                                                        │
│   ┌───────────────────────────┐    ┌───────────────────────────┐       │
│   │ Namespace:                │    │ Namespace:                │       │
│   │ ns_usr_abhishek_1234      │    │ ns_usr_reviewer_5678      │       │
│   │                           │    │                           │       │
│   │ • Vectors: expressjs/ex.. │    │ • Vectors: facebook/react │       │
│   │ • Chunks: 169             │    │ • Chunks: 240             │       │
│   └───────────────────────────┘    └───────────────────────────┘       │
│                 ▲                                ▲                     │
│                 │ Query / Upsert                 │ Query / Upsert      │
│                 │                                │                     │
│           [ User Alpha ]                   [ User Beta ]               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 System Architecture

```
                                  USER QUERY
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   React 19 Frontend       │
                        │   (AuthContext + SSE)     │
                        └─────────────┬─────────────┘
                                      │ Authorization: Bearer <token>
                                      ▼
                        ┌───────────────────────────┐
                        │    Express.js API Gateway │
                        │    (requireAuth Middleware│
                        └─────────────┬─────────────┘
                                      │ Injects req.user.namespace
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
   ┌───────────────────────┐                       ┌───────────────────────┐
   │ Ingestion Pipeline    │                       │ Query Retrieval RAG   │
   │ (Isolated by Tenant)  │                       │ (Isolated by Tenant)  │
   └──────────┬────────────┘                       └──────────┬────────────┘
              │                                               │
   1. Octokit GitHub Loader                        1. Query Embedding
   2. File Parser & Filter                         2. Pinecone Top-20 (in user ns)
   3. AST Syntax Chunker                           3. Metadata Filtering
   4. Vector Embeddings                            4. Top-5 Re-Ranking
              │                                               │
              ▼                                               ▼
   ┌───────────────────────┐                       ┌───────────────────────┐
   │ Pinecone Cloud Vector │ ◄──────────────────── │ Context Synthesis &   │
   │ (index.namespace(ns)) │     Vector Lookup     │ Groq LLM Inference    │
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
- **`vectorService.js`**: Batches and upserts vectors into **Pinecone Cloud** under the caller's specific `namespace`, supporting scalable cosine similarity retrieval with hard tenant boundaries.

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
| **Frontend** | React 19, Vite, Vanilla CSS | Responsive frosted glass UI, AuthContext, SSE stream parser |
| **Backend** | Node.js (v22), Express.js | REST API, Auth Middleware, SSE streaming endpoints |
| **Multi-Tenancy** | Pinecone Namespaces & UserStore | Hard isolation of vector embeddings & repo histories |
| **Authentication** | JWT (Access + Refresh) & Bcrypt | Secure sign up / sign in with bcrypt hashing & auto-refreshing JWT tokens |
| **Inference Engine**| Groq API (`openai/gpt-oss-120b`) | Ultra-fast token generation and code reasoning (~270ms) |
| **Vector DB** | Pinecone Cloud | Cloud vector database with cosine similarity indexing |
| **Orchestration**| LangChain JS (`@langchain/core`) | Model integration, chat memory, prompt orchestration |
| **Code Parser** | Tree-sitter AST & Regex Parsers | Syntax-aware chunking and function boundary detection |
| **Code Highlight**| Prism (`react-syntax-highlighter`)| Syntax highlighting with one-click copy |

---

## 🔌 API Reference

All protected endpoints accept either `Authorization: Bearer <token>` or `x-client-session: <uuid>`.

### 1. Authentication Endpoints

#### User Registration (Sign Up)
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "Abhishek Verma",
  "email": "abhishek@example.com",
  "password": "SecurePassword123"
}
```
**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": {
    "id": "usr_9f81a7b3c2d1e0f4",
    "name": "Abhishek Verma",
    "email": "abhishek@example.com",
    "namespace": "ns_usr_9f81a7b3c2d1e0f4",
    "repos": []
  }
}
```

#### User Login (Sign In)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "abhishek@example.com",
  "password": "SecurePassword123"
}
```
**Response (200 OK):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": {
    "id": "usr_9f81a7b3c2d1e0f4",
    "name": "Abhishek Verma",
    "email": "abhishek@example.com",
    "namespace": "ns_usr_9f81a7b3c2d1e0f4",
    "repos": [...]
  }
}
```

#### Token Refresh
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<stored_refresh_token>"
}
```
**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

#### User Logout
```http
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "<stored_refresh_token>"
}
```

#### Current User Session
```http
GET /api/auth/me
Authorization: Bearer <accessToken>
```

---

### 2. Repository Management Endpoints

#### Ingest & Index Repository
```http
POST /api/repo/index
Authorization: Bearer <token>
Content-Type: application/json

{
  "repoUrl": "https://github.com/expressjs/express"
}
```
**Response (200 OK):**
```json
{
  "message": "Repository indexed successfully",
  "repo": "https://github.com/expressjs/express",
  "totalFiles": 42,
  "totalChunks": 169,
  "namespace": "ns_demo_candidate_reviewer"
}
```

#### Check Isolated Status
```http
GET /api/repo/status
Authorization: Bearer <token>
```
**Response (200 OK):**
```json
{
  "indexed": true,
  "totalChunks": 169,
  "repo": "https://github.com/expressjs/express",
  "namespace": "ns_demo_candidate_reviewer",
  "repos": [
    {
      "repoUrl": "https://github.com/expressjs/express",
      "totalChunks": 169,
      "totalFiles": 42
    }
  ]
}
```

#### Switch Active Repository
```http
POST /api/repo/select
Authorization: Bearer <token>
Content-Type: application/json

{
  "repoUrl": "https://github.com/facebook/react"
}
```

---

### 3. Stream Chat Query (Server-Sent Events)
```http
POST /api/chat/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "question": "Where is routing handled in this codebase?",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "bot", "content": "Hi! How can I help with the codebase?" }
  ]
}
```
**Stream Events:**
- `data: {"token": "Routing"}`
- `data: {"token": " is implemented in"}`
- `data: {"references": [{"file": "lib/router/index.js", "lines": "45-120", "language": "javascript"}]}`
- `data: [DONE]`

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js **>= 20.0.0**
- A free **Groq API Key** ([console.groq.com](https://console.groq.com/))
- A free **Pinecone API Key & Index** ([pinecone.io](https://www.pinecone.io/))

---

> **Note**: Start the backend and frontend in separate terminal windows.

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

# Pinecone Cloud Vector Database
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=codebase-rag

# JWT Authentication Secrets (Optional: defaults are provided for local development)
JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here

# Optional: GitHub API Token for higher rate limits
GITHUB_TOKEN=your_github_token_here
```

Start the backend:
```bash
npm run dev
# Server running at http://localhost:5000
```

---

### Step 2: Configure Frontend (in a separate terminal)

```bash
cd ../frontend
npm install
```

*(Optional)* Create `.env` in `frontend/`:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
# App running at http://127.0.0.1:5173
```

---

## 📂 Project Structure

```
AI-Codebase-Chat-Assistant/
├── backend/
│   ├── controllers/
│   │   ├── authController.js       # Signup, login, refresh & session handlers
│   │   ├── chatController.js       # SSE stream & tenant-isolated retrieval
│   │   └── repoController.js       # Indexing, status & multi-repo switching
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT Access Token validation & tenant injector
│   ├── rag/
│   │   ├── chunking/chunkCode.js   # AST-aware code chunking
│   │   ├── indexing/indexRepo.js   # End-to-end ingestion pipeline
│   │   ├── ingestion/fileParser.js # Source file extension filters
│   │   ├── ingestion/githubLoader.js# Octokit tree extractor
│   │   └── reranking/rerank.js     # Semantic scoring & definition booster
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth/signup, /login, /refresh, /logout, /me
│   │   ├── chatRoutes.js           # /api/chat/query, /history
│   │   └── repoRoutes.js           # /api/repo/index, /api/repo/status, /select
│   ├── services/
│   │   ├── embeddingService.js     # Vector embedding generation & fallback
│   │   ├── jwtService.js           # Issue & verify Access (1h) & Refresh (7d) tokens
│   │   ├── llmService.js           # Groq streaming completion client
│   │   ├── retrievalService.js     # Metadata filtering
│   │   ├── userStore.js            # Persistent tenant profile, bcrypt hash & repo history
│   │   └── vectorService.js        # Pinecone namespace isolation & search
│   ├── server.js                   # Express application entry point
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg             # Custom brand vector logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthModal.jsx       # Email/Password Sign Up & Sign In modal
│   │   │   ├── ChatBox.jsx         # Chat console, suggestion chips, citations
│   │   │   ├── CodeSnippet.jsx     # Prism syntax highlighter with copy
│   │   │   ├── HeroHeader.jsx      # Editorial headline & feature pills
│   │   │   ├── InfoSections.jsx    # Architecture, How It Works, Features
│   │   │   ├── Message.jsx         # Chat message rows & avatar styling
│   │   │   ├── Navbar.jsx          # Frosted pill navbar + user dropdown menu
│   │   │   └── RepoIngestCard.jsx  # Repo indexing modal & repo switcher
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # User session, auth state, active repo
│   │   ├── pages/ChatPage.jsx      # Main layout & scroll coordinator
│   │   ├── services/api.js         # SSE stream & REST client with auth headers
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

1. **Multi-Tenant Vector Isolation**: Solved shared vector store data leakage using Pinecone namespaces (`index.namespace(ns)`). Ensures 100% hard isolation between users, organizations, or evaluation sessions.
2. **AST Syntactic Integrity**: Avoids naive sliding-window text splitters by detecting semantic blocks (methods, classes, functions), preventing hallucinated imports or cut logic.
3. **Sub-300ms First Token**: Powered by Groq LPUs (`openai/gpt-oss-120b`), streaming tokens to the client via standard HTTP SSE with verified file and line citations.
4. **Graceful Quota Handling**: Dual-layer vector fallback handles API quota limits cleanly without 500 runtime crashes.
5. **Multi-Repo Switching**: Allows users to manage multiple repositories in their personal workspace without losing previous indexings.

---

## 📄 License

This project is licensed under the ISC License.
