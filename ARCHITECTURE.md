# ComplianceAI — Architecture Document

> **Version:** 2.0 | **Stack:** React 19 · TypeScript · Vite · Tailwind CSS

---

## 1. System Overview

ComplianceAI is a **fully client-side, zero-backend** web application. Every computation — assessment scoring, BM25 retrieval, document indexing, and optional LLM calls — runs in the browser. There is no server, no database, and no authentication service. Data is persisted in two browser-native stores:

| Store | What it holds | Lifetime |
|-------|--------------|---------|
| **LocalStorage** | Assessment history (up to 50 results), LLM API key config | Until cleared by user |
| **IndexedDB** | Knowledge base documents + page chunks (RAG index) | Until cleared by user |

External network calls are made **only** if the user configures an LLM API key (to OpenAI or Anthropic endpoints). All framework control data is bundled as TypeScript at build time.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client Only)                        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     React Application                        │   │
│  │                                                              │   │
│  │   ┌──────────┐  ┌──────────┐  ┌─────────────────────────┐  │   │
│  │   │  Pages   │  │ Context  │  │      Services Layer      │  │   │
│  │   │          │  │ (State)  │  │                          │  │   │
│  │   │ Home     │  │          │  │  ┌─────────┐ ┌────────┐ │  │   │
│  │   │ Wizard   │◄─┤ App      │  │  │   RAG   │ │Skills │ │  │   │
│  │   │ Report   │  │ History  │  │  │ Engine  │ │       │ │  │   │
│  │   │ History  │  │ RAG      │◄─┼─►│ BM25    │ │ x5    │ │  │   │
│  │   │ Frames.  │  │          │  │  │ Indexer │ │       │ │  │   │
│  │   │ KB       │  └──────────┘  │  └────┬────┘ └───┬───┘ │  │   │
│  │   │ Skills   │                │       │           │      │  │   │
│  │   └──────────┘                └───────┼───────────┼──────┘  │   │
│  │                                       │           │          │   │
│  │          ┌────────────────────────────┘           │          │   │
│  │          ▼                                        │          │   │
│  │   ┌─────────────┐   ┌──────────────┐             │          │   │
│  │   │  IndexedDB  │   │ LocalStorage │             │          │   │
│  │   │  (RAG docs  │   │ (History +   │             │          │   │
│  │   │   + chunks) │   │  LLM config) │             │          │   │
│  │   └─────────────┘   └──────────────┘             │          │   │
│  │                                                   │          │   │
│  │   ┌───────────────────────────────────────────────┘          │   │
│  │   ▼                                                           │   │
│  │   ┌──────────────────────────────────────────────────────┐   │   │
│  │   │  Static Framework Data (TypeScript, bundled at build) │   │   │
│  │   │  12 frameworks · 300+ controls · business profiles    │   │   │
│  │   └──────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                          (optional, user-configured)
                                    │
                    ┌───────────────┴──────────────┐
                    ▼                               ▼
            ┌──────────────┐               ┌──────────────┐
            │  OpenAI API  │               │ Anthropic API │
            │  (GPT-4o)    │               │   (Claude)   │
            └──────────────┘               └──────────────┘
