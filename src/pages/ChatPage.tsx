import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, ChevronRight, Shield, BookOpen, GitCompare, Search, AlertTriangle } from 'lucide-react';
import { useRAG } from '../context/RAGContext';
import { FRAMEWORK_MAP, ALL_FRAMEWORKS } from '../data/frameworks';
import type { FrameworkId } from '../types/filters';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
  isLoading?: boolean;
  skillUsed?: string;
}

// ─── Intent detection helpers ─────────────────────────────────────────────────

const FRAMEWORK_KEYWORDS: Record<string, FrameworkId> = {
  'nist csf': 'nist-csf', 'nist-csf': 'nist-csf', 'csf': 'nist-csf',
  'nist 800': 'nist-800-53', 'sp 800': 'nist-800-53', '800-53': 'nist-800-53',
  'iso 27001': 'iso-27001', 'iso27001': 'iso-27001',
  'gdpr': 'gdpr',
  'hipaa': 'hipaa',
  'pci dss': 'pci-dss', 'pci': 'pci-dss',
  'soc 2': 'soc2', 'soc2': 'soc2',
  'ccpa': 'ccpa',
  'iec 62443': 'iec-62443', '62443': 'iec-62443',
  'responsible ai': 'responsible-ai', 'ai rmf': 'responsible-ai',
  'eu ai act': 'eu-ai-act', 'ai act': 'eu-ai-act',
  'cra': 'cra', 'cyber resilience': 'cra', 'cyber resilience act': 'cra',
};

const REGION_FRAMEWORKS: Record<string, FrameworkId[]> = {
  'eu': ['gdpr', 'eu-ai-act', 'cra'],
  'europe': ['gdpr', 'eu-ai-act', 'cra'],
  'european': ['gdpr', 'eu-ai-act', 'cra'],
  'uk': ['gdpr', 'iso-27001'],
  'us': ['nist-csf', 'ccpa', 'hipaa'],
  'usa': ['nist-csf', 'ccpa', 'hipaa'],
  'america': ['nist-csf', 'ccpa'],
  'california': ['ccpa'],
};

const INDUSTRY_FRAMEWORKS: Record<string, FrameworkId[]> = {
  'fintech': ['gdpr', 'pci-dss', 'eu-ai-act', 'nist-csf'],
  'finance': ['gdpr', 'pci-dss', 'soc2', 'nist-csf'],
  'banking': ['gdpr', 'pci-dss', 'nist-csf', 'soc2'],
  'healthcare': ['hipaa', 'gdpr', 'eu-ai-act', 'nist-csf'],
  'hospital': ['hipaa', 'gdpr', 'nist-csf'],
  'retail': ['pci-dss', 'gdpr', 'ccpa', 'eu-ai-act'],
  'ecommerce': ['pci-dss', 'gdpr', 'ccpa'],
  'government': ['nist-800-53', 'eu-ai-act', 'gdpr', 'nist-csf'],
  'ot': ['iec-62443', 'nist-csf'],
  'industrial': ['iec-62443', 'cra', 'nist-csf'],
  'manufacturing': ['iec-62443', 'cra', 'iso-27001'],
  'ai': ['eu-ai-act', 'responsible-ai', 'gdpr'],
  'machine learning': ['eu-ai-act', 'responsible-ai'],
  'saas': ['soc2', 'gdpr', 'nist-csf', 'iso-27001'],
  'cloud': ['soc2', 'nist-csf', 'iso-27001', 'cra'],
  'telecom': ['gdpr', 'cra', 'nist-csf'],
  'insurance': ['gdpr', 'eu-ai-act', 'responsible-ai'],
};

function detectFrameworkInText(text: string): FrameworkId | null {
  const lower = text.toLowerCase();
  for (const [keyword, fwId] of Object.entries(FRAMEWORK_KEYWORDS)) {
    if (lower.includes(keyword)) return fwId;
  }
  return null;
}

function detectRegionFrameworks(text: string): FrameworkId[] {
  const lower = text.toLowerCase();
  const found = new Set<FrameworkId>();
  for (const [keyword, fwIds] of Object.entries(REGION_FRAMEWORKS)) {
    if (lower.includes(keyword)) fwIds.forEach(f => found.add(f));
  }
  return [...found];
}

