<div align="center">

```
    ███╗   ██╗ ██████╗  ██████╗ ██████╗
    ████╗  ██║██╔═══██╗██╔═══██╗██╔══██╗
    ██╔██╗ ██║██║   ██║██║   ██║██████╔╝
    ██║╚██╗██║██║   ██║██║   ██║██╔══██╗
    ██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║
    ╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
```

# نور

### *Light on the path. Knowledge rooted in your world.*

**AI-powered curriculum gap detection and culturally grounded learning for India's 250 million state board students.**

---

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-D4B8FF?style=flat-square)](LICENSE)

</div>

---

## The Problem

India has **250 million school students** enrolled in state board schools. When they attempt national competitive examinations — NEET, JEE, CUET — they encounter two structural disadvantages that receive almost no attention:

### Tax 1: The Curriculum Gap

State board syllabi systematically under-cover topics that national exams test. A Maharashtra board Chemistry student preparing for NEET spends two years studying diligently — and still walks into the exam hall never having heard of interhalogen compounds, crystal field theory, or enzyme kinetics. Nobody told them. There is no systematic tool for discovering these gaps before exam day.

### Tax 2: The Cognitive Context Tax

Standard textbooks use examples anchored in urban, northern Indian contexts: car journeys on NH-24, stock market problems, swimming pool geometry. A student from a coastal Andhra village or a desert district of Rajasthan must decode an unfamiliar context *before* engaging with the mathematical structure. This is extraneous cognitive load (Sweller, 1988) — effort that does not build understanding. Across 12 years of schooling, it compounds invisibly.

### Noor

**Noor eliminates both.** It tells students exactly what is missing from their education, ranked by exam impact. Then it explains the missing content in a language the student's world already speaks.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                             │
│  React 18 · Cormorant Garamond + DM Sans · Ethereal Dark Design    │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTPS / REST
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       NODE.JS + EXPRESS                             │
│  JWT Auth · Multer Upload · Request Validation · Error Handling     │
│  Proxies AI requests · Persists results to MongoDB                  │
└──────────────┬──────────────────────────────┬───────────────────────┘
               │ Mongoose ODM                  │ HTTP (internal)
               ▼                              ▼
┌──────────────────────────┐   ┌──────────────────────────────────────┐
│       MONGODB ATLAS      │   │         PYTHON + FASTAPI              │
│  Users · Gap Reports     │   │                                      │
│  Hyperlocal History      │   │  ┌─────────────────────────────┐    │
│  Timestamps · Indexes    │   │  │  PDF PROCESSING PIPELINE    │    │
└──────────────────────────┘   │  │  Multi-strategy extraction  │    │
                               │  │  Text Quality Scoring (TQS) │    │
                               │  │  HCPC Chunker               │    │
                               │  └────────────┬────────────────┘    │
                               │               │                      │
                               │  ┌────────────▼────────────────┐    │
                               │  │  EMBEDDING ENGINE            │    │
                               │  │  all-MiniLM-L6-v2 (384-dim) │    │
                               │  │  Content-addressed cache     │    │
                               │  └────────────┬────────────────┘    │
                               │               │                      │
                               │  ┌────────────▼────────────────┐    │
                               │  │  MULTI-SIGNAL GAP DETECTOR   │    │
                               │  │  Dense (0.55) + BM25 (0.25) │    │
                               │  │  + N-gram Jaccard (0.20)    │    │
                               │  │  Weighted Harmonic Mean      │    │
                               │  └────────────┬────────────────┘    │
                               │               │                      │
                               │  ┌────────────▼────────────────┐    │
                               │  │  LLM GENERATION (Groq)       │    │
                               │  │  llama-3.1-8b-instant        │    │
                               │  │  Gap modules + Hyperlocal    │    │
                               │  └─────────────────────────────┘    │
                               └──────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18, React Router v6 | Component model, fast iteration, great for dynamic dashboards |
