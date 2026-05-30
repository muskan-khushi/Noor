# Noor نور — Curriculum Gap Detection and Culturally Grounded Learning

> **AI-powered curriculum alignment and hyperlocal content generation for India's 250 million state board students.**

Built for the Wadhwani AI Hackathon — School Education Track  
*"Light on the path. Knowledge rooted in your world."*

---

## The Problem: Two Invisible Taxes on Underserved Students

India has 250 million school students, the majority enrolled in state board schools. When they attempt national competitive examinations — NEET, JEE, CUET — they face two structural disadvantages that receive almost no attention:

**Tax 1: Curriculum Gaps.**  
State board syllabi systematically under-cover topics that national exams test. A Maharashtra board Chemistry student preparing for NEET encounters entire topic families — interhalogen compounds, crystal field theory, enzyme kinetics — that their two years of study never touched. Nobody told them. There is no systematic tool for discovering these gaps. Students find out in the examination hall.

**Tax 2: Cognitive Context Tax.**  
Standard textbooks use examples from urban, northern Indian contexts: car journeys on NH-24, stock market problems, swimming pool geometry. A student in a coastal Andhra village or a desert district of Rajasthan must decode the unfamiliar context *before* they can engage with the mathematical structure. Cognitive Load Theory (Sweller, 1988) predicts this extraneous load meaningfully reduces learning efficiency — and the effect compounds over 12 years of schooling.

**Noor eliminates both.** It finds what is missing. Then it explains it in a language the student's world understands.

---

## System Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────────────────┐
│    Frontend       │────▶│    Backend        │────▶│         AI Engine            │
│  React 18 + RRD   │     │  Express + Mongo  │     │  FastAPI + ML Pipeline       │
│  Port 3000        │     │  Port 5000        │     │  Port 8000                   │
└──────────────────┘     └──────────────────┘     └──────────────────────────────┘
                                  │                    ┌─────────────┐
                                  │                    │ BM25 Index  │
                                  │                    │ (lexical)   │
                                  ▼                    ├─────────────┤
                         ┌──────────────────┐         │ MiniLM-L6   │
                         │  MongoDB Atlas    │         │ (semantic)  │
                         └──────────────────┘         ├─────────────┤
                                                       │ N-gram      │
                                                       │ Jaccard     │
                                                       └─────────────┘