```

---

## 3. Application Layers

```
┌────────────────────────────────────────────────────────┐
│  Layer 5 — Pages (UI Views)                            │
│  HomePage · AssessmentWizard · ReportPage ·            │
│  HistoryPage · FrameworksPage · KnowledgeBasePage ·    │
│  SkillsPage                                            │
├────────────────────────────────────────────────────────┤
│  Layer 4 — Context (Global State)                      │
│  AppContext · HistoryContext · RAGContext               │
├────────────────────────────────────────────────────────┤
│  Layer 3 — Services (Business Logic)                   │
│  RAG: types · DocumentStore · PageIndexer ·            │
│       BM25Retriever · RAGEngine                        │
│  Skills: types · skills (x5)                           │
│  Utils: scoring · exportUtils                          │
├────────────────────────────────────────────────────────┤
│  Layer 2 — Data (Static, Bundled)                      │
│  frameworks/[12 files] · business-profiles ·           │
│  cloud-requirements                                    │
├────────────────────────────────────────────────────────┤
│  Layer 1 — Types (Contracts)                           │
│  frameworks.ts · filters.ts · assessment.ts · report.ts│
└────────────────────────────────────────────────────────┘
```

---

## 4. Component & Provider Tree

```
main.tsx
└── App.tsx
    └── HistoryProvider          ← LocalStorage-backed assessment history
        └── RAGProvider          ← IndexedDB-backed RAG engine + skills
            └── AppProvider      ← Navigation state (currentPage)
                └── AppShell     ← Sidebar + topbar layout
                    ├── HomePage
                    ├── AssessmentWizard
                    │   ├── Step1BusinessProfile
                    │   ├── Step2ITOTScope
                    │   ├── Step3FrameworkSelect
                    │   ├── Step4Requirements
                    │   └── Step5Review
                    ├── ReportPage
                    ├── HistoryPage
                    ├── FrameworksPage
                    ├── KnowledgeBasePage
                    │   ├── DocumentList
                    │   ├── UploadPanel
                    │   ├── SearchPanel
                    │   └── LLMConfigPanel
                    └── SkillsPage
                        ├── FrameworkAnalysisSkill
                        ├── GapEnrichmentSkill
                        ├── CrossFrameworkSkill
                        ├── ControlSearchSkill
                        └── RemediationGuideSkill
```

---

## 5. State Management

Three React Context providers manage all global state. No external state library is used.

```
┌──────────────────────────────────────────────────────────────┐
│  AppContext                                                   │
│  ─────────────────────────────────────────────────────────   │
│  currentPage: AppPage         → drives page routing          │
│  viewingResult: AssessmentResult | null → report navigation  │
│                                                              │
│  Consumed by: AppShell, all pages, wizard steps             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  HistoryContext                                               │
│  ─────────────────────────────────────────────────────────   │
│  history: AssessmentResult[]  → useLocalStorage hook         │
│  saveAssessment(result)       → prepend, max 50 kept         │
│  deleteAssessment(id)                                        │
│  clearAll()                                                  │
│                                                              │
│  Persistence: LocalStorage key "compliance-ai-history"       │
│  Consumed by: HomePage, HistoryPage, ReportPage, SkillsPage  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  RAGContext                                                   │
│  ─────────────────────────────────────────────────────────   │
│  documents: KnowledgeDocument[]  → merged builtin + user     │
│  isReady: boolean                → IndexedDB init complete   │
│  isIndexing: boolean             → ongoing index operation   │
│  totalChunks: number             → BM25 index size           │
│  llmConfig: LLMConfig            → provider + key + model    │
│                                                              │
│  addDocumentFromText(params)  → index + persist to IDB       │
│  removeDocument(id)           → delete from IDB + re-index   │
│  search(query, options)       → BM25 retrieval               │
│  runSkill(skillId, params)    → skill dispatch               │
│  setLLMConfig(config)         → persist to LocalStorage      │
│                                                              │
│  Persistence: IndexedDB "ComplianceAI_RAG"                   │
│  Consumed by: KnowledgeBasePage, SkillsPage                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Data Model

### Framework Data (Static)

```
Framework
├── id: FrameworkId
├── name / shortName / version / issuer / colorClass
├── applicableRegions: BusinessRegion[]
├── applicableBusinessTypes: BusinessType[]
├── applicableScopes: ITOTScope[]
├── totalControls: number
└── domains: ControlDomain[]
    └── ControlDomain
        ├── id / name / description
        └── controls: Control[]
            └── Control
                ├── id / frameworkId / category / controlNumber
                ├── title / description / implementationGuidance
                ├── severity: 'critical' | 'high' | 'medium' | 'low' | 'informational'
                ├── applicableScopes: ITOTScope[]
                ├── applicableCloudProviders: CloudProvider[]
                ├── tags: string[]
                └── remediationSteps: string[]
```