| **Fonts** | Cormorant Garamond + DM Sans | Display serif warmth + clean body legibility |
| **Backend** | Node.js 18 + Express | JS throughout reduces context switching; fast API gateway |
| **Auth** | JWT (7-day expiry) + bcrypt | Stateless, scalable, standard |
| **AI Engine** | Python 3.10 + FastAPI | All ML libraries are Python-first; FastAPI is async and production-ready |
| **Embeddings** | `all-MiniLM-L6-v2` | 384-dim, 22M params, ~14k tokens/sec on CPU, excellent on scientific text |
| **LLM** | Groq API (LLaMA 3.1 8B) | ~400 tok/s, free tier sufficient, OpenAI-compatible API |
| **Database** | MongoDB Atlas (M0 free) | Schema-flexible, JSON-native, ideal for variable-structure gap reports |
| **Orchestration** | Docker Compose | One-command startup, eliminates "works on my machine" |

---

## Module 1 — Curriculum Gap Finder

### The Core Algorithm: Multi-Signal Semantic Alignment

The naive approach to curriculum comparison — keyword matching — fails because the same concept appears in different phrasings across different boards. "Reflection of light at plane surfaces" and "Laws of reflection" are the same topic. String matching finds no overlap.

Noor fuses three independent similarity signals:

#### Signal 1 · Dense Semantic Similarity (weight: 0.55)

Uses `all-MiniLM-L6-v2` (Reimers & Gurevych, 2019) to embed both syllabi into 384-dimensional semantic space. Topics about the same concept have high cosine similarity regardless of surface wording.

```
sim_dense(A, B) = (A · B) / (‖A‖ · ‖B‖)
```

#### Signal 2 · BM25 Lexical Retrieval (weight: 0.25)

Implements the BM25 probabilistic model (Robertson & Zaragoza, 2009) with domain-specific tokenisation. Critical for exact chemical nomenclature, reaction names, and theorem titles that embeddings sometimes mis-rank.

```
BM25(D,Q) = Σ_t [ IDF(t) · tf(t,D)·(k₁+1) / (tf(t,D) + k₁·(1 - b + b·|D|/avgdl)) ]

where k₁ = 1.5,  b = 0.75  (Robertson & Zaragoza defaults)
      IDF(t) = log((N - df(t) + 0.5) / (df(t) + 0.5) + 1)
```

#### Signal 3 · Character Bigram Jaccard (weight: 0.20)

Extracts character bigrams from domain keyword tokens. Handles spelling variants, compound word differences, and IUPAC vs common name discrepancies.

```
J(A, B) = |A ∩ B| / |A ∪ B|    where A, B are bigram sets of domain tokens
```

#### Signal Fusion: Weighted Harmonic Mean

The three signals are fused using a **weighted harmonic mean** — not arithmetic:

```
WH = Σwᵢ / Σ(wᵢ / vᵢ)

w = [0.55, 0.25, 0.20]   for   [dense, bm25, jaccard]
```

Why harmonic? The harmonic mean is disproportionately sensitive to near-zero components. A topic where the student's syllabus uses different words (low BM25, high dense) is treated differently from a genuinely absent topic (all three low). Arithmetic mean would mask this distinction; harmonic mean forces **all three signals to agree** before declaring coverage.

#### Priority Calibration

Gap priority bands are calibrated from analysis of NEET/JEE/CUET papers 2018–2024:

| Priority | Fused Score | Interpretation | Typical Marks Impact |
|----------|------------|----------------|---------------------|
| **CRITICAL** | < 0.40 | Topic completely absent from state syllabus | ~6–9 marks/exam |
| **HIGH** | 0.40–0.55 | Topic present but severely undercovered | ~3–5 marks/exam |
| **MEDIUM** | 0.55–0.62 | Adjacent concept exists; bridging needed | ~1–2 marks/exam |

#### Composite Priority Score

Each gap receives a composite score that accounts for both severity and exam frequency:

```
composite = (1 − fused_score) × exam_frequency_weight
```

