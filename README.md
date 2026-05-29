# Noor نور — Light on the Path

> **AI-powered curriculum gap finder and hyperlocal content generator for India's 250 million state board students.**

Built for the Wadhwani AI Hackathon — School Education Track

---

## ✨ What It Does

### 📊 Gap Finder
Upload your **state board syllabus PDF**, and Noor compares it against **NEET / JEE / CUET** national syllabi using semantic embeddings (sentence-transformers). It surfaces every missing topic ranked by priority — with **AI-generated study modules** for the most critical gaps.

### 🌍 Hyperlocal Generator
Rewrites any textbook problem using **culturally relevant local context** — food, geography, occupations, festivals — for **6 Indian regions**: Andhra Pradesh, Kerala, Punjab, Rajasthan, Tamil Nadu, West Bengal. Same concept, your world.

---

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Frontend       │────▶│    Backend        │────▶│    AI Engine      │
│  React 18 + RRD   │     │  Express + Mongo  │     │  FastAPI + ML     │
│  Port 3000        │     │  Port 5000        │     │  Port 8000        │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  MongoDB Atlas    │
                         │  (Cloud)          │
                         └──────────────────┘
```

| Layer | Tech |
|-------|------|
| **Frontend** | React 18, React Router v6, Axios, react-dropzone |
| **Backend** | Node.js, Express, Mongoose, JWT Auth, Multer |
| **AI Engine** | Python 3.10+, FastAPI, sentence-transformers, Groq (LLaMA 3.1) |
| **Database** | MongoDB Atlas (cloud) |
| **AI/ML** | `all-MiniLM-L6-v2` for embeddings, Groq API for LLM generation |

---

## 🚀 Quick Start (Windows)

### Prerequisites

- **Node.js** v18+ — [Download](https://nodejs.org/)
- **Python** 3.10+ — [Download](https://www.python.org/downloads/)
- **Git** — [Download](https://git-scm.com/)
- **MongoDB Atlas** account (free tier) — [Sign up](https://www.mongodb.com/cloud/atlas)
- **Groq API key** (free) — [Get one](https://console.groq.com/)

### Step 1: Clone the Repo

```bash
git clone <your-repo-url>
cd Noor
```

### Step 2: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) → Create a free M0 cluster
2. Under **Database Access** → Add a new database user with password
3. Under **Network Access** → Add your IP (or `0.0.0.0/0` for development)
4. Click **Connect** → **Connect your application** → Copy the connection string
5. Replace `<password>` with your database user's password

### Step 3: Set Up Environment Variables

Create `.env` files in each service directory:

**`ai-engine/.env`**
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

**`backend/.env`**
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/noor?retryWrites=true&w=majority
JWT_SECRET=generate_a_64_char_random_string_here
AI_ENGINE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

**`frontend/.env`**
```env
REACT_APP_API_URL=http://localhost:5000
```

> 💡 **Tip:** Generate a secure JWT secret with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Step 4: Install Dependencies

```bash
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..

# AI Engine (use a virtual environment)
cd ai-engine
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### Step 5: Pre-compute Embeddings (One-time setup)

This pre-caches the national syllabus embeddings for faster demo performance:

```bash
cd ai-engine
venv\Scripts\activate
python scripts/precompute_embeddings.py
```

> ⏱️ This takes 1–2 minutes on first run (downloads the `all-MiniLM-L6-v2` model).

### Step 6: Start All Services

Open **3 terminals** and run:

```bash
# Terminal 1 — AI Engine
cd ai-engine
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

```bash
# Terminal 2 — Backend
cd backend
npm run dev
```

```bash
# Terminal 3 — Frontend
cd frontend
npm start
```

### Step 7: Open the App

Navigate to **http://localhost:3000** in your browser.

1. **Register** a new account
2. Go to **Gap Finder** → Upload a state board syllabus PDF → Select target exam
3. Go to **Hyperlocal** → Paste a textbook problem → Select a region → Generate

---

## 📡 API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register a new user |
| POST | `/api/auth/login` | ❌ | Login and get JWT token |
| GET | `/api/auth/me` | ✅ | Get current user profile |

### Gap Analysis (`/api/gap`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/gap/analyse` | ✅ | Upload PDF and run gap analysis |
| GET | `/api/gap/reports` | ✅ | Get user's gap reports |
| GET | `/api/gap/reports/:id` | ✅ | Get a specific report |

