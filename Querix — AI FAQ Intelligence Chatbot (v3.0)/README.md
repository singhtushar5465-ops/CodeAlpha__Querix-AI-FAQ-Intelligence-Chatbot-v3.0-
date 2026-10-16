# Querix — AI FAQ Intelligence Chatbot (v3.0)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-TF--IDF-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![Web Speech API](https://img.shields.io/badge/Jarvix-Voice%20Agent-6C5CE7)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://www.python.org/)

**Querix (v3.0)** is an enterprise-grade AI FAQ Intelligence chatbot upgraded from *Antigravity FAQ Intelligence v2.0*. It combines advanced NLP text preprocessing, TF-IDF vectorization with cosine similarity matching, fallback intent detection, the **Jarvix** multi-lingual voice agent (with acoustic barge-in and 4-state 3D/canvas orb), a live token usage meter, JWT authentication, tiered subscription plans, and real-time custom dataset ingestion.

---

## 🌟 Key Features

### 1. NLP Knowledge & Similarity Engine
- **Curated Dataset (`faqs.json`)**: 65+ comprehensive Q&A pairs covering 7 domains:
  1. *General*
  2. *Product Help*
  3. *Billing & Plans*
  4. *Technical Support*
  5. *Account & Security*
  6. *Shipping & Orders*
  7. *Returns & Refunds*
- **Text Normalization**: Lowercasing, punctuation stripping, tokenization, stopword removal, and rule-based lemmatization.
- **Dual-Stage Matching**: TF-IDF vectorization with cosine similarity matching + regex intent classifier fallback.
- **Confidence Threshold (0.35)**:
  - Match score $\ge 0.35$: Returns direct answer bubble with confidence percentage, topic, and related question chips.
  - Match score $< 0.35$: Automatically displays *"I'm not completely sure, did you mean...?"* with top 3 closest suggested questions and a *"Contact Specialist Support"* button.

### 2. Jarvix Voice Agent (Full-Screen Voice Mode)
- **4-State Harmonic Voice Orb**:
  - `IDLE`: Gentle rhythmic breathing glow.
  - `LISTENING`: Multi-frequency harmonic reactive wave rings.
  - `THINKING`: Rapid particle swirling vortex.
  - `SPEAKING`: Radiant pulsing audio expansion.
- **Speech-to-Text**: Web Speech API (`SpeechRecognition`) supporting English (US/India), Hindi, and Hinglish.
- **Text-to-Speech**: Web Speech API (`speechSynthesis`) with customizable voice speed (0.9x–1.15x) and auto-read toggle.
- **Acoustic Barge-In**: User can speak or tap the orb mid-answer to immediately interrupt speech and ask a new question.

### 3. Authentication & Guest Mode
- **Guest Mode**: Allows 5 free queries before presenting a gentle signup prompt.
- **Email + Password**: Salted bcrypt hashing with JWT session stored in HTTP-only cookies.
- **Google OAuth**: Fast one-click authentication simulation.
- **Profile Management**: Profile name/email, avatar, chat history export (JSON), and GDPR permanent account deletion.

### 4. Token Meter & Usage Accounting
- Real-time sidebar token meter displaying current consumption vs. monthly quota.
- **Visual Color Alerts**:
  - Blue/Cyan: Normal usage ($< 70\%$)
  - Amber Warning: Approaching quota ($70\% - 89\%$)
  - Coral Alert: Soft-block threshold ($\ge 90\%$)
- **Usage Ledger Modal**: Tabular transaction history with query, timestamp, token cost, and query type (Text vs Voice).
- **Soft-Block Protection**: At 100%, users can purchase a top-up booster or upgrade without losing active data.

### 5. Plans & Monetization
| Tier | Price | Monthly Tokens | Extras |
|---|---|---|---|
| **Free** | ₹0 | 10,000 | Text chat, basic Jarvix voice, 0.35 threshold |
| **Pro** | ₹499/mo | 500,000 | Priority NLP, full voice with barge-in, history export, custom FAQ uploads |
| **Business** | ₹1,999/mo | 3,000,000 | Developer REST API, 5 team seats, white-label, 99.9% uptime SLA |
- **Billing Frequency Switch**: Monthly vs Yearly (Annual plan gives 2 months free).
- **Top-Up Pack**: Instant +100,000 token booster pack for ₹99.

### 6. Admin Analytics & Custom FAQ Ingestion
- Real-time KPI analytics (total queries, average confidence, satisfaction rate).
- Top 5 most asked questions and unanswered / low-confidence query tracking.
- **Dynamic FAQ Upload**: Drag-and-drop CSV or JSON files for instant ingestion and real-time TF-IDF vectorizer retraining without server restarts!