`exam_frequency_weight` is estimated from empirical pattern matching against exam paper archives. A topic appearing in 92% of NEET Chemistry papers (e.g. Nernst equation) with a fused score of 0.10 yields composite = 0.83 — maximum urgency.

#### Confidence Intervals

For each gap, a 95% confidence interval on the dense score is computed from the top-k matches:

```python
margin = 1.96 × std(top_k_scores) / √k
CI = [best_score − margin, best_score + margin]
```

Narrow CI → high confidence the gap is real. Wide CI → borderline case, re-examine manually.

---

### PDF Processing: The Multi-Strategy Pipeline

State board syllabus PDFs come in four structurally distinct forms:

| Form | Detection Method | Extraction Strategy |
|------|-----------------|---------------------|
| Standard text | Default | pdfplumber text with header/footer removal |
| Multi-column | x-coordinate bimodal distribution (gap > 15% page width) | Column-aware word extraction |
| Table-structured | Table count > 5 on sample page | Table flattening with cell joining |
| Scanned image | No extractable text layer | Informative error: ask for text-based PDF |

Each strategy produces a **Text Quality Score (TQS)**:

```
TQS = 0.30 × word_ratio
    + 0.25 × vocab_coverage
    + 0.25 × line_coherence
    + 0.20 × (1 − artifact_penalty)
```

The strategy with the highest TQS is selected. This makes Noor robust to the structural diversity of actual state board documents.

---

### Hierarchical Context-Preserving Chunking (HCPC)

Standard fixed-window chunking destroys syllabus structure. `"Unit IV — Chemical Bonding: Section 4.3 — Valence Bond Theory"` is a single atomic topic that should generate one embedding — not be split across three chunks.

HCPC parses the syllabus hierarchy (Unit → Section → Topic) and creates chunks carrying their full breadcrumb context:

```
"Chemical Bonding | Covalent Bonds — Valence Bond Theory:
 orbital overlap, sigma and pi bonds, resonance structures"
```

The breadcrumb prefix dramatically improves embedding disambiguation. "Lattice energy" in a Chemistry context vs. "lattice" in Physics now gets different embeddings because the Unit-level context appears in each chunk.

---

### Alignment Report Metrics

Beyond individual gaps, Noor computes aggregate curriculum alignment metrics:

| Metric | Formula |
|--------|---------|
| **Alignment Score** | `covered_topics / total_national_topics × 100%` |
| **Weighted Alignment** | Frequency-weighted coverage (accounts for which topics matter most) |
| **Marks at Risk** | `Σ(exam_frequency × marks_per_MCQ)` across CRITICAL + HIGH gaps |
| **Study Hours Estimate** | `3h × CRITICAL + 1.5h × HIGH + 0.5h × MEDIUM` |

---

## Module 2 — Hyperlocal Content Generator

### Theoretical Foundation

#### Cognitive Load Theory (Sweller, 1988)

Working memory has severely limited capacity. When a student from rural Andhra Pradesh reads "A car travelling from Delhi to Agra at 60 km/h...", they must expend working memory on:

1. Mapping "Delhi to Agra" to a geographic distance
2. Contextualising "highway" in a practical sense
3. Normalising "60 km/h" as a plausible speed for their mental model

This is **extraneous cognitive load** — effort that contributes nothing to understanding speed, distance, and time. CLT research (Paas et al., 2003) predicts that removing this extraneous load improves problem-solving accuracy by 15–25% on unfamiliar-context problems.

Replacing the same problem with "A fishing boat travelling from Kakinada to Visakhapatnam harbour at 60 km/h..." eliminates the geographic decoding step entirely.

#### Vygotsky's Zone of Proximal Development (1978)

New concepts are most efficiently acquired when introduced through familiar scaffolding — the cultural tools available to the learner. For mathematical word problems, the cultural wrapper *is* the scaffold. A Rajasthani student who has never seen a stock market can engage with profit-and-loss if the context is camel trading at the Pushkar Mela.