function detectIndustryFrameworks(text: string): FrameworkId[] {
  const lower = text.toLowerCase();
  const found = new Set<FrameworkId>();
  for (const [keyword, fwIds] of Object.entries(INDUSTRY_FRAMEWORKS)) {
    if (lower.includes(keyword)) fwIds.forEach(f => found.add(f));
  }
  return [...found];
}

function detectTwoFrameworks(text: string): [FrameworkId, FrameworkId] | null {
  const lower = text.toLowerCase();
  const found: FrameworkId[] = [];
  for (const [keyword, fwId] of Object.entries(FRAMEWORK_KEYWORDS)) {
    if (lower.includes(keyword) && !found.includes(fwId)) found.push(fwId);
    if (found.length === 2) return [found[0], found[1]];
  }
  return null;
}

// ─── Message rendering ────────────────────────────────────────────────────────

function MessageBubble({ msg, onSuggestion }: { msg: ChatMessage; onSuggestion: (s: string) => void }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
        isUser ? 'bg-indigo-600' : 'bg-gradient-to-br from-violet-500 to-indigo-600'
      }`}>
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
      </div>

      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
        }`}>
          {msg.isLoading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs">Analysing...</span>
            </div>
          ) : (
            <MarkdownContent content={msg.content} />
          )}
        </div>

        {/* Skill tag */}
        {msg.skillUsed && (
          <div className="flex items-center gap-1 text-xs text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
            <Sparkles size={10} />
            {msg.skillUsed}
          </div>
        )}

        {/* Suggestions */}
        {msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {msg.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestion(s)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-full transition-colors"
              >
                <ChevronRight size={10} />
                {s}
              </button>
            ))}
          </div>
        )}

        <span className="text-xs text-slate-400">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <p key={i} className="font-semibold text-slate-800 mt-2">{line.slice(4)}</p>;
        if (line.startsWith('## ')) return <p key={i} className="font-bold text-slate-900 mt-2 text-base">{line.slice(3)}</p>;
        if (line.startsWith('# ')) return <p key={i} className="font-bold text-slate-900 mt-1 text-base">{line.slice(2)}</p>;
        if (line.startsWith('- ') || line.startsWith('• ')) {
          const text = line.slice(2);
          return <p key={i} className="flex gap-2"><span className="text-indigo-400 mt-0.5">•</span><span>{renderInline(text)}</span></p>;
        }
        if (/^\d+\.\s/.test(line)) {
          const [num, ...rest] = line.split('. ');
          return <p key={i} className="flex gap-2"><span className="text-indigo-500 font-semibold min-w-[16px]">{num}.</span><span>{renderInline(rest.join('. '))}</span></p>;
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
      : part
  );
}

// ─── Quick-start prompts ──────────────────────────────────────────────────────

const QUICK_STARTS = [
  { icon: Shield, label: 'Which frameworks do I need?', prompt: 'Which compliance frameworks do I need for my business?' },
  { icon: BookOpen, label: 'Explain a framework', prompt: 'Explain the EU AI Act and who it applies to' },
  { icon: GitCompare, label: 'Compare two frameworks', prompt: 'Compare GDPR and CCPA for data protection' },
  { icon: Search, label: 'Search controls', prompt: 'What are the requirements for data encryption and access control?' },
  { icon: AlertTriangle, label: 'Help with gaps', prompt: 'How do I remediate non-compliance gaps in GDPR?' },
];

// ─── Main ChatPage ─────────────────────────────────────────────────────────────

