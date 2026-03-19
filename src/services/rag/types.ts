// ─── Knowledge Document ──────────────────────────────────────────────────────

export type DocumentFileType = 'txt' | 'md' | 'manual' | 'builtin';
export type DocumentSourceType = 'uploaded' | 'builtin';

export interface KnowledgeDocument {
  id: string;
  title: string;
  source: string;           // e.g. "EU AI Act 2024", "Company Policy v2"
  type: DocumentSourceType;
  framework?: string;       // optional framework tag, e.g. "eu-ai-act"
  tags: string[];
  content: string;
  chunkCount: number;
  fileType: DocumentFileType;
  addedAt: string;          // ISO string
}

// ─── Page Chunk ───────────────────────────────────────────────────────────────

export interface ChunkMetadata {
  source: string;
  title: string;
  framework?: string;
  tags: string[];
  type: DocumentSourceType;
}

export interface PageChunk {
  id: string;
  documentId: string;
  pageNumber: number;       // 1-based chunk index within the document
  text: string;
  wordCount: number;
  metadata: ChunkMetadata;
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

export interface RetrievalResult {
  chunk: PageChunk;
  score: number;            // BM25 score
  highlights: string[];     // Matched sentences
}

export interface SearchOptions {
  topK?: number;
  frameworkFilter?: string;
  typeFilter?: DocumentSourceType;
  tagFilter?: string;
}

// ─── LLM Config ───────────────────────────────────────────────────────────────

export type LLMProvider = 'openai' | 'anthropic' | 'none';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
}

export const DEFAULT_LLM_MODELS: Record<LLMProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
  none: '',
};
