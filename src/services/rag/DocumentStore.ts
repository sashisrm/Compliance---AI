import type { KnowledgeDocument, PageChunk } from './types';

const DB_NAME = 'ComplianceAI_RAG';
const DB_VERSION = 1;
const DOCS_STORE = 'documents';
const CHUNKS_STORE = 'chunks';

// ─── Open DB ─────────────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DOCS_STORE)) {
        db.createObjectStore(DOCS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
        const cs = db.createObjectStore(CHUNKS_STORE, { keyPath: 'id' });
        cs.createIndex('documentId', 'documentId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

function getAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function put<T>(db: IDBDatabase, store: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function deleteByKey(db: IDBDatabase, store: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function getByIndex<T>(db: IDBDatabase, store: string, index: string, value: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).index(index).getAll(value);
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function clearStore(db: IDBDatabase, store: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── DocumentStore ────────────────────────────────────────────────────────────

export class DocumentStore {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    this.db = await openDB();
  }

  private get(): IDBDatabase {
    if (!this.db) throw new Error('DocumentStore not initialised — call init() first');
    return this.db;
  }

  // ── Documents ──────────────────────────────────────────────────────────────

  async saveDocument(doc: KnowledgeDocument): Promise<void> {
    await put(this.get(), DOCS_STORE, doc);
  }

  async getDocuments(): Promise<KnowledgeDocument[]> {
    return getAll<KnowledgeDocument>(this.get(), DOCS_STORE);
  }

  async deleteDocument(id: string): Promise<void> {
    await deleteByKey(this.get(), DOCS_STORE, id);
  }

  // ── Chunks ─────────────────────────────────────────────────────────────────

  async saveChunks(chunks: PageChunk[]): Promise<void> {
    const db = this.get();
    for (const chunk of chunks) {
      await put(db, CHUNKS_STORE, chunk);
    }
  }

  async getChunks(): Promise<PageChunk[]> {
    return getAll<PageChunk>(this.get(), CHUNKS_STORE);
  }

  async getChunksByDocument(documentId: string): Promise<PageChunk[]> {
    return getByIndex<PageChunk>(this.get(), CHUNKS_STORE, 'documentId', documentId);
  }

  async deleteChunksByDocument(documentId: string): Promise<void> {
    const chunks = await this.getChunksByDocument(documentId);
    const db = this.get();
    for (const chunk of chunks) {
      await deleteByKey(db, CHUNKS_STORE, chunk.id);
    }
  }

  async clearAll(): Promise<void> {
    await clearStore(this.get(), DOCS_STORE);
    await clearStore(this.get(), CHUNKS_STORE);
  }
}

export const documentStore = new DocumentStore();