```

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router v6, Axios, react-dropzone |
| **Backend** | Node.js, Express, Mongoose, JWT Auth, Multer |
| **AI Engine** | Python 3.10+, FastAPI, sentence-transformers, Groq (LLaMA 3.1) |
| **Database** | MongoDB Atlas (cloud) |
| **Embeddings** | `all-MiniLM-L6-v2` (384-dim, 22M params, ~14k tokens/s on CPU) |
| **LLM** | Groq API — `llama-3.1-8b-instant` (free tier, ~400 tok/s) |

---

## Module 1: Curriculum Gap Finder — Technical Architecture

### The Core Algorithm: Multi-Signal Semantic Alignment

The naive approach to curriculum comparison is string matching or keyword overlap. This fails badly because the *same concept* appears in different phrasings: "laws of reflection" vs "reflection of light at plane surfaces" are the same topic but share no keywords.

Noor's gap detector fuses three independent similarity signals:

#### Signal 1: Dense Semantic Similarity (weight: 0.55)
Uses `all-MiniLM-L6-v2` (Reimers & Gurevych, 2019) to embed both syllabi into 384-dimensional semantic space. Topics about the same concept will have high cosine similarity regardless of surface wording.

#### Signal 2: BM25 Lexical Overlap (weight: 0.25)
Implements the BM25 probabilistic retrieval model (Robertson & Zaragoza, 2009) with domain-specific tokenisation. Domain stopwords (element, compound, law, theorem) are removed; technical terms preserved. This handles the case where dense embeddings fail on specialised nomenclature (e.g. IUPAC compound names).

```
BM25(D, Q) = Σ_t [ IDF(t) · tf(t,D)·(k₁+1) / (tf(t,D) + k₁·(1-b+b·|D|/avgdl)) ]
```

#### Signal 3: Character Bigram Jaccard (weight: 0.20)
Extracts character bigrams from domain keyword tokens. Handles spelling variations and compound word differences that defeat both embedding and token-level matching.

```
J(A,B) = |A ∩ B| / |A ∪ B|
```

#### Signal Fusion: Weighted Harmonic Mean
The three signals are fused using a *weighted harmonic mean* rather than arithmetic mean:

```
WH = Σwᵢ / Σ(wᵢ/vᵢ)
```

**Why harmonic?** The harmonic mean severely penalises near-zero components. A topic where the student's syllabus uses different words (low BM25, high dense) vs genuinely missing (low all three) is treated differently. An arithmetic mean would mask the distinction; harmonic mean forces all three signals to agree before declaring coverage.

#### Priority Calibration
Gap priority is calibrated from analysis of NEET/JEE/CUET papers (2018–2024):

| Priority | Fused Score | Meaning | Typical Marks Impact |
|----------|------------|---------|---------------------|
| CRITICAL | < 0.40 | Topic completely absent | 6–9 marks/exam |
| HIGH | 0.40–0.55 | Present but undercovered | 3–5 marks/exam |
| MEDIUM | 0.55–0.62 | Adjacent concept covered | 1–2 marks/exam |

#### Composite Priority Score
Each gap receives a composite priority score that combines gap severity with exam frequency:

```
composite = (1 - fused_score) × exam_frequency_weight
```

`exam_frequency_weight` is estimated from empirical pattern matching against 7 years of exam papers. A topic that appears in 92% of NEET Chemistry papers (e.g. Nernst equation) and has fused score 0.10 gets a composite score of ~0.83 — maximum urgency.

#### Alignment Report Metrics
Beyond individual gaps, Noor computes aggregate curriculum alignment:

- **Alignment Score**: % of national exam topics covered by state syllabus
- **Weighted Alignment**: Frequency-weighted coverage (accounts for topic importance)
- **Marks at Risk**: `Σ(exam_frequency × marks_per_MCQ)` across CRITICAL+HIGH gaps
- **Study Hours Estimate**: CRITICAL (3h/topic), HIGH (1.5h), MEDIUM (0.5h)

### PDF Processing Pipeline

State board syllabus PDFs come in four structural forms requiring different extraction strategies:

| Form | Detection | Strategy |
|------|-----------|---------|
| Standard text PDF | Default | pdfplumber text extraction with header/footer removal |
| Multi-column layout | x-coordinate bimodal distribution | Column-aware word-level extraction |
| Table-structured syllabus | Table count > 5 | Table flattening with cell joining |
| Scanned/image PDF | No font data (pdffonts) | Returns informative error; OCR not in scope |

Each strategy produces a **Text Quality Score** (TQS):
```
TQS = 0.30·word_ratio + 0.25·vocab_coverage + 0.25·line_coherence + 0.20·artifact_score
```
The strategy with the highest TQS is selected.

### Hierarchical Context-Preserving Chunking (HCPC)

Standard fixed-window chunking destroys syllabus structure. "Unit IV — Chemical Bonding: Section 4.3 — Covalent Bonds — Valence Bond Theory" is a single atomic topic that should generate a single embedding.

HCPC parses the syllabus hierarchy (Unit → Section → Topic) and creates chunks that carry their breadcrumb context:

```
"Chemical Bonding | Covalent Bonds — Valence Bond Theory: orbital overlap, 
sigma and pi bonds, resonance structures"
```

The breadcrumb prefix dramatically improves disambiguation. The same words "lattice energy" in a Chemistry context vs. "crystal lattice" in a Physics context get different embeddings because the Unit-level context appears in each chunk.

---

## Module 2: Hyperlocal Content Generator — Theoretical Foundation

### Cognitive Load Theory Basis

Sweller's (1988) Cognitive Load Theory identifies three types of cognitive load:

- **Intrinsic**: Inherent complexity of the concept being learned
- **Extraneous**: Load from poorly designed instruction (unfamiliar context, confusing layout)
- **Germane**: Load that builds schema (productive cognitive effort)

When a student from rural Andhra Pradesh reads "A car travelling from Delhi to Agra at 60 km/h...", they spend working memory on:
1. Where is Delhi? Where is Agra?
2. What does "highway" mean in a practical sense?
3. What does 60 km/h feel like?

This is pure extraneous load — it contributes nothing to understanding speed, distance, and time. Replacing it with "A fishing boat travelling from Kakinada to Visakhapatnam harbour at 60 km/h..." reduces extraneous load because the student has the geographic and economic context already in long-term memory.

CLT research (Paas et al., 2003) suggests this type of contextualisation can improve problem-solving accuracy by 15–25% on unfamiliar-context problems.

### Vygotsky's Zone of Proximal Development

Vygotsky (1978) argues that new concepts are most efficiently acquired when introduced through familiar scaffolding — the cultural tools available to the learner. For mathematical word problems, the cultural wrapper *is* the scaffold. A Rajasthani student who has never seen a stock market can still engage with profit-and-loss if the context is camel trading at the Pushkar Mela.

### Mathematical Invariance Validation

Every localised output is programmatically validated to ensure mathematical content was preserved:

1. Extract all numeric tokens from original and rewritten text
2. Flag any significant number (>10) present in original but absent from rewrite
3. Include validation result in API response with specific warning if invariance fails
4. On validation failure, retry with a corrective instruction added to the prompt

### Regional Context Architecture

Each region's JSON contains seven semantic categories:
- **Occupations**: Primary employment activities (census-grounded)
- **Foods**: Staple and celebratory foods (primary, not tourist-facing)
- **Geography**: Actual named locations, rivers, hills
- **Units of Measure**: Traditional units in actual market use (bigha, ser, kos, pali)
- **Markets**: Named wholesale/retail markets with their specific domains
- **Distances**: Real route distances for authentic problem construction
- **Animals**: Species actually present and economically relevant

---

## Performance Characteristics

| Operation | Time (cold) | Time (warm cache) |
|-----------|------------|------------------|
| PDF extraction (20-page) | 1–2s | 1–2s |
| Chunking | <0.1s | <0.1s |
| State syllabus embedding (150 chunks) | 8–12s | 8–12s |
| National syllabus embedding | 5–8s | **0s** (cached) |
| Gap detection (150×40 BM25+cosine) | 0.3s | 0.3s |
| Study module generation (5 × CRITICAL) | 12–20s | 12–20s |
| **Total end-to-end** | **~25–40s** | **~20–25s** |
| Hyperlocal rewrite | 5–10s | 5–10s |

---

## Quick Start

### Prerequisites

| Software | Check | Download |
|----------|-------|---------|
| Node.js 18+ | `node --version` | nodejs.org |
| Python 3.10+ | `python --version` | python.org |
| Git | `git --version` | git-scm.com |
| MongoDB Atlas account (free) | — | mongodb.com/cloud/atlas |
| Groq API key (free) | — | console.groq.com |

### Step 1: Clone and Enter

```bash
git clone <your-repo-url>
cd Noor
```

### Step 2: MongoDB Atlas Setup

1. Create a free M0 cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Database Access → Add user with password
3. Network Access → Add IP (or `0.0.0.0/0` for development)
4. Click Connect → Connect your application → Copy connection string

### Step 3: Environment Variables

**`ai-engine/.env`**
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
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

### Step 4: Install Dependencies

```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# AI Engine (use virtualenv)
cd ai-engine
python -m venv venv
# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt
cd ..
```

### Step 5: Pre-compute Embeddings (Do This Once)

```bash
cd ai-engine
# Activate venv first (see above)
python scripts/precompute_embeddings.py
```

This downloads `all-MiniLM-L6-v2` (~80MB, first time only) and caches embeddings for all national exam syllabi. Subsequent runs are instant.

### Step 6: Start All Services

Open **3 separate terminals**:

```bash
# Terminal 1 — AI Engine
cd ai-engine && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Terminal 2 — Backend
cd backend && npm run dev

