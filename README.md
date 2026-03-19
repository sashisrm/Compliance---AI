# ComplianceAI

A web-based compliance assessment and GRC (Governance, Risk & Compliance) platform built with React 19, TypeScript, and Vite. It helps organisations evaluate their security and regulatory posture across 12 frameworks — including Responsible AI, the EU AI Act, and the EU Cyber Resilience Act — through a guided multi-step assessment wizard, and provides **RAG-powered AI Skills** for deep compliance analysis backed by a user-controlled knowledge base.

> For a full technical deep-dive, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Features

| Capability | Description |
|------------|-------------|
| **Assessment Wizard** | 5-step guided flow — business profile, IT/OT scope, framework selection, control questionnaire, review |
| **12 Compliance Frameworks** | Cybersecurity, data protection, AI governance, and cyber resilience |
| **Smart Recommendations** | Business-type and region-aware framework selection |
| **Gap Analysis** | Prioritised findings with remediation roadmaps |
| **Assessment History** | Track and compare results over time (LocalStorage) |
| **Export** | PDF and ZIP report downloads |
| **Framework Library** | Browse all frameworks, domains, and controls |
| **Knowledge Base** | User-controlled RAG document index — upload, tag, search, manage |
| **AI Skills** | 5 BM25-powered skills with optional LLM synthesis (OpenAI / Anthropic) |

---

## Supported Frameworks

### Cybersecurity

| Framework | Version | Issuer | Controls |
|-----------|---------|--------|----------|
| NIST Cybersecurity Framework (CSF) | 2.0 | NIST | 42 |
| NIST SP 800-53 | Rev 5 | NIST | Multiple |
| ISO/IEC 27001 | 2022 | ISO/IEC | 36 |
| IEC 62443 (OT/ICS) | 2-1:2010 | IEC | 30 |

### Data Protection & Privacy

| Framework | Version | Issuer | Controls |
|-----------|---------|--------|----------|
| GDPR | 2018 | European Parliament | 24 |
| CCPA / CPRA | 2023 | California AG | 12 |
| HIPAA | 2013 (Omnibus) | US HHS | 20 |

### Financial & Trust

| Framework | Version | Issuer | Controls |
|-----------|---------|--------|----------|
| PCI DSS | 4.0 | PCI SSC | 32 |
| SOC 2 | 2017/2022 | AICPA | 20 |

### AI Governance & Compliance

| Framework | Version | Issuer | Controls |
|-----------|---------|--------|----------|
| Responsible AI Framework | 1.0 (2023) | NIST / OECD | 32 |
| EU AI Act | 2024/1689 | European Parliament & Council | 36 |
| EU Cyber Resilience Act (CRA) | 2024/2847 | European Parliament & Council | 34 |

---

## AI & Cyber Resilience Frameworks in Detail

### Responsible AI Framework
Aligned with the **NIST AI Risk Management Framework (AI RMF) 1.0** and OECD AI Principles:

- **GOVERN** — AI risk policy, model inventory, workforce training, third-party AI risk
- **MAP** — Risk categorisation, stakeholder impact analysis, prohibited use cases
- **MEASURE** — Bias/fairness testing, explainability (XAI), adversarial robustness, privacy-in-AI
- **MANAGE** — Human-in-the-loop oversight, AI incident response, model lifecycle, drift monitoring

### EU AI Act (Regulation 2024/1689)
Risk-based EU regulation covering all AI systems placed on or used within the EU market:

- **Prohibited Practices** (Art. 5) — subliminal manipulation, social scoring, real-time biometric identification bans
- **High-Risk AI Requirements** (Title III) — risk management, data governance, technical documentation, audit logging, transparency, human oversight, accuracy & robustness
- **Transparency Obligations** (Art. 50) — mandatory AI disclosure to users, deepfake/synthetic content labelling
- **GPAI Models** (Title V) — model cards, systemic risk obligations (≥10²³ FLOP threshold)
- **Conformity Assessment** (Art. 43-49) — CE marking, EU Declaration of Conformity, public database registration
- **Post-Market Monitoring** (Art. 72-73) — monitoring plans, 15-day serious incident reporting

### EU Cyber Resilience Act (Regulation 2024/2847)
Horizontal cybersecurity requirements for all **products with digital elements** sold in the EU:

- **Essential Requirements — Design** (Annex I, Pt. I) — secure by design/default, authentication, encryption, integrity, DoS resilience, attack surface minimisation, security logging
- **Vulnerability Handling** (Annex I, Pt. II) — SBOM, remediation SLAs, coordinated disclosure (CVD/security.txt), support period commitments
- **Incident & Vulnerability Reporting** (Art. 14) — 24-hour notification to ENISA/national CSIRT
- **Conformity Assessment** (Art. 28-38) — CE marking, supply chain due diligence, user security instructions
- **Market Surveillance** (Art. 50-64) — authority cooperation, EU authorised representative requirement

