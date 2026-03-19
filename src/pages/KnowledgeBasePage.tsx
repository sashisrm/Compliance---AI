import { useState, useRef } from 'react';
import { useRAG } from '../context/RAGContext';
import { ALL_FRAMEWORKS } from '../data/frameworks';
import {
  Upload, FileText, Trash2, Search, Plus, Database,
  CheckCircle, AlertCircle, Loader, ChevronDown, ChevronRight,
  BookOpen, Cpu, Settings, Eye, EyeOff,
} from 'lucide-react';
import type { LLMProvider } from '../services/rag/types';
import { DEFAULT_LLM_MODELS } from '../context/RAGContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Badge({ children, color = 'slate' }: { children: React.ReactNode; color?: string }) {
  const cls: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    indigo: 'bg-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    violet: 'bg-violet-100 text-violet-700',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls[color] ?? cls.slate}`}>
      {children}
    </span>
  );
}

// ─── LLM Config Panel ─────────────────────────────────────────────────────────

function LLMConfigPanel() {
  const { llmConfig, setLLMConfig } = useRAG();
  const [showKey, setShowKey] = useState(false);
  const [localConfig, setLocalConfig] = useState(llmConfig);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const model = localConfig.model || DEFAULT_LLM_MODELS[localConfig.provider];
    setLLMConfig({ ...localConfig, model });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Cpu size={16} className="text-indigo-600" />
        <h3 className="font-semibold text-slate-800">AI Synthesis Configuration</h3>
        <Badge color="indigo">Optional</Badge>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Configure an LLM provider to enable AI-powered analysis in Skills. Without a key, skills use template-based retrieval (still fully functional).
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Provider</label>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            value={localConfig.provider}
            onChange={e => setLocalConfig(prev => ({
              ...prev,
              provider: e.target.value as LLMProvider,
              model: DEFAULT_LLM_MODELS[e.target.value as LLMProvider],
            }))}
          >
            <option value="none">None (template-based retrieval only)</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>
        </div>

        {localConfig.provider !== 'none' && (
          <>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder={localConfig.provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                  value={localConfig.apiKey}
                  onChange={e => setLocalConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Stored locally in browser only — never sent to our servers.</p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Model</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                value={localConfig.model || DEFAULT_LLM_MODELS[localConfig.provider]}
                onChange={e => setLocalConfig(prev => ({ ...prev, model: e.target.value }))}
              />
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          {saved ? <><CheckCircle size={14} /> Saved</> : <><Settings size={14} /> Save Configuration</>}
        </button>
      </div>
    </div>
  );
}

// ─── Upload Panel ─────────────────────────────────────────────────────────────

function UploadPanel() {
  const { addDocumentFromText, isIndexing } = useRAG();
  const [mode, setMode] = useState<'paste' | 'file'>('paste');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [framework, setFramework] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setTitle(''); setSource(''); setFramework(''); setTags(''); setContent(''); setError(''); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    const reader = new FileReader();
    reader.onload = ev => setContent((ev.target?.result as string) ?? '');
    reader.readAsText(file);
  };

  const handleAdd = async () => {
    setError('');
    if (!title.trim()) { setError('Title is required'); return; }
    if (!content.trim()) { setError('Content is required'); return; }

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (framework && !tagList.includes(framework)) tagList.push(framework);

    await addDocumentFromText({
      title: title.trim(),
      source: source.trim() || title.trim(),
      content: content.trim(),
      framework: framework || undefined,
      tags: tagList,
      fileType: mode === 'file' ? 'txt' : 'manual',
    });

    setSuccess(`"${title}" indexed successfully.`);
    setTimeout(() => setSuccess(''), 3000);
    reset();
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Plus size={16} className="text-emerald-600" />
        <h3 className="font-semibold text-slate-800">Add Document to Knowledge Base</h3>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-slate-200 overflow-hidden mb-4 w-fit">
        {(['paste', 'file'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${mode === m ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {m === 'paste' ? 'Paste Text' : 'Upload File (.txt / .md)'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Document Title *</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400" placeholder="e.g. EU AI Act Guidance 2024" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Source / Issuer</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400" placeholder="e.g. European Commission" value={source} onChange={e => setSource(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Link to Framework</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400" value={framework} onChange={e => setFramework(e.target.value)}>
              <option value="">— None / General —</option>
              {ALL_FRAMEWORKS.map(fw => <option key={fw.id} value={fw.id}>{fw.shortName}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Tags (comma-separated)</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400" placeholder="e.g. ai-governance, high-risk" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
        </div>

        {mode === 'file' ? (
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">File (.txt or .md)</label>
            <input ref={fileRef} type="file" accept=".txt,.md" onChange={handleFile} className="block w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            {content && <p className="text-xs text-emerald-600 mt-1">{content.length.toLocaleString()} characters loaded</p>}
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Content *</label>
            <textarea
              rows={8}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-y"
              placeholder="Paste regulatory text, policy content, guidance documents, or any compliance reference material here..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">{content.length.toLocaleString()} characters</p>
          </div>
        )}

        {error && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} />{error}</p>}
        {success && <p className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle size={14} />{success}</p>}

        <button
          onClick={handleAdd}
          disabled={isIndexing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isIndexing ? <><Loader size={14} className="animate-spin" /> Indexing...</> : <><Upload size={14} /> Add to Knowledge Base</>}
        </button>
      </div>
    </div>
  );
}

// ─── Document List ────────────────────────────────────────────────────────────

function DocumentList() {
  const { documents, removeDocument, isIndexing } = useRAG();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const userDocs = documents.filter(d => d.type === 'uploaded');
  const builtinDocs = documents.filter(d => d.type === 'builtin');

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await removeDocument(id); } finally { setDeleting(null); }
  };

  const DocCard = ({ doc }: { doc: typeof documents[0] }) => {
    const isExpanded = expandedId === doc.id;
    const isBuiltin = doc.type === 'builtin';
    return (
      <div className={`rounded-xl border overflow-hidden ${isBuiltin ? 'border-slate-200 bg-slate-50' : 'border-indigo-200 bg-white'}`}>
        <button
          onClick={() => setExpandedId(isExpanded ? null : doc.id)}
          className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isBuiltin ? 'bg-slate-200' : 'bg-indigo-100'}`}>
            {isBuiltin ? <BookOpen size={15} className="text-slate-600" /> : <FileText size={15} className="text-indigo-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm text-slate-800 truncate">{doc.title}</p>
              {isBuiltin && <Badge color="slate">Built-in</Badge>}
              {doc.framework && <Badge color="indigo">{doc.framework}</Badge>}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{doc.source} · {doc.chunkCount} chunks · {new Date(doc.addedAt).toLocaleDateString()}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {doc.tags.filter(t => t !== doc.framework && t !== 'builtin').slice(0, 4).map(t => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isBuiltin && (
              <button
                onClick={e => { e.stopPropagation(); handleDelete(doc.id); }}
                disabled={deleting === doc.id || isIndexing}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                {deleting === doc.id ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
            {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
          </div>
        </button>
        {isExpanded && (
          <div className="border-t border-slate-200 px-4 py-3 bg-white">
            <p className="text-xs font-medium text-slate-500 mb-1">Content preview</p>
            <p className="text-xs text-slate-700 font-mono leading-relaxed line-clamp-6 whitespace-pre-wrap">
              {doc.content.slice(0, 600)}{doc.content.length > 600 ? '...' : ''}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {userDocs.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Upload size={14} className="text-indigo-600" /> Uploaded Documents ({userDocs.length})
          </h4>
          <div className="space-y-2">{userDocs.map(d => <DocCard key={d.id} doc={d} />)}</div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <BookOpen size={14} className="text-slate-500" /> Built-in Frameworks ({builtinDocs.length})
        </h4>
        <div className="space-y-2">{builtinDocs.map(d => <DocCard key={d.id} doc={d} />)}</div>
      </div>
    </div>
  );
}

// ─── Search Panel ─────────────────────────────────────────────────────────────

function SearchPanel() {
  const { search } = useRAG();
  const [query, setQuery] = useState('');
  const [framework, setFramework] = useState('');
  const [results, setResults] = useState<ReturnType<typeof search>>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    const r = search(query, { frameworkFilter: framework || undefined, topK: 10 });
    setResults(r);
    setSearched(true);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            placeholder="Search knowledge base... e.g. 'SBOM requirements' or 'bias testing'"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300"
            value={framework}
            onChange={e => setFramework(e.target.value)}
          >
            <option value="">All frameworks</option>
            {ALL_FRAMEWORKS.map(fw => <option key={fw.id} value={fw.id}>{fw.shortName}</option>)}
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Search size={14} /> Search
          </button>
        </div>
      </div>

      {searched && (
        <div>
          <p className="text-xs text-slate-500 mb-2">{results.length} result(s) for "{query}"</p>
          {results.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-sm">
              No results found. Try different keywords or upload related documents.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r, i) => (
                <div key={r.chunk.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-medium text-sm text-slate-800">{r.chunk.metadata.title}</p>
                      <p className="text-xs text-slate-500">{r.chunk.metadata.source} · page {r.chunk.pageNumber}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">score: {r.score}</span>
                      <span className="text-xs text-slate-400">#{i + 1}</span>
                    </div>
                  </div>
                  {r.highlights.length > 0 && (
                    <div className="space-y-1">
                      {r.highlights.map((h, j) => (
                        <p key={j} className="text-xs text-slate-700 bg-amber-50 border-l-2 border-amber-400 px-2 py-1">{h}</p>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3">{r.chunk.text.slice(0, 300)}...</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.chunk.metadata.tags.slice(0, 4).map(t => <Badge key={t}>{t}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'documents' | 'upload' | 'search' | 'settings';

export function KnowledgeBasePage() {
  const { documents, totalChunks, isReady, isIndexing } = useRAG();
  const [tab, setTab] = useState<Tab>('documents');

  const userDocCount = documents.filter(d => d.type === 'uploaded').length;
  const builtinDocCount = documents.filter(d => d.type === 'builtin').length;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'documents', label: 'Documents', icon: <BookOpen size={15} /> },
    { id: 'upload', label: 'Add Document', icon: <Plus size={15} /> },
    { id: 'search', label: 'Search', icon: <Search size={15} /> },
    { id: 'settings', label: 'AI Settings', icon: <Settings size={15} /> },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Database size={20} className="text-emerald-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Knowledge Base</h1>
            <p className="text-sm text-slate-500">Page-indexed documents for RAG-powered skills and search</p>
          </div>
          {(isIndexing || !isReady) && (
            <div className="ml-auto flex items-center gap-2 text-indigo-600 text-sm">
              <Loader size={14} className="animate-spin" /> Indexing...
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Built-in Frameworks', value: builtinDocCount, color: 'text-slate-700' },
            { label: 'Uploaded Documents', value: userDocCount, color: 'text-indigo-700' },
            { label: 'Total Page Chunks', value: totalChunks.toLocaleString(), color: 'text-emerald-700' },
            { label: 'Index Status', value: isReady ? 'Ready' : 'Loading', color: isReady ? 'text-emerald-600' : 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'documents' && <DocumentList />}
      {tab === 'upload' && <UploadPanel />}
      {tab === 'search' && <SearchPanel />}
      {tab === 'settings' && <LLMConfigPanel />}
    </div>
  );
}
