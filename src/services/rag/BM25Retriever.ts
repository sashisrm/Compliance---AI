import type { PageChunk, RetrievalResult, SearchOptions } from './types';

// ─── Stop words ───────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'that', 'this', 'these',
  'those', 'it', 'its', 'not', 'no', 'can', 'will', 'would', 'should',
  'could', 'may', 'might', 'must', 'shall', 'from', 'as', 'if', 'then',
  'than', 'so', 'each', 'all', 'any', 'which', 'who', 'when', 'where',
  'how', 'what', 'their', 'they', 'them', 'we', 'our', 'you', 'your',
  'also', 'such', 'other', 'more', 'into', 'about', 'only', 'include',
]);

// ─── BM25 parameters ──────────────────────────────────────────────────────────

const K1 = 1.5;
const B = 0.75;

// ─── Tokeniser ────────────────────────────────────────────────────────────────

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

// ─── BM25Retriever ────────────────────────────────────────────────────────────

export class BM25Retriever {
  private chunks: PageChunk[] = [];
  private tokenizedChunks: string[][] = [];
  private avgDocLen = 0;
  private idfCache: Map<string, number> = new Map();

  index(chunks: PageChunk[]): void {
    this.chunks = chunks;
    this.tokenizedChunks = chunks.map(c => tokenize(c.text));
    const totalLen = this.tokenizedChunks.reduce((s, t) => s + t.length, 0);
    this.avgDocLen = this.chunks.length > 0 ? totalLen / this.chunks.length : 1;
    this.idfCache.clear();
  }

  search(query: string, options: SearchOptions = {}): RetrievalResult[] {
    const { topK = 8, frameworkFilter, typeFilter, tagFilter } = options;
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0 || this.chunks.length === 0) return [];

    const scored: { chunk: PageChunk; score: number }[] = [];

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];

      // Apply filters
      if (frameworkFilter && chunk.metadata.framework !== frameworkFilter) continue;
      if (typeFilter && chunk.metadata.type !== typeFilter) continue;
      if (tagFilter && !chunk.metadata.tags.includes(tagFilter)) continue;

      const score = this.bm25Score(queryTokens, this.tokenizedChunks[i], i);
      if (score > 0) scored.push({ chunk, score });
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK).map(({ chunk, score }) => ({
      chunk,
      score: Math.round(score * 1000) / 1000,
      highlights: this.extractHighlights(chunk.text, queryTokens),
    }));
  }

  private bm25Score(queryTokens: string[], docTokens: string[], docIdx: number): number {
    const docLen = docTokens.length;
    let score = 0;

    for (const term of queryTokens) {
      const tf = docTokens.filter(t => t === term).length;
      if (tf === 0) continue;
      const idf = this.idf(term);
      const numerator = tf * (K1 + 1);
      const denominator = tf + K1 * (1 - B + B * (docLen / this.avgDocLen));
      score += idf * (numerator / denominator);
    }

    return score;
  }

  private idf(term: string): number {
    if (this.idfCache.has(term)) return this.idfCache.get(term)!;
    const N = this.chunks.length;
    const df = this.tokenizedChunks.filter(tokens => tokens.includes(term)).length;
    const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
    this.idfCache.set(term, idf);
    return idf;
  }

  private extractHighlights(text: string, queryTokens: string[]): string[] {
    const sentences = text
      .split(/[.!?\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    return sentences
      .filter(s => queryTokens.some(t => s.toLowerCase().includes(t)))
      .slice(0, 3);
  }

  get indexedCount(): number {
    return this.chunks.length;
  }
}