### Hyperlocal (`/api/hyperlocal`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/hyperlocal/generate` | ✅ | Generate localized content |
| GET | `/api/hyperlocal/regions` | ❌ | List available regions |
| GET | `/api/hyperlocal/history` | ✅ | Get user's generation history |

### AI Engine (Internal — Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/gap/analyse` | PDF gap analysis |
| POST | `/hyperlocal/generate` | Hyperlocal generation |
| GET | `/hyperlocal/regions` | List regions |

---

## 📁 Project Structure

```
Noor/
├── ai-engine/              # Python FastAPI AI service
│   ├── config.py           # Settings & env vars
│   ├── main.py             # FastAPI app entry point
│   ├── routers/            # API route handlers
│   │   ├── gap_router.py
│   │   └── hyperlocal_router.py
│   ├── services/           # Core business logic
│   │   ├── chunker.py      # Text chunking for embeddings
│   │   ├── embedder.py     # Sentence-transformer embeddings
│   │   ├── gap_generator.py      # LLM study module generation
│   │   ├── hyperlocal_generator.py  # LLM content localization
│   │   ├── pdf_parser.py   # PDF text extraction
│   │   └── similarity.py   # Cosine similarity gap detection
│   ├── scripts/
│   │   └── precompute_embeddings.py
│   ├── data/
│   │   ├── syllabi/        # National exam syllabus JSONs
│   │   └── regional_context/  # Regional culture JSONs
│   └── embeddings/         # Cached embedding pickle files
│
├── backend/                # Node.js Express API
│   └── src/
│       ├── index.js        # Express app entry point
│       ├── config/db.js    # MongoDB connection
│       ├── controllers/    # Route handlers
│       ├── middleware/     # Auth, error, upload middleware
│       ├── models/         # Mongoose schemas
│       ├── routes/         # Express route definitions
│       └── services/       # AI engine HTTP client
│
├── frontend/               # React 18 SPA
│   └── src/
│       ├── App.js          # Router & layout
│       ├── api/            # Axios API modules
│       ├── components/     # Reusable UI components
│       ├── context/        # Auth context provider
│       ├── pages/          # Page-level components
│       └── styles/         # Global CSS
│
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules
├── docker-compose.yml      # Docker multi-service config
└── README.md               # This file
```

---

## 🐳 Docker (Optional)

```bash
docker-compose up --build
```

> **Note:** When using Docker, the services communicate internally. The `backend` connects to the AI engine at `http://ai-engine:8000`. Make sure your `backend/.env` has `AI_ENGINE_URL=http://ai-engine:8000` when running in Docker.

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| `MODULE_NOT_FOUND` errors in backend | Run `cd backend && npm install` |
| AI Engine won't start | Ensure Python venv is activated and `pip install -r requirements.txt` was run |
| MongoDB connection fails | Check your Atlas URI has the correct password and `/noor` database name |
| CORS errors in browser | Ensure `FRONTEND_URL` in `backend/.env` matches your frontend URL |
| Embeddings are slow on first run | Run `python scripts/precompute_embeddings.py` once to cache them |
| PDF upload fails on Windows | Ensure the temp directory is writable |
| Groq API errors | Check your API key is valid at https://console.groq.com |
| Empty gap analysis results | The uploaded PDF may be a scanned image (not text-based) |

---

## 🌱 Supported Exams & Regions

### Target Exams
- **NEET** — Physics, Chemistry
- **JEE Mains** — Mathematics
- **CUET** — Science

### Regional Contexts
- Andhra Pradesh 🌶️
- Kerala 🥥
- Punjab 🌾
- Rajasthan 🏜️
- Tamil Nadu 🛕
- West Bengal 🐟

---

## 👩‍💻 Team

Built solo for Wadhwani AI Hackathon 2025.

---

*نور — Every child deserves a light on their path.* ✨