export function ChatPage() {
  const { runSkill, search, llmConfig, isReady } = useRAG();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `# Hello! I'm your Compliance Advisor

I can help you navigate compliance frameworks, understand regulatory requirements, and build a roadmap for your organisation.

**What I can do:**
- Recommend frameworks based on your industry and region
- Explain any of the 12 supported GRC frameworks in detail
- Compare two frameworks side by side
- Search across controls and requirements
- Help you understand and prioritise compliance gaps

What would you like to explore?`,
      timestamp: new Date().toISOString(),
      suggestions: [
        'Which frameworks do I need for EU fintech?',
        'Explain the EU AI Act',
        'Compare GDPR and CCPA',
        'What are NIST CSF requirements?',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages(prev => [...prev, { ...msg, id }]);
    return id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const processMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isProcessing) return;

    setIsProcessing(true);
    const userTimestamp = new Date().toISOString();

    // Add user message
    addMessage({ role: 'user', content: userText, timestamp: userTimestamp });

    // Add loading placeholder
    const loadingId = addMessage({ role: 'assistant', content: '', timestamp: new Date().toISOString(), isLoading: true });

    try {
      const lower = userText.toLowerCase();
      let responseContent = '';
      let suggestions: string[] = [];
      let skillUsed: string | undefined;

      // ── Intent: compare two frameworks ──
      const twoFws = detectTwoFrameworks(lower);
      if ((lower.includes('compare') || lower.includes('vs') || lower.includes('versus') || lower.includes('difference')) && twoFws) {
        const result = await runSkill('cross-framework', { frameworkIdA: twoFws[0], frameworkIdB: twoFws[1] });
        responseContent = result.analysis;
        skillUsed = 'Cross-Framework Comparison';
        suggestions = [
          `Tell me more about ${FRAMEWORK_MAP[twoFws[0]]?.shortName}`,
          `Tell me more about ${FRAMEWORK_MAP[twoFws[1]]?.shortName}`,
          'What frameworks do I need for EU?',
        ];
      }

      // ── Intent: analyse a specific framework ──
      else if ((lower.includes('explain') || lower.includes('analyse') || lower.includes('analyze') || lower.includes('tell me about') || lower.includes('what is') || lower.includes('requirements')) && detectFrameworkInText(lower)) {
        const fwId = detectFrameworkInText(lower)!;
        const result = await runSkill('framework-analysis', { frameworkId: fwId });
        responseContent = result.analysis;
        skillUsed = 'Framework Analysis';
        const fw = FRAMEWORK_MAP[fwId];
        suggestions = [
          `What are the critical controls in ${fw?.shortName}?`,
          `Compare ${fw?.shortName} with another framework`,
          'Which other frameworks should I consider?',
        ];
      }

      // ── Intent: recommend frameworks by region/industry ──
      else if (lower.includes('which framework') || lower.includes('what framework') || lower.includes('do i need') || lower.includes('recommend') || lower.includes('should i use')) {
        const regionFws = detectRegionFrameworks(lower);
        const industryFws = detectIndustryFrameworks(lower);
        const combined = [...new Set([...regionFws, ...industryFws])];

        if (combined.length > 0) {
          const fwDetails = combined.slice(0, 5).map(fwId => {
            const fw = FRAMEWORK_MAP[fwId];
            if (!fw) return '';
            const isMandatory = regionFws.includes(fwId);
            return `- **${fw.shortName}** — ${fw.name} ${isMandatory ? '*(Mandatory)*' : ''}\n  ${fw.description.slice(0, 120)}...`;
          }).join('\n\n');

          responseContent = `## Recommended Frameworks

Based on your query, here are the most relevant compliance frameworks:\n\n${fwDetails}

## Next Steps
- Start a **New Assessment** to evaluate your current compliance posture
- Use **Framework Analysis** for a deep dive into any specific framework
- Check mandatory frameworks for your region first`;

          suggestions = combined.slice(0, 3).map(fwId => `Analyse ${FRAMEWORK_MAP[fwId]?.shortName}`);
          suggestions.push('Start a compliance assessment');
        } else {
          // Ask clarifying question
          responseContent = `## Tell me more about your organisation

To recommend the right frameworks, I need a bit more context:

**1. Where does your organisation operate?**
- European Union (GDPR, EU AI Act, CRA are mandatory)
- United Kingdom
- United States / North America
- Global

**2. What industry are you in?**
- Financial services / Fintech
- Healthcare
- Retail / E-commerce
- Industrial / Manufacturing
- AI / Technology
- Government

**3. Do you handle any of the following?**
- Personal data of EU residents
- Payment card data
- Health records
- AI / automated decision-making systems
- Operational technology (OT/ICS)`;

          suggestions = [
            'EU fintech company',
            'US healthcare organisation',
            'Global SaaS company using AI',
            'EU industrial manufacturer',
          ];
        }
      }

      // ── Intent: gap / remediation ──
      else if (lower.includes('gap') || lower.includes('remediati') || lower.includes('non-compliant') || lower.includes('fix') || lower.includes('how do i')) {
        const fwId = detectFrameworkInText(lower);
        if (fwId) {
          const result = await runSkill('gap-enrichment', {
            frameworkId: fwId,
            gaps: [],
          });
          responseContent = result.analysis;
          skillUsed = 'Gap Enrichment';
        } else {
          // RAG search for remediation guidance
          const results = search(userText, { topK: 5 });
          if (results.length > 0) {
            const topResults = results.slice(0, 3).map((r, i) =>
              `### [${i + 1}] ${r.chunk.metadata.title}\n*${r.chunk.metadata.source}*\n\n${r.chunk.text.slice(0, 300)}...`
            ).join('\n\n---\n\n');
            responseContent = `## Remediation Guidance\n\nHere's what I found in the knowledge base:\n\n${topResults}`;
            skillUsed = 'Knowledge Base Search';
          } else {
            responseContent = `## Remediation Guidance

To give you specific remediation steps, please tell me:

- **Which framework** are you working on? (e.g., GDPR, NIST CSF, EU AI Act)
- **Which control or area** is non-compliant?

For example: *"How do I remediate GDPR data retention gaps?"*`;
          }
        }
        suggestions = [
          'Show me a GDPR remediation roadmap',
          'NIST CSF gap remediation steps',
          'EU AI Act compliance requirements',
        ];
      }

      // ── Intent: control search (general query) ──
      else {
        const result = await runSkill('control-search', { query: userText });
        responseContent = result.analysis;
        skillUsed = 'Control Search';

        // Suggest follow-ups based on detected frameworks
        const detectedFw = detectFrameworkInText(lower);
        if (detectedFw) {
          suggestions = [
            `Full analysis of ${FRAMEWORK_MAP[detectedFw]?.shortName}`,
            `Remediation guide for ${FRAMEWORK_MAP[detectedFw]?.shortName}`,
          ];
        } else {
          suggestions = [
            'Recommend frameworks for my industry',
            'Compare GDPR and CCPA',
            'Explain the EU AI Act',
          ];
        }
      }

      updateMessage(loadingId, {
        content: responseContent,
        isLoading: false,
        suggestions,
        skillUsed,
        timestamp: new Date().toISOString(),
      });

    } catch (err) {
      updateMessage(loadingId, {
        content: `I encountered an error processing your request. Please try rephrasing or ask about a specific framework.\n\n*Error: ${err instanceof Error ? err.message : 'Unknown error'}*`,
        isLoading: false,
        suggestions: ['Which frameworks do I need?', 'Explain GDPR', 'Compare NIST CSF and ISO 27001'],
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, addMessage, updateMessage, runSkill, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    processMessage(input.trim());
    setInput('');
  };

  const handleSuggestion = (s: string) => {
    processMessage(s);
  };

  const handleReset = () => {
    setMessages([{
      id: 'welcome-reset',
      role: 'assistant',
      content: `Conversation cleared. How can I help you with compliance today?`,
      timestamp: new Date().toISOString(),
      suggestions: [
        'Which frameworks do I need for EU fintech?',
        'Explain the EU AI Act',
        'Compare GDPR and CCPA',
        'What are NIST CSF requirements?',
      ],
    }]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">Compliance Advisor</h2>
          <p className="text-xs text-slate-500">
            {isReady
              ? `RAG-powered · ${llmConfig.provider !== 'none' && llmConfig.apiKey ? `${llmConfig.provider} synthesis enabled` : 'Template mode'}`
              : 'Initialising knowledge base...'}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
        >
          <RefreshCw size={12} />
          New chat
        </button>
      </div>

      {/* Quick-starts (shown only at start) */}
      {messages.length <= 1 && (
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 flex-shrink-0">
          {QUICK_STARTS.map(({ icon: Icon, label, prompt }) => (
            <button
              key={label}
              onClick={() => handleSuggestion(prompt)}
              className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-center group"
            >
              <div className="w-9 h-9 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center transition-colors">
                <Icon size={18} className="text-indigo-600" />
              </div>
              <span className="text-xs font-medium text-slate-700 group-hover:text-indigo-700 leading-tight">{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} onSuggestion={handleSuggestion} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* All 12 frameworks quick-access (collapsed hint) */}
      <div className="px-6 py-2 flex-shrink-0 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {ALL_FRAMEWORKS.map(fw => (
            <button
              key={fw.id}
              onClick={() => handleSuggestion(`Analyse ${fw.shortName}`)}
              className="flex-shrink-0 text-xs px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 rounded-full transition-colors"
            >
              {fw.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }
            }}
            placeholder="Ask about compliance frameworks, controls, or requirements..."
            rows={2}
            className="flex-1 px-4 py-3 text-sm border border-slate-200 rounded-xl resize-none outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Press Enter to send · Shift+Enter for new line · Powered by RAG + BM25
        </p>
      </div>
    </div>
  );
}