### 7. Modern UI/UX Design System
- **Typography**: Space Grotesk (Brand/Headings), Inter (Body/Chat), JetBrains Mono (Tokens/Code).
- **Aesthetic**: Premium glassmorphism panels, soft ambient gradients, micro-animations (150–250ms).
- **Theme**: Instant Dark/Light mode switch with local storage persistence.
- **Command Palette (`Ctrl+K`)**: Fast access to all application actions and navigation.
- **Shortcuts**: `/` focuses chat prompt, `Ctrl+M` triggers Jarvix, `Ctrl+J` starts new session.

---

## 📂 Project Architecture

```
Querix — AI FAQ Intelligence Chatbot (v3.0)/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI endpoints, static mounting, auth & billing
│   │   ├── nlp_engine.py      # TF-IDF, Cosine Similarity, Lemmatizer & Intent matching
│   │   ├── database.py        # SQLite schema (users, ledger, history, feedback)
│   │   ├── auth.py            # JWT token encoding/decoding & bcrypt hashing
│   │   └── faqs.json          # 65+ curated FAQs across 7 core topics
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── index.html             # Application markup, preloader, voice modal & dialogs
│   ├── style.css              # Custom design system tokens, glassmorphism & responsive styles
│   ├── app.js                 # Frontend state, speech engine, canvas orb & API bridge
│   └── package.json           # Frontend configuration
├── .env.example               # Environment variables template
├── demo_script.md             # Step-by-step showcase script
└── README.md                  # Comprehensive documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- Modern Web Browser (Google Chrome, Microsoft Edge, Brave, Safari)

### 1. Installation
Clone or navigate to the repository folder:
```bash
cd "Querix — AI FAQ Intelligence Chatbot (v3.0)"
```

Install backend dependencies:
```bash
pip install -r backend/requirements.txt
```

### 2. Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```

### 3. Launching Querix
Start the FastAPI application with Uvicorn:
```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Open your browser and navigate to:
```
http://localhost:8000
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Processes text/voice query, performs NLP match, calculates token usage |
| `GET` | `/api/faqs` | Retrieves topic list and starter questions |
| `POST` | `/api/auth/signup` | Registers new user, returns JWT and allocates 10,000 tokens |
| `POST` | `/api/auth/login` | Authenticates existing user and generates session cookie |
| `GET` | `/api/auth/me` | Retrieves current session profile and quota |
| `POST` | `/api/auth/logout` | Clears authentication session cookie |
| `GET` | `/api/usage` | Returns token ledger history, limits, and usage percentage |
| `POST` | `/api/billing/upgrade`| Upgrades subscription tier (Pro: 500K, Business: 3M) |
| `POST` | `/api/billing/topup` | Grants +100,000 token booster pack for ₹99 |
| `POST` | `/api/faq/upload` | Ingests CSV/JSON dataset and retrains TF-IDF model |
| `GET` | `/api/admin/analytics`| Returns system query metrics, top questions, and satisfaction score |
| `POST` | `/api/feedback` | Saves 👍 / 👎 rating for an answer |
| `GET` | `/api/history` | Fetches saved chat logs |
| `DELETE`| `/api/account` | Permanently deletes account and personal records (GDPR compliance) |

---

## 🧪 Acceptance Testing Verification

- [x] **Preloader**: Displays centered Querix glyph with pulsing glow, status transitions, and smooth fade-out within 2.1s (skippable via button or Esc).
- [x] **NLP Match**: Typing *"how do I get my money back"* returns the Returns & Refunds FAQ answer with 85.5% confidence score and related questions.
- [x] **Confidence Threshold (0.35)**: Queries below 35% trigger *"I'm not sure, did you mean...?"* with 3 suggested questions and support button.
- [x] **Jarvix Voice Agent**: Real-time microphone listening, 4-state visual Canvas orb, TTS answer recitation, and acoustic barge-in interruption.
- [x] **Authentication**: Sign up creates user, hashes password with bcrypt, generates JWT, and unlocks 10,000 monthly tokens.
- [x] **Live Token Meter**: Progressively updates with text/voice query tokens, changing color at 70% (amber) and 90% (red).
- [x] **Tier Upgrade**: Upgrading to Pro instantly raises the token quota to 500,000 tokens.
- [x] **Responsive & Accessible**: Works across mobile drawers and desktop, supports light/dark themes and keyboard shortcuts (`/`, `Ctrl+K`, `Ctrl+M`).

---

## 📄 License
Querix v3.0 is built under the MIT License.
