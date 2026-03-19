import { v4 as uuidv4 } from 'uuid';
import { ALL_FRAMEWORKS } from '../../data/frameworks';
import type { KnowledgeDocument, PageChunk, ChunkMetadata } from './types';

// ─── Config ───────────────────────────────────────────────────────────────────

const TARGET_CHUNK_CHARS = 800;   // ~200 words per chunk
const MIN_CHUNK_CHARS = 100;      // discard very small trailing chunks

// ─── Split text into page-sized chunks ───────────────────────────────────────

function splitIntoChunks(text: string, docId: string, metadata: ChunkMetadata): PageChunk[] {
  // Normalise line endings
  const normalised = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!normalised) return [];

  // Split by double-newline (paragraph boundary) first
  const paragraphs = normalised.split(/\n{2,}/).filter(p => p.trim().length > 0);
  const chunks: PageChunk[] = [];
  let buffer = '';
  let pageNum = 1;

  const flush = () => {
    const trimmed = buffer.trim();
    if (trimmed.length >= MIN_CHUNK_CHARS) {
      chunks.push({
        id: `${docId}-p${pageNum}`,
        documentId: docId,
        pageNumber: pageNum,
        text: trimmed,
        wordCount: trimmed.split(/\s+/).length,
        metadata,
      });
      pageNum++;
    }
    buffer = '';
  };

  for (const para of paragraphs) {
    if (buffer.length + para.length > TARGET_CHUNK_CHARS && buffer.length > 0) {
      flush();
    }
    buffer = buffer ? `${buffer}\n\n${para}` : para;
  }
  flush();

  return chunks;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function indexDocument(doc: KnowledgeDocument): PageChunk[] {
  const metadata: ChunkMetadata = {
    source: doc.source,
    title: doc.title,
    framework: doc.framework,
    tags: doc.tags,
    type: doc.type,
  };
  return splitIntoChunks(doc.content, doc.id, metadata);
}

export function indexBuiltinFrameworks(): { document: KnowledgeDocument; chunks: PageChunk[] }[] {

  return ALL_FRAMEWORKS.map(fw => {
    const content = fw.domains
      .flatMap(domain =>
        domain.controls.map(control =>
          [
            `## ${control.controlNumber}: ${control.title}`,
            `Category: ${control.category}`,
            `Severity: ${control.severity}`,
            ``,
            control.description,
            ``,
            `Implementation Guidance: ${control.implementationGuidance}`,
            ``,
            `Remediation Steps:`,
            control.remediationSteps.map(s => `- ${s}`).join('\n'),
            `Tags: ${control.tags.join(', ')}`,
          ].join('\n')
        )
      )
      .join('\n\n---\n\n');

    const doc: KnowledgeDocument = {
      id: `builtin-${fw.id}`,
      title: `${fw.shortName} — ${fw.name}`,
      source: fw.issuer,
      type: 'builtin',
      framework: fw.id,
      tags: [fw.id, fw.shortName.toLowerCase(), 'builtin'],
      content,
      chunkCount: 0, // set after chunking
      fileType: 'builtin',
      addedAt: new Date().toISOString(),
    };

    const chunks = indexDocument(doc);
    doc.chunkCount = chunks.length;
    return { document: doc, chunks };
  });
}

export function createDocumentFromText(params: {
  title: string;
  source: string;
  content: string;
  framework?: string;
  tags: string[];
  fileType: 'txt' | 'md' | 'manual';
}): { document: KnowledgeDocument; chunks: PageChunk[] } {
  const id = uuidv4();
  const doc: KnowledgeDocument = {
    id,
    title: params.title,
    source: params.source,
    type: 'uploaded',
    framework: params.framework,
    tags: params.tags,
    content: params.content,
    chunkCount: 0,
    fileType: params.fileType,
    addedAt: new Date().toISOString(),
  };
  const chunks = indexDocument(doc);
  doc.chunkCount = chunks.length;
  return { document: doc, chunks };
}