---

## RAG-Powered Knowledge Base & AI Skills

### Architecture Overview

```
User Query
    │
    ▼
┌─────────────────────────────────────────────┐
│  SKILL LAYER  (what to do)                  │
│  FrameworkAnalysis / GapEnrichment /        │
│  CrossFramework / ControlSearch /           │
│  RemediationGuide                           │
└──────────────┬──────────────────────────────┘
               │  skill calls BM25 retriever
               ▼
┌─────────────────────────────────────────────┐
│  PAGE INDEX LAYER  (where knowledge lives)  │
│                                             │
│  IndexedDB (browser-native, persistent)     │
│  ├── Built-in: 12 framework control sets   │
│  ├── User doc 1  → page chunks [1..n]      │
│  ├── User doc 2  → page chunks [1..n]      │
│  └── ...                                    │
└──────────────┬──────────────────────────────┘
               │  returns ranked page chunks
               ▼
┌─────────────────────────────────────────────┐
│  SYNTHESIS                                  │
│  Template-based (always available)          │
│  + optional LLM (OpenAI / Anthropic)        │
└─────────────────────────────────────────────┘
```

### Page Indexing

Documents are split into **~800-character page chunks** on natural paragraph boundaries. Each chunk carries:

- Source title and document ID
- Page number (1-based within the document)
- Framework tag (optional — links chunk to a specific framework)
- Custom tags for filtering

All 12 built-in frameworks are **auto-indexed on startup** from the TypeScript control data. User uploads are persisted in **IndexedDB** and survive page reloads.

### BM25 Retrieval

Retrieval uses a **pure-JS BM25** implementation — no ML model or embedding API required:

- Stop-word filtering
- Per-term IDF caching for performance
- Sentence-level highlight extraction
- Optional filters: `frameworkFilter`, `typeFilter`, `tagFilter`, `topK`

### AI Skills

Five skills are available from the **AI Skills** page:

| Skill | Input | Output |
|-------|-------|--------|
| **Framework Analysis** | Any of the 12 frameworks | Domain breakdown, control counts, KB references |
| **Gap Enrichment** | A completed assessment | Prioritised remediation roadmap with KB-sourced guidance |
| **Cross-Framework** | Two frameworks | Overlap analysis, unique requirements, dual-compliance strategy |
| **Control Search** | Free-text query + optional framework filter | Ranked relevant controls and document passages |
| **Remediation Guide** | A specific gap from an assessment | Step-by-step implementation guide with evidence requirements |

All skills operate in **template mode** without an API key. Configure OpenAI or Anthropic in **Knowledge Base → AI Settings** to enable LLM-synthesised output.

### Document Configurability

The knowledge base is fully user-controlled:

| Action | How |
|--------|-----|
| Upload `.txt` / `.md` files | Knowledge Base → Add Document → Upload File |
| Paste regulatory text | Knowledge Base → Add Document → Paste Text |
| Tag to a framework | Select from the framework dropdown at upload time |
| Add custom tags | Comma-separated tag field |
| Search indexed content | Knowledge Base → Search (BM25, with scores and highlights) |
| Delete a document | Knowledge Base → Documents → trash icon |
| Configure LLM | Knowledge Base → AI Settings (key stored locally only) |

Built-in framework documents are read-only and always present; user documents are additive.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Assessment Persistence | Browser LocalStorage |
| Knowledge Base Storage | Browser IndexedDB |
| Retrieval Engine | BM25 (pure JS — no ML dependencies) |
| LLM Synthesis | OpenAI API / Anthropic API (optional, user-configured) |
| Export | PDF (jsPDF) / ZIP (JSZip) |

---

## Project Structure

