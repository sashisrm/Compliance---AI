import { BM25Retriever } from './BM25Retriever';
import type { PageChunk, RetrievalResult, SearchOptions, LLMConfig } from './types';

// ─── LLM synthesis ───────────────────────────────────────────────────────────

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  config: LLMConfig
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  config: LLMConfig
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

export async function synthesiseWithLLM(
  systemPrompt: string,
  userPrompt: string,
  config: LLMConfig
): Promise<string> {
  if (config.provider === 'openai') return callOpenAI(systemPrompt, userPrompt, config);
  if (config.provider === 'anthropic') return callAnthropic(systemPrompt, userPrompt, config);
  return '';
}

// ─── RAGEngine ────────────────────────────────────────────────────────────────

export class RAGEngine {
  private retriever = new BM25Retriever();
  private allChunks: PageChunk[] = [];

  /** Replace the full index. Call after any document add/remove. */
  index(chunks: PageChunk[]): void {
    this.allChunks = chunks;
    this.retriever.index(chunks);
  }

  /** Add chunks to the existing index without full rebuild. */
  addChunks(chunks: PageChunk[]): void {
    this.allChunks = [...this.allChunks, ...chunks];
    this.retriever.index(this.allChunks);
  }

  /** Remove chunks belonging to a document and rebuild. */
  removeChunks(documentId: string): void {
    this.allChunks = this.allChunks.filter(c => c.documentId !== documentId);
    this.retriever.index(this.allChunks);
  }

  /** Search the index with optional filters. */
  search(query: string, options?: SearchOptions): RetrievalResult[] {
    return this.retriever.search(query, options);
  }

  /** Format retrieved results as a context block for LLM prompts. */
  formatContext(results: RetrievalResult[]): string {
    return results
      .map((r, i) =>
        [
          `[Source ${i + 1}] ${r.chunk.metadata.title}`,
          `(${r.chunk.metadata.source}, page ${r.chunk.pageNumber})`,
          r.chunk.text,
        ].join('\n')
      )
      .join('\n\n---\n\n');
  }

  get totalChunks(): number {
    return this.allChunks.length;
  }
}

export const ragEngine = new RAGEngine();