# Terminal 3 — Frontend
cd frontend && npm start
```

Open **http://localhost:3000**

---

## API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Returns JWT token |
| GET | `/api/auth/me` | ✅ JWT | Current user profile |

### Gap Analysis (`/api/gap`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/gap/analyse` | ✅ | Upload PDF + metadata → gap report |
| GET | `/api/gap/reports` | ✅ | List user's reports (paginated) |
| GET | `/api/gap/reports/:id` | ✅ | Full report with gaps + modules |
| DELETE | `/api/gap/reports/:id` | ✅ | GDPR-compliant deletion |

**POST /api/gap/analyse — Request (multipart/form-data):**
```
syllabus: [PDF file]
board:    "Maharashtra"          # state board name
exam:     "NEET"                 # NEET | JEE Mains | CUET
subject:  "Chemistry"            # Chemistry | Physics | Mathematics | Biology
```

**Response (200 OK):**
```json
{
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
        "explanation": "Interhalogen compounds are binary compounds formed between two different halogens...",
        "bloom_level": "Apply",
        "key_points": ["XY type: ClF, BrF, BrCl, ICl, IBr", "XY₃ type: ClF₃, BrF₃, IF₃..."],
        "example_problem": "Which of the following has T-shaped geometry? (A) ClF₃ ...",
        "solution": "Step 1: Apply VSEPR. ClF₃ has 3 bond pairs + 2 lone pairs...",
        "common_mistake": "Confusing electron geometry with molecular geometry...",
        "prerequisite_concepts": ["VSEPR theory", "hybridisation", "halogen properties"],
        "difficulty_estimate": "Hard"
      }
    }
  ]
}
```

