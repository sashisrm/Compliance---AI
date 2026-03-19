import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { documentStore } from '../services/rag/DocumentStore';
import { ragEngine } from '../services/rag/RAGEngine';
import { indexBuiltinFrameworks, createDocumentFromText } from '../services/rag/PageIndexer';
import {
  runFrameworkAnalysis,
  runGapEnrichment,
  runCrossFramework,
  runRemediationGuide,
  runControlSearch,
} from '../services/skills/skills';
import type { KnowledgeDocument, PageChunk, RetrievalResult, SearchOptions, LLMConfig, LLMProvider } from '../services/rag/types';
import type { SkillResult, SkillId, FrameworkAnalysisParams, GapEnrichmentParams, CrossFrameworkParams, RemediationGuideParams, ControlSearchParams } from '../services/skills/types';
import { DEFAULT_LLM_MODELS } from '../services/rag/types';

const LLM_CONFIG_KEY = 'complianceai_llm_config';

// ─── Context shape ────────────────────────────────────────────────────────────

interface RAGContextValue {
  // State
  documents: KnowledgeDocument[];
  isReady: boolean;
  isIndexing: boolean;
  totalChunks: number;

  // LLM config
  llmConfig: LLMConfig;
  setLLMConfig: (config: LLMConfig) => void;

  // Document management
  addDocumentFromText: (params: {
    title: string;
    source: string;
    content: string;
    framework?: string;
    tags: string[];
    fileType: 'txt' | 'md' | 'manual';
  }) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;

  // Search
  search: (query: string, options?: SearchOptions) => RetrievalResult[];

  // Skills
  runSkill: (skillId: SkillId, params: unknown) => Promise<SkillResult>;
}

const RAGContext = createContext<RAGContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RAGProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [totalChunks, setTotalChunks] = useState(0);
  const [llmConfig, setLLMConfigState] = useState<LLMConfig>(() => {
    try {
      const stored = localStorage.getItem(LLM_CONFIG_KEY);
      return stored ? JSON.parse(stored) : { provider: 'none' as LLMProvider, apiKey: '', model: '' };
    } catch {
      return { provider: 'none' as LLMProvider, apiKey: '', model: '' };
    }
  });

  const initialised = useRef(false);

  // ── Initialise on mount ───────────────────────────────────────────────────

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    (async () => {
      setIsIndexing(true);
      try {
        await documentStore.init();

        // Load user documents from IndexedDB
        const storedDocs = await documentStore.getDocuments();
        const userDocs = storedDocs.filter(d => d.type === 'uploaded');

        // Load stored chunks for user documents
        const storedChunks = await documentStore.getChunks();
        const userChunks = storedChunks.filter((c: PageChunk) => !c.documentId.startsWith('builtin-'));

        // Index builtin frameworks (always fresh, not stored in DB)
        const builtins = indexBuiltinFrameworks();
        const builtinChunks: PageChunk[] = builtins.flatMap(b => b.chunks);
        const builtinDocs = builtins.map(b => b.document);

        // Merge and index all chunks
        const allChunks = [...builtinChunks, ...userChunks];
        ragEngine.index(allChunks);
        setTotalChunks(allChunks.length);
        setDocuments([...builtinDocs, ...userDocs]);
      } catch (err) {
        console.error('RAG init error:', err);
      } finally {
        setIsIndexing(false);
        setIsReady(true);
      }
    })();
  }, []);

  // ── LLM config ───────────────────────────────────────────────────────────

  const setLLMConfig = useCallback((config: LLMConfig) => {
    setLLMConfigState(config);
    localStorage.setItem(LLM_CONFIG_KEY, JSON.stringify(config));
  }, []);

  // ── Add document ──────────────────────────────────────────────────────────

  const addDocumentFromText = useCallback(async (params: {
    title: string;
    source: string;
    content: string;
    framework?: string;
    tags: string[];
    fileType: 'txt' | 'md' | 'manual';
  }) => {
    setIsIndexing(true);
    try {
      const { document, chunks } = createDocumentFromText(params);
      await documentStore.saveDocument(document);
      await documentStore.saveChunks(chunks);
      ragEngine.addChunks(chunks);
      setTotalChunks(prev => prev + chunks.length);
      setDocuments(prev => [...prev, document]);
    } finally {
      setIsIndexing(false);
    }
  }, []);

  // ── Remove document ───────────────────────────────────────────────────────

  const removeDocument = useCallback(async (id: string) => {
    if (id.startsWith('builtin-')) return; // Cannot remove builtins
    await documentStore.deleteDocument(id);
    await documentStore.deleteChunksByDocument(id);
    ragEngine.removeChunks(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    // Recount (approximate)
    const remaining = await documentStore.getChunks();
    const builtins = indexBuiltinFrameworks();
    setTotalChunks(remaining.length + builtins.reduce((s, b) => s + b.chunks.length, 0));
  }, []);

  // ── Search ────────────────────────────────────────────────────────────────

  const search = useCallback((query: string, options?: SearchOptions): RetrievalResult[] => {
    return ragEngine.search(query, options);
  }, []);

  // ── Run skill ─────────────────────────────────────────────────────────────

  const runSkill = useCallback(async (skillId: SkillId, params: unknown): Promise<SkillResult> => {
    switch (skillId) {
      case 'framework-analysis':
        return runFrameworkAnalysis(params as FrameworkAnalysisParams, llmConfig);
      case 'gap-enrichment':
        return runGapEnrichment(params as GapEnrichmentParams, llmConfig);
      case 'cross-framework':
        return runCrossFramework(params as CrossFrameworkParams, llmConfig);
      case 'remediation-guide':
        return runRemediationGuide(params as RemediationGuideParams, llmConfig);
      case 'control-search':
        return runControlSearch(params as ControlSearchParams, llmConfig);
      default:
        throw new Error(`Unknown skill: ${skillId}`);
    }
  }, [llmConfig]);

  return (
    <RAGContext.Provider value={{
      documents,
      isReady,
      isIndexing,
      totalChunks,
      llmConfig,
      setLLMConfig,
      addDocumentFromText,
      removeDocument,
      search,
      runSkill,
    }}>
      {children}
    </RAGContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRAG(): RAGContextValue {
  const ctx = useContext(RAGContext);
  if (!ctx) throw new Error('useRAG must be used within RAGProvider');
  return ctx;
}

export { DEFAULT_LLM_MODELS };