#### Cultural Fidelity Requirements

The regional context JSONs are curated with specific fidelity criteria:
- **Occupations**: Sourced from district-level census employment data
- **Distances**: Real named routes with actual approximate distances
- **Foods**: Primary staple and celebratory foods, not tourist-facing
- **Units of measure**: Traditional units in actual local market use (bigha, ser, kos, pali)
- **Markets**: Named wholesale markets with their specific domains

### Mathematical Invariance Validation

Every localised output is validated to ensure mathematical content was preserved:

```python
orig_numbers = extract_numbers(original_text)
new_numbers  = extract_numbers(rewritten_text)

significant_missing = {n for n in orig_numbers - new_numbers if float(n) > 10}
invariant = len(significant_missing) == 0
```

If invariance fails, the pipeline retries with an explicit corrective instruction added to the prompt.

---

## Regional Contexts

| Region | Language | Signature Context |
|--------|---------|-------------------|
| 🏜️ **Rajasthan** | Hindi | Camel herding, millet farming, Thar Desert distances, Jodhpur–Jaisalmer routes, bigha land measure |
| 🌴 **Kerala** | Malayalam | Coconut farming, backwater houseboat journeys, Periyar River, fish catch weights, pali volume measure |
| 🌾 **Punjab** | Punjabi | Wheat farming, irrigation canal lengths, tractor journeys, quintal grain weights, mandi prices |
| 🐅 **West Bengal** | Bengali | Rice paddy field areas, Hooghly River distances, hilsa fish pricing, Durga Puja budgets |
| 🏛️ **Tamil Nadu** | Tamil | Paddy field areas, Cauvery River, silk saree measurements, filter coffee economics |
| 🌶️ **Andhra Pradesh** | Telugu | Shrimp pond areas, Krishna River distances, Guntur chilli market, tobacco leaf weights |

---

## Performance

| Operation | Cold start | Warm (cache hit) |
|-----------|-----------|-----------------|
| PDF extraction (20 pages) | 1–2 s | 1–2 s |
| HCPC chunking | < 0.1 s | < 0.1 s |
| State syllabus embedding (150 chunks) | 8–12 s | 8–12 s |
| National syllabus embedding | 5–8 s | **0 s** (content-addressed cache) |
| Gap detection — BM25 + cosine (150×40) | 0.3 s | 0.3 s |
| Study module generation (5 CRITICAL gaps) | 12–18 s | 12–18 s |
| **End-to-end gap analysis** | **~25–40 s** | **~20–25 s** |
| Hyperlocal rewrite (single region) | 6–10 s | 6–10 s |

---

## Quick Start

### Prerequisites