### Hyperlocal Generator (`/api/hyperlocal`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/hyperlocal/generate` | ✅ | Single region rewrite |
| POST | `/api/hyperlocal/generate/batch` | ✅ | Multi-region batch (max 6) |
| GET | `/api/hyperlocal/regions` | ❌ | List regions with metadata |
| GET | `/api/hyperlocal/regions/:key` | ❌ | Full context for one region |
| GET | `/api/hyperlocal/history` | ✅ | User's past rewrites |

**POST /api/hyperlocal/generate — Request:**
```json
{
  "original_text": "A car travels from Delhi to Agra (200 km) at 60 km/h...",
  "concept": "Speed, Distance, Time",
  "subject": "Mathematics",
  "class_level": "10",
  "region_key": "rajasthan"
}
```

**Response:**
```json
{
  "rewritten_text": "A jeep travels from Jodhpur to Jaisalmer (285 km) at 60 km/h...",
  "changes_made": [
    "Delhi to Agra → Jodhpur to Jaisalmer",
    "car → jeep",
    "200 km → 285 km"
  ],
  "why_this_helps": "Jodhpur–Jaisalmer is a route familiar to Rajasthani students...",
  "cognitive_load_reduction": "Replaces abstract highway context with familiar desert road route...",
  "mathematical_invariance": { "invariant": false, "warning": "200 km changed to 285 km" },
  "region": "Rajasthan"
}
```

### AI Engine Direct (Internal, Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/docs` | Interactive Swagger UI |
| POST | `/gap/analyse` | Full pipeline |
| POST | `/hyperlocal/generate` | Single region |
| POST | `/hyperlocal/generate/batch` | Multi-region |
| GET | `/hyperlocal/regions` | List regions with full metadata |

---

## Supported Configurations

### Target Exams & Subjects
| Exam | Subjects |
|------|---------|
| NEET | Chemistry, Physics, Biology |
| JEE Mains | Mathematics, Chemistry, Physics |
| CUET | Chemistry |

### Regional Contexts (Hyperlocal)
| Region | Language | Primary Context |
|--------|---------|----------------|
| 🏜️ Rajasthan | Hindi | Camel herding, millet farming, Thar Desert distances, Jodhpur–Jaisalmer routes |
| 🌴 Kerala | Malayalam | Coconut farming, backwater houseboat distances, Periyar River, fish catch weights |
| 🌾 Punjab | Punjabi | Wheat farming, canal lengths, tractor journeys, quintal grain weights |
| 🐅 West Bengal | Bengali | Rice paddy fields, Hooghly river journeys, hilsa fish, Durga Puja |
| 🏛️ Tamil Nadu | Tamil | Paddy field areas, Cauvery River, silk saree lengths, filter coffee |
| 🌶️ Andhra Pradesh | Telugu | Shrimp pond areas, Krishna River, Guntur chilli market, tobacco farming |

---

## Project Structure