### Assessment Data (Runtime → LocalStorage)

```
AssessmentSession (in-wizard, ephemeral)
├── id: uuid
├── profile: Partial<AssessmentProfile>
│   ├── organizationName / assessorName
│   ├── businessType / businessRegion / itotScope
│   ├── cloudProviders: CloudProvider[]
│   └── selectedFrameworks: FrameworkId[]
├── currentStep: 1–5
├── answers: ControlAnswer[]
│   └── { controlId, frameworkId, answer, notes, evidence, answeredAt }
└── startedAt: ISO string

AssessmentResult (completed, saved to history)
├── id / profile / answers[]
├── frameworkScores: FrameworkScore[]
│   └── { frameworkId, totalControls, compliantCount, partialCount,
│           nonCompliantCount, naCount, notAssessedCount,
│           scorePercent, maturityLevel: 1–5 }
├── gaps: AssessmentGap[]
│   └── { controlId, frameworkId, controlTitle, category, severity,
│           status, answer, remediationSteps[], priority }
├── overallScore: number (weighted by business-profile matrix)
├── completedAt: ISO string
└── durationMinutes: number
```

### RAG Data (Runtime → IndexedDB)

```
KnowledgeDocument                    PageChunk
├── id: string                       ├── id: string
├── title / source                   ├── documentId: string
├── type: 'builtin' | 'uploaded'     ├── pageNumber: number (1-based)
├── framework?: FrameworkId          ├── text: string (~800 chars)
├── tags: string[]                   ├── wordCount: number
├── content: string (full text)      └── metadata: ChunkMetadata
├── chunkCount: number                   ├── source / title
├── fileType: 'txt'|'md'|'manual'        ├── framework?: string
└── addedAt: ISO string                  ├── tags: string[]
                                         └── type: 'builtin'|'uploaded'
```

---

## 7. Assessment Flow

```
User
 │
 ├─► Step 1: Business Profile
 │         organizationName, assessorName,
 │         businessType, businessRegion
 │
 ├─► Step 2: IT/OT Scope
 │         it-only | ot-only | it-ot-both
 │         cloudProviders[]
 │
 ├─► Step 3: Framework Selection
 │         getApplicableFrameworks(businessType, region)
 │         → businessFrameworkMatrix lookup
 │         → recommended + mandatory flagging
 │         → user selects from filtered list
 │
 ├─► Step 4: Requirements (Control Questionnaire)
 │         For each selected framework → each domain → each control:
 │           Filter by itotScope + cloudProviders
 │           User answers: yes | partial | no | na
 │           Optional notes + evidence fields
 │
 └─► Step 5: Review → Generate Report
           buildAssessmentResult()
           ├── computeFrameworkScore() per framework
           │     → compliant/partial/non-compliant/na counts
           │     → scorePercent = (compliant + 0.5×partial) / applicable × 100
           │     → maturityLevel = scoreToMaturity(scorePercent)
           ├── computeGaps() → sorted by priority × severity
           │     priority = f(severity, answer)
           │     immediate > short-term > medium-term > long-term
           └── computeOverallScore()
                 → weighted sum by business-profile applicability matrix
```

---

## 8. RAG Pipeline

### 8.1 Indexing (on app startup + user upload)

```
Startup
  │
  ├─► indexBuiltinFrameworks()
  │     For each of 12 frameworks:
  │       Render controls to markdown text
  │       splitIntoChunks() → ~800 char segments on paragraph breaks
  │       Attach metadata: { source, title, framework, tags, type:'builtin' }
  │     → ~800–1200 PageChunks total
  │
  ├─► documentStore.getChunks()  ← load user chunks from IndexedDB
  │
  └─► ragEngine.index([...builtinChunks, ...userChunks])
        → BM25Retriever.index()
              tokenize each chunk (lowercase, stop-word filter, len>2)
              compute avgDocLen
              clear IDF cache

User Upload
  │
  ├─► createDocumentFromText(params)
  │     splitIntoChunks() → PageChunk[]
  │     documentStore.saveDocument(doc)
  │     documentStore.saveChunks(chunks)
  │
  └─► ragEngine.addChunks(chunks)
        merge into existing index → re-index BM25
```