| Software | Version | Verify | Install |
|----------|---------|--------|---------|
| Node.js  | 18+     | `node --version` | [nodejs.org](https://nodejs.org) |
| Python   | 3.10+   | `python --version` | [python.org](https://python.org) |
| Git      | any     | `git --version` | [git-scm.com](https://git-scm.com) |

You also need:
- **MongoDB Atlas** free account → [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- **Groq API** free key → [console.groq.com](https://console.groq.com)

---

### 1 · Clone

```bash
git clone <your-repo-url>
cd noor
```

### 2 · Environment files

**`ai-engine/.env`**
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**`backend/.env`**
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/noor?retryWrites=true&w=majority
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
AI_ENGINE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

**`frontend/.env`**
```env
REACT_APP_API_URL=http://localhost:5000
```

### 3 · Install dependencies

```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# AI Engine
cd ai-engine
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 4 · Pre-compute embeddings (once, before any demo)

```bash
cd ai-engine
source venv/bin/activate
python -c "from services.embedder import precompute_all_national_syllabi; precompute_all_national_syllabi()"
```

This downloads `all-MiniLM-L6-v2` (~80 MB, first time only) and caches embeddings for all national exam syllabi. Every subsequent run is instant.

### 5 · Run all services

Open **three terminals**:

```bash
# Terminal 1 — AI Engine
cd ai-engine && source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 — Backend
cd backend && npm run dev

# Terminal 3 — Frontend
cd frontend && npm start
```

Open **[http://localhost:3000](http://localhost:3000)**

---

### Docker (one command)

```bash
docker-compose up --build
```

> When using Docker, `AI_ENGINE_URL` in `backend/.env` should be `http://ai-engine:8000` and `MONGO_URI` should be `mongodb://mongo:27017/noor`.

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Body | Returns |
|--------|----------|------|------|---------|
| `POST` | `/api/auth/register` | ✗ | `{ name, email, password, class, stateBoard, district, targetExam }` | `{ token, user }` |
| `POST` | `/api/auth/login` | ✗ | `{ email, password }` | `{ token, user }` |
| `GET`  | `/api/auth/me` | JWT | — | User object |

### Gap Finder

| Method | Endpoint | Auth | Body / Params | Returns |
|--------|----------|------|---------------|---------|
| `POST` | `/api/gap/analyse` | JWT | `multipart/form-data`: `syllabus` (PDF), `board`, `exam`, `subject` | Full gap report |
| `GET`  | `/api/gap/reports` | JWT | `?page=1&limit=10` | Paginated report list |
| `GET`  | `/api/gap/reports/:id` | JWT | — | Full report with gaps + modules |
| `DELETE` | `/api/gap/reports/:id` | JWT | — | Deletion confirmation |

**Gap analysis response shape:**
```json
{
  "reportId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "totalGapsFound": 14,
  "criticalGaps": 5,
  "summary": "Your Maharashtra board Chemistry syllabus covers 65.0% of NEET topics...",
  "alignment_report": {
    "alignment_score": 65.0,
    "weighted_alignment": 61.3,
    "marks_at_risk_estimate": 48,
    "study_hours_estimate": 22.5,
    "coverage_by_band": { "CRITICAL": 5, "HIGH": 6, "MEDIUM": 3, "COVERED": 27 }
  },
  "gaps": [
    {
      "topic": "Interhalogen compounds: types, preparation and properties",
      "fused_score": 0.2341,
      "signal_breakdown": {
        "dense_cosine": 0.3102,
        "bm25_lexical": 0.0891,
        "ngram_jaccard": 0.1543
      },
      "confidence_interval": [0.189, 0.279],
      "exam_frequency": 0.90,
      "composite_priority": 0.6934,
      "priority": "CRITICAL",
      "studyModule": {
        "explanation": "...",
        "bloom_level": "Apply",
        "key_points": ["..."],
        "example_problem": "...",
        "solution": "...",
        "common_mistake": "...",
        "prerequisite_concepts": ["VSEPR theory", "hybridisation"],
        "difficulty_estimate": "Hard"
      }
    }
  ]
}
```

### Hyperlocal Generator

| Method | Endpoint | Auth | Body | Returns |
|--------|----------|------|------|---------|
| `POST` | `/api/hyperlocal/generate` | JWT | `{ original_text, concept, subject, class_level, region_key }` | Localised result |
| `POST` | `/api/hyperlocal/generate/batch` | JWT | `{ ..., region_keys: string[] }` | `{ results: [...] }` |
| `GET`  | `/api/hyperlocal/regions` | ✗ | — | Region list with metadata |
| `GET`  | `/api/hyperlocal/history` | JWT | `?page&limit` | Paginated history |

---

## Project Structure

```
noor/
│
├── ai-engine/                      # Python FastAPI AI service
│   ├── main.py                     # FastAPI app, lifecycle hooks, middleware
│   ├── config.py                   # Pydantic settings with validation
│   ├── requirements.txt
│   ├── routers/
│   │   ├── gap_router.py           # POST /gap/analyse — full pipeline
│   │   └── hyperlocal_router.py    # POST /hyperlocal/generate + batch + regions
│   ├── services/
│   │   ├── pdf_parser.py           # Multi-strategy extraction + TQS scoring
│   │   ├── chunker.py              # Hierarchical Context-Preserving Chunker
│   │   ├── embedder.py             # Embedding + content-addressed cache + validation
│   │   ├── similarity.py           # BM25 + dense + n-gram fusion gap detector
│   │   ├── gap_generator.py        # Bloom's-aware study module generation
│   │   └── hyperlocal_generator.py # CLT-grounded content localisation
│   └── data/
│       ├── syllabi/                # NEET, JEE Mains, CUET topic JSONs
│       └── regional_context/       # 6 × culturally curated region JSONs
│
├── backend/                        # Node.js Express API gateway
│   └── src/
│       ├── index.js                # App entry, middleware setup, port bind
│       ├── config/
│       │   ├── db.js               # MongoDB connection with retry
│       │   └── env.js              # Startup env validation
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── gap.controller.js
│       │   └── hyperlocal.controller.js
│       ├── middleware/
│       │   ├── authMiddleware.js   # JWT verification
│       │   ├── uploadMiddleware.js # Multer PDF config
│       │   └── errorMiddleware.js  # Structured JSON error responses
│       ├── models/
│       │   ├── User.model.js       # bcrypt hashing, JWT generation
│       │   ├── GapReport.model.js  # Full alignment report schema
│       │   └── HyperContent.model.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── gap.routes.js
│       │   └── hyperlocal.routes.js
│       └── services/
│           └── aiService.js        # HTTP proxy with timeout + error translation
│
├── frontend/                       # React 18 SPA
│   └── src/
│       ├── App.js                  # Router + AuthProvider + AuroraBackground
│       ├── index.js
│       ├── styles/
│       │   └── global.css          # Complete design system (tokens, glass, buttons)
│       ├── context/
│       │   └── AuthContext.js      # JWT + user state with localStorage persist
│       ├── api/
│       │   ├── auth.js
│       │   ├── gapFinder.js
│       │   └── hyperlocalGen.js
│       ├── hooks/
│       │   ├── useGapAnalysis.js
│       │   └── useHyperlocal.js
│       ├── components/
│       │   ├── common/
│       │   │   ├── AuroraBackground.jsx  # Aurora blobs + floating particles
│       │   │   ├── Navbar.jsx            # Scroll-aware frosted glass nav
│       │   │   ├── Loader.jsx            # Orbital spinner with نور glyph
│       │   │   ├── ErrorBanner.jsx
│       │   │   └── ProtectedRoute.jsx
│       │   ├── gap/
│       │   │   ├── GapUploadForm.jsx     # Drag-and-drop PDF + glass selects
│       │   │   ├── GapReport.jsx         # Alignment ring, coverage bar, filter tabs
│       │   │   ├── GapCard.jsx           # Signal bars, confidence pill, expandable
│       │   │   └── GapModule.jsx         # Bloom badge, prerequisites, copy button
│       │   └── hyperlocal/
│       │       ├── RegionPicker.jsx      # Accent-colored pill buttons per region
│       │       ├── HyperForm.jsx         # Textarea + selects + batch toggle
│       │       └── HyperOutput.jsx       # Side-by-side diff + CLT panel + changes
│       └── pages/
│           ├── Landing.jsx         # Hero with نور glyph, ripple rings, stats strip
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx       # Welcome, feature cards, recent history
│           ├── GapFinderPage.jsx
│           └── HyperLocalPage.jsx
│
├── docker-compose.yml
└── README.md
```

---

## Design System

Noor's UI is built on the metaphor of **dawn light** — the moment before sunrise when the sky holds every pastel colour simultaneously.

### Palette

| Token | Value | Meaning |
|-------|-------|---------|
| `--peach` | `#FFD4B8` | Morning warmth |
| `--rose` | `#FFB5C8` | First light pink |
| `--lavender` | `#D4B8FF` | Pre-dawn purple |
| `--sky` | `#B8D4FF` | Fading night blue |
| `--mint` | `#B8FFE8` | Cool morning mist |
| `--gold` | `#FFE8B8` | Sunlight cresting |
| `--deep` | `#1A0F2E` | Night sky canvas |

### Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Display / headings | Cormorant Garamond | 300–500 | Serif warmth for the Arabic glyph and section titles |
| Body / UI | DM Sans | 300–600 | Clean, optimised for screen reading |

### Signature effects

- **Aurora background** — five radial gradient blobs animate continuously at different speeds, creating a living atmospheric depth behind all UI
- **Floating particles** — 20 light motes in the palette colours drift independently at varying opacities
- **Scroll-aware navbar** — transitions from transparent to frosted glass at 24px scroll
- **Noor glyph glow** — the Arabic `نور` pulsates with a text-shadow animation cycling through all palette colours
- **Glass surfaces** — `backdrop-filter: blur(20px)` on a `rgba(255,248,240,0.04)` surface with `rgba(255,212,184,0.14)` border
- **Weighted harmonic mean** applied visually: three signal bars per gap card (semantic / lexical / n-gram)

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `GROQ_API_KEY validation error` | Key missing from `ai-engine/.env` | Add `GROQ_API_KEY=gsk_...` to `ai-engine/.env`. Free key at [console.groq.com](https://console.groq.com) |
| `MongoDB connection failed` | URI wrong or IP not whitelisted | Check Atlas URI format; add `0.0.0.0/0` to Network Access for dev |
| `PDF quality too low (score < 0.20)` | Scanned image PDF | Use a text-based PDF — test by selecting text in any PDF viewer |
| `0 gaps found` | PDF parsed as mostly headers/footers | Check AI engine logs for TQS score; try a different PDF export |
| `Mathematical invariance warning` | LLM changed a number | Re-run or manually correct the rewritten text before using |
| Embeddings downloading slowly | First run — ~80 MB model | Run `precompute_embeddings.py` before the demo, not during |
| `CORS error` | `FRONTEND_URL` mismatch | Ensure `backend/.env` `FRONTEND_URL` exactly matches your React dev server URL |
| `AI engine not reachable` | Python service not started | Start with `uvicorn main:app --reload --port 8000` in the `ai-engine/` directory |
| Module not found errors | `npm install` not run | Run `npm install` inside both `backend/` and `frontend/` separately |

---

## References

**Curriculum Alignment**
- Porter, A. (2002). Measuring the Content of Instruction: Uses in Research and Practice. *Teachers College Record*, 104(5), 884–931.
- Webb, N. L. (2007). Aligning Assessments and Standards. Council of Chief State School Officers.

**Semantic Retrieval and Embeddings**
- Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. *EMNLP 2019*.
- Robertson, S., & Zaragoza, H. (2009). The Probabilistic Relevance Framework: BM25 and Beyond. *Foundations and Trends in IR*, 3(4), 333–389.
- Lewis, P. et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. *NeurIPS 2020*.

**Cognitive Load and Pedagogy**
- Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. *Cognitive Science*, 12(2), 257–285.
- Paas, F., Renkl, A., & Sweller, J. (2003). Cognitive Load Theory and Instructional Design. *Educational Psychologist*, 38(1), 1–4.
- Vygotsky, L. (1978). *Mind in Society*. Harvard University Press.
- Ladson-Billings, G. (1995). Toward a theory of culturally relevant pedagogy. *American Educational Research Journal*, 32(3), 465–491.

**Bloom's Taxonomy**
- Anderson, L. W., & Krathwohl, D. R. (2001). *A Taxonomy for Learning, Teaching, and Assessing*. Longman.

**Indian Education Context**
- ASER (2023). *Annual Status of Education Report*. Pratham Education Foundation.
- NTA (2024). Official syllabi for NEET, JEE Mains, CUET.

---

<div align="center">

```
نور
```

*Every child deserves a light on their path.*

*The 2.68 crore students who appear in NEET every year deserve to know what they don't know —
and to learn it in a language their world speaks.*

**Go build it.**

</div>