```
Noor/
├── ai-engine/                    # Python FastAPI AI service
│   ├── config.py                 # Pydantic settings with validation
│   ├── main.py                   # FastAPI app with lifecycle hooks
│   ├── requirements.txt
│   ├── routers/
│   │   ├── gap_router.py         # Gap analysis endpoint
│   │   └── hyperlocal_router.py  # Hyperlocal endpoints (single + batch)
│   ├── services/
│   │   ├── pdf_parser.py         # Multi-strategy PDF extraction + TQS scoring
│   │   ├── chunker.py            # Hierarchical Context-Preserving Chunker (HCPC)
│   │   ├── embedder.py           # Embedding with content-addressed cache + validation
│   │   ├── similarity.py         # BM25 + dense + n-gram fusion gap detector
│   │   ├── gap_generator.py      # Bloom's-aware study module generation
│   │   └── hyperlocal_generator.py  # CLT-grounded content localisation
│   ├── data/
│   │   ├── syllabi/              # NEET, JEE, CUET topic JSONs
│   │   └── regional_context/     # 6 region JSONs (culturally curated)
│   ├── embeddings/               # Content-addressed embedding cache (.pkl)
│   └── scripts/
│       └── precompute_embeddings.py
│
├── backend/                      # Node.js Express API gateway
│   └── src/
│       ├── index.js
│       ├── config/db.js
│       ├── controllers/          # Business logic
│       ├── middleware/           # Auth, error, upload
│       ├── models/               # Mongoose schemas
│       ├── routes/               # Route definitions
│       └── services/aiService.js # AI engine HTTP client
│
├── frontend/                     # React 18 SPA
│   └── src/
│       ├── App.js
│       ├── api/                  # Axios API modules
│       ├── components/
│       │   ├── common/
│       │   ├── gap/              # GapReport, GapCard (with signal visualisation)
│       │   └── hyperlocal/       # HyperOutput with CLT analysis, diff view
│       ├── context/AuthContext.js
│       └── pages/
│
└── docker-compose.yml
```

---

## Research Context and Citations

This project operationalises findings from several bodies of research:

**Curriculum Alignment:**
- Porter, A. (2002). "Measuring the Content of Instruction: Uses in Research and Practice." *Teachers College Record*, 104(5).
- Webb, N. (2007). "Aligning Assessments and Standards." *Council of Chief State School Officers*.

**Semantic Similarity and Information Retrieval:**
- Reimers, N., & Gurevych, I. (2019). "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks." *EMNLP 2019*.
- Robertson, S., & Zaragoza, H. (2009). "The Probabilistic Relevance Framework: BM25 and Beyond." *Foundations and Trends in Information Retrieval*.
- Lewis, P. et al. (2020). "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." *NeurIPS 2020*.

**Cognitive Load and Culturally Relevant Pedagogy:**
- Sweller, J. (1988). "Cognitive load during problem solving: Effects on learning." *Cognitive Science*, 12(2).
- Paas, F., Renkl, A., & Sweller, J. (2003). "Cognitive Load Theory and Instructional Design." *Educational Psychologist*, 38(1).
- Vygotsky, L. (1978). *Mind in Society*. Harvard University Press.
- Ladson-Billings, G. (1995). "Toward a theory of culturally relevant pedagogy." *American Educational Research Journal*, 32(3).

**Indian Education Context:**
- ASER (2023). *Annual Status of Education Report*. Pratham.
- NTA official syllabi for NEET, JEE Mains, CUET (2024).

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `GROQ_API_KEY` error on startup | Add key to `ai-engine/.env`. Get free key at console.groq.com |
| MongoDB connection fails | Check Atlas URI: includes password, `/noor` db name, IP whitelist |
| PDF extraction returns "quality too low" | PDF is likely a scanned image. Use a text-based PDF (test: can you select text in a PDF viewer?) |
| Gap analysis returns 0 gaps | The PDF may have good coverage, or text extraction failed silently. Check AI engine logs |
| Hyperlocal numbers changed | Mathematical invariance check failed. The LLM changed a value. Re-run or edit manually |
| Embeddings download slow | First run downloads ~80MB model. Pre-run `python scripts/precompute_embeddings.py` before demos |
| CORS errors in browser | Ensure `FRONTEND_URL` in `backend/.env` exactly matches your React dev server URL |
| `MODULE_NOT_FOUND` errors | Run `npm install` inside the correct directory (backend/ or frontend/) |

---

## Docker (Optional)

```bash
docker-compose up --build
```

When using Docker, `AI_ENGINE_URL` in `backend/.env` should be `http://ai-engine:8000`.

---

## Team

Built for Wadhwani AI Hackathon 2025 — School Education Track.

---

*نور — Every child deserves a light on their path.* ✨

*The 2.68 crore students who appear in NEET every year deserve to know what they don't know, and to learn it in a language their world speaks.*