### 8.2 Retrieval (BM25)

```
query: string
options: { topK, frameworkFilter, typeFilter, tagFilter }
  │
  ▼
tokenize(query)
  → lowercase → remove punctuation → split on whitespace
  → filter stop-words → filter len ≤ 2
  │
  ▼
For each PageChunk in index:
  Apply filters (framework, type, tag)
  BM25 Score:
    score = Σ IDF(term) × TF×(K1+1) / (TF + K1×(1-B+B×docLen/avgDocLen))
    K1 = 1.5, B = 0.75
    IDF(term) = log((N - df + 0.5) / (df + 0.5) + 1)
  │
  ▼
Sort descending by score → slice topK
Extract highlights: sentences containing query tokens
  │
  ▼
RetrievalResult[]
  ├── chunk: PageChunk
  ├── score: number
  └── highlights: string[]
```

### 8.3 Skills Execution

```
SkillId + Params
  │
  ▼
RAGContext.runSkill()
  │
  ├─► ragEngine.search(query, options)   ← always runs
  │       → RetrievalResult[]
  │
  ├─► Template-based analysis            ← always available
  │       Structured markdown from control data + retrieved chunks
  │
  └─► [Optional] synthesiseWithLLM()    ← if provider ≠ 'none' and apiKey set
          Build system + user prompt with:
            retrieved context (ragEngine.formatContext(results))
            structured framework/gap/control data
          POST to OpenAI or Anthropic API
          → LLM-generated markdown analysis
          Falls back to template if API call fails

SkillResult
  ├── skillId / skillName / query
  ├── analysis: string (markdown)
  ├── sources: RetrievalResult[]
  ├── sourceDocuments: string[]
  ├── executedAt: ISO string
  └── llmAssisted: boolean
```

---

## 9. Scoring Algorithm

```
Framework Score
  applicable = totalControls - naCount
  scorePercent = round(
    (compliantCount + 0.5 × partialCount) / applicable × 100
  )

  Maturity Level (scorePercent → 1-5):
    ≥ 90% → 5 (Optimized)
    ≥ 75% → 4 (Managed)
    ≥ 55% → 3 (Defined)
    ≥ 35% → 2 (Developing)
    <  35% → 1 (Initial)

Overall Score
  overallScore = Σ (scorePercent × weight) / Σ weight
  where weight = businessFrameworkMatrix[businessType][region][frameworkId].weight

Gap Priority
  critical + no       → immediate
  critical + partial  → short-term
  high     + no       → short-term
  high     + partial  → medium-term
  medium   + any      → medium-term
  low/info + any      → long-term
```

---

## 10. Storage Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LocalStorage                                               │
│                                                             │
│  "compliance-ai-history"                                    │
│  → JSON array of AssessmentResult[]                        │
│     Max 50 entries, newest first                           │
│                                                             │
│  "complianceai_llm_config"                                  │
│  → JSON: { provider, apiKey, model }                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  IndexedDB — "ComplianceAI_RAG" (version 1)                │
│                                                             │
│  Object Store: "documents"                                  │
│    keyPath: "id"                                            │
│    → KnowledgeDocument records (user uploads only)         │
│                                                             │
│  Object Store: "chunks"                                     │
│    keyPath: "id"                                            │
│    index: "documentId" (non-unique)                         │
│    → PageChunk records (user doc chunks only)              │
│                                                             │
│  Note: built-in framework chunks are NOT persisted to IDB  │
│  They are re-generated in memory on every startup          │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Framework Data Architecture