```
src/
├── components/
│   ├── layout/               # AppShell, navigation (with AI/RAG section)
│   └── wizard/
│       └── steps/            # Step1–Step5 wizard components
├── context/
│   ├── AppContext.tsx         # Page navigation state
│   ├── HistoryContext.tsx     # Assessment history
│   └── RAGContext.tsx         # Knowledge base, BM25 index, skills orchestration
├── data/
│   ├── frameworks/            # One TypeScript file per framework
│   │   ├── nist-csf.ts
│   │   ├── nist-800-53.ts
│   │   ├── iso-27001.ts
│   │   ├── gdpr.ts
│   │   ├── pci-dss.ts
│   │   ├── iec-62443.ts
│   │   ├── hipaa.ts
│   │   ├── soc2.ts
│   │   ├── ccpa.ts
│   │   ├── responsible-ai.ts
│   │   ├── eu-ai-act.ts
│   │   ├── cra.ts
│   │   └── index.ts           # Registry & exports
│   ├── business-profiles.ts   # Business type × region → framework matrix
│   └── cloud-requirements/    # AWS, Azure, GCP security requirements
├── pages/
│   ├── HomePage.tsx
│   ├── FrameworksPage.tsx
│   ├── ReportPage.tsx
│   ├── HistoryPage.tsx
│   ├── KnowledgeBasePage.tsx  # Document management, search, AI settings
│   └── SkillsPage.tsx         # AI Skills panel with result display
├── services/
│   ├── rag/
│   │   ├── types.ts           # KnowledgeDocument, PageChunk, RetrievalResult, LLMConfig
│   │   ├── DocumentStore.ts   # IndexedDB persistence for documents and chunks
│   │   ├── PageIndexer.ts     # Text → page chunks; built-in framework auto-indexer
│   │   ├── BM25Retriever.ts   # BM25 scoring, stop-word filter, highlight extraction
│   │   └── RAGEngine.ts       # Index management, search, optional LLM synthesis
│   └── skills/
│       ├── types.ts           # SkillResult, SkillId, parameter types
│       └── skills.ts          # All 5 skill implementations
├── types/
│   ├── frameworks.ts
│   ├── filters.ts
│   └── assessment.ts
└── utils/
    ├── scoring.ts
    └── exportUtils.ts
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Run Locally

```bash
# Clone the repository
git clone https://github.com/sashisrm/Compliance---AI.git
cd Compliance---AI

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173** in your browser.

### Other Commands

```bash
# Type-check
npx tsc --noEmit

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Business Type Coverage

| Business Type | Key Frameworks |
|---------------|---------------|
| BFSI | GDPR, PCI DSS, EU AI Act, CRA, Responsible AI, NIST CSF |
| Insurance | GDPR, EU AI Act, Responsible AI, HIPAA (NA), ISO 27001 |
| Healthcare | HIPAA (NA), GDPR, EU AI Act (Annex III), CRA, Responsible AI |
| Industrial Automation | IEC 62443, CRA, NIST CSF, ISO 27001 |
| Telecom | GDPR, CRA, EU AI Act, ISO 27001, NIST CSF |
| Digital Media | GDPR, EU AI Act, Responsible AI, CCPA, SOC 2 |
| Retail | GDPR, PCI DSS, CRA, EU AI Act, CCPA |
| Government | NIST 800-53, EU AI Act, CRA, Responsible AI, GDPR |

---

## Region Mandatory Frameworks

| Region | Mandatory |
|--------|-----------|
| European Union | GDPR, EU AI Act, EU CRA |
| United Kingdom | GDPR (UK) |
| North America | CCPA |

---

## Production Readiness

> **Status: Feature-complete prototype — not yet production-ready.**

### What is production-ready

| Area | Status |
|------|--------|
| Assessment engine & scoring | Ready |
| BM25 RAG retrieval | Ready |
| 12 frameworks / 300+ controls | Ready |
| PDF / ZIP export | Ready |
| TypeScript strict mode, no XSS/injection | Ready |

### Critical blockers before customer-facing launch

| Issue | Risk | Priority |
|-------|------|----------|
| API keys stored unencrypted in `localStorage` | Credential theft via DevTools or XSS | **Critical** |
| Zero automated tests | Undetected regressions in scoring, RAG, export | **Critical** |
| No error logging / monitoring | Production failures are invisible | **High** |
| No rate-limiting on LLM calls | API cost abuse / unexpected billing | **High** |
| IndexedDB quota not handled | App silently fails when browser storage is full | **Medium** |

### Recommended use by audience

| Audience | Recommendation |
|----------|----------------|
| Personal / internal use | Ready to use |
| Beta / demo | Ready — warn users about API key storage |
| Customer-facing production | Address critical blockers first |

### Roadmap to production

1. **Backend proxy for LLM calls** — removes API key exposure entirely (biggest single improvement)
2. **Automated tests** — unit tests for scoring, RAG retrieval, and export (target 50%+ coverage)
3. **Error tracking** — integrate Sentry or equivalent
4. **Rate-limiting** — client-side throttle on LLM synthesis calls
5. **Storage quota handling** — detect and surface IndexedDB quota errors to users
6. **CSP headers** — Content Security Policy for deployment server
7. **CI/CD pipeline** — automated build, type-check, and test on every push
