# Noor نور — Light on the Path

> *AI-powered curriculum gap finder and hyperlocal content generator for India's 250 million state board students.*

Wadhwani AI Hackathon — School Education Track

---

## What it does

| Module | Description |
|--------|-------------|
| **Gap Finder** | Uploads your state board syllabus PDF, compares it to NEET/JEE/CUET using semantic embeddings, and surfaces every missing topic ranked by priority — with AI-generated study modules for critical gaps. |
| **Hyperlocal Generator** | Rewrites any textbook problem using culturally relevant local context (food, geography, occupations) for 6 Indian regions — same concept, your world. |

## Stack

- **Frontend** — React 18 + React Router
- **Backend** — Node.js + Express + MongoDB (Mongoose) + JWT Auth
- **AI Engine** — Python + FastAPI + sentence-transformers + Groq (free LLM API)

## Quick Start (Windows)

### 1. Get a free Groq API key
Go to https://console.groq.com → Sign up → Create API key → copy it

### 2. Clone and set up

```bash
git clone <your-repo-url>
cd noor
```

### 3. Set environment variables

```bash
# ai-engine/.env
GROQ_API_KEY=gsk_your_key_here

# backend/.env  (copy from .env.example)
PORT=5000
MONGO_URI=mongodb://localhost:27017/noor
JWT_SECRET=any_long_random_string
AI_ENGINE_URL=http://localhost:8000
```

### 4. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend  
cd ../frontend && npm install

# AI Engine (in a venv)
cd ../ai-engine
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 5. Pre-compute embeddings (do this ONCE before demo)

```bash
cd ai-engine
venv\Scripts\activate
python scripts/precompute_embeddings.py
```

### 6. Start all services (4 terminals)

```bash
# Terminal 1 — MongoDB (must be installed)
mongod

# Terminal 2 — AI Engine
cd ai-engine && venv\Scripts\activate && uvicorn main:app --reload --port 8000

# Terminal 3 — Backend
cd backend && npm run dev

# Terminal 4 — Frontend
cd frontend && npm start
```

Open http://localhost:3000

## Team

Built solo for Wadhwani AI Hackathon 2025.

---

*نور — Every child deserves a light on their path.*