```
src/data/frameworks/
  [framework].ts         ← 12 files, one per framework
  index.ts               ← ALL_FRAMEWORKS[] + FRAMEWORK_MAP{}

ALL_FRAMEWORKS: Framework[]         (ordered list, drives UI)
FRAMEWORK_MAP: Record<FrameworkId, Framework>  (keyed lookup)

src/data/business-profiles.ts
  businessFrameworkMatrix:
    Record<BusinessType, Record<BusinessRegion, FrameworkApplicability[]>>

  FrameworkApplicability {
    frameworkId: FrameworkId
    mandatory: boolean
    weight: number          ← 0.0–1.0, used in overall score
    rationale: string
  }

  REGION_MANDATORY_FRAMEWORKS:
    Record<BusinessRegion, FrameworkId[]>
    EU  → ['gdpr', 'eu-ai-act', 'cra']
    UK  → ['gdpr']
    NA  → ['ccpa']

src/data/cloud-requirements/
  Cloud-specific security requirements for AWS, Azure, GCP, Hybrid
  Mapped to framework control IDs for cross-reference
```

---

## 12. Navigation & Routing

Navigation is state-driven (no URL router). `AppContext.currentPage` is the single source of truth.

```
AppPage (union type):
  'home'           → HomePage
  'new-assessment' → AssessmentWizard (5-step wizard)
  'report'         → ReportPage (requires viewingResult set)
  'history'        → HistoryPage
  'frameworks'     → FrameworksPage
  'knowledge-base' → KnowledgeBasePage  ← RAG / document management
  'skills'         → SkillsPage         ← AI Skills panel

Sidebar groups:
  ─ Assessment ─
    Dashboard · New Assessment · History · Frameworks
  ─ AI / RAG ─
    Knowledge Base · AI Skills
```

---

## 13. Export Architecture

```
ReportPage
  │
  ├─► exportJSON(result)
  │     JSON.stringify(AssessmentResult) → Blob → download
  │
  ├─► exportCSV(result)
  │     Gaps → CSV rows → Blob → download
  │
  └─► exportPDF(result)
        jsPDF instance
        jspdf-autotable for gap/score tables
        html2canvas for gauge charts
        → .pdf download
        Sections driven by ReportConfig:
          Executive Summary
          Framework Scores
          Gap Analysis
          Remediation Plan
          Control Details
```

---

## 14. Skills Reference

| Skill ID | File | Input | RAG Query | Output |
|----------|------|-------|-----------|--------|
| `framework-analysis` | skills.ts | `FrameworkAnalysisParams` | `{name} requirements controls obligations` | Domain breakdown, KB references |
| `gap-enrichment` | skills.ts | `GapEnrichmentParams` | `{fw} gap remediation implementation` | Prioritised remediation roadmap |
| `cross-framework` | skills.ts | `CrossFrameworkParams` | Per-framework requirement queries | Overlap analysis, dual-compliance strategy |
| `control-search` | skills.ts | `ControlSearchParams` | User query verbatim | Ranked chunks with highlights |
| `remediation-guide` | skills.ts | `RemediationGuideParams` | `{control} remediation how to` | Step-by-step implementation guide |

---

## 15. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Zero backend | Privacy-first — no user data leaves the browser; easy deployment as static site |
| TypeScript framework data | Type-safe, tree-shakeable, no API calls needed for framework content |
| BM25 over vector embeddings | No ML model download, no embedding API cost, fully synchronous, works offline |
| IndexedDB over LocalStorage for RAG | LocalStorage has a ~5 MB limit; IndexedDB supports large document corpora |
| Paragraph-boundary chunking | Preserves semantic coherence vs fixed-token chunking; suitable for regulatory prose |
| Template-first skills | Skills are fully functional without an LLM — LLM is additive, not required |
| React Context over Redux | Lightweight app with 3 clear state domains; no need for external state library |
| Tailwind CSS | Utility-first enables rapid UI iteration; no CSS bundle size concerns at this scale |
