import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { Sparkles, X, Send, MessageCircle, BotMessageSquare } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/roadmaps';

const ProjectChatAssistant = ({ projectId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const token = localStorage.getItem('gitmentor_token');
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;

    const userMsg = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsThinking(true);

    try {
      const res = await fetch(`${API_BASE}/${projectId}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: trimmed,
          history: updatedMessages.slice(-15)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please check your network and try again.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Markdown renderer for chat messages
  const renderContent = (text) => {
    if (!text) return null;

    // Split by code blocks first
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, i) => {
      // Code blocks
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeContent = part.slice(3, -3);
        const firstNewline = codeContent.indexOf('\n');
        const code = firstNewline > -1 ? codeContent.slice(firstNewline + 1) : codeContent;
        return (
          <pre key={i} className="bg-black/40 rounded-lg p-3 my-2 overflow-x-auto text-[13px] font-mono text-muted-cyan/90 border border-white/5">
            <code>{code}</code>
          </pre>
        );
      }

      // Process lines for headings, lists, etc.
      const lines = part.split('\n');
      const elements = [];
      let listItems = [];
      let listType = null; // 'ul' or 'ol'

      const flushList = () => {
        if (listItems.length > 0) {
          const Tag = listType === 'ol' ? 'ol' : 'ul';
          const className = listType === 'ol'
            ? 'list-decimal list-inside space-y-1 my-2 text-canvas-white/85'
            : 'list-disc list-inside space-y-1 my-2 text-canvas-white/85';
          elements.push(<Tag key={`list-${elements.length}`} className={className}>{listItems}</Tag>);
          listItems = [];
          listType = null;
        }
      };

      lines.forEach((line, li) => {
        const trimmed = line.trim();
        if (!trimmed) {
          flushList();
          return;
        }

        // Headings: ### / ## / #
        const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (headingMatch) {
          flushList();
          const level = headingMatch[1].length;
          const headingText = headingMatch[2];
          const size = level === 1 ? 'text-base font-semibold' : level === 2 ? 'text-[15px] font-semibold' : 'text-[14px] font-medium';
          elements.push(<p key={`h-${i}-${li}`} className={`${size} text-canvas-white mt-2 mb-1`}>{renderInline(headingText)}</p>);
          return;
        }

        // Bullet list: - or *
        const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
        if (bulletMatch) {
          if (listType !== 'ul') flushList();
          listType = 'ul';
          listItems.push(<li key={`li-${i}-${li}`}>{renderInline(bulletMatch[1])}</li>);
          return;
        }

        // Numbered list: 1. 2. etc.
        const numMatch = trimmed.match(/^\d+\.\s+(.+)$/);
        if (numMatch) {
          if (listType !== 'ol') flushList();
          listType = 'ol';
          listItems.push(<li key={`li-${i}-${li}`}>{renderInline(numMatch[1])}</li>);
          return;
        }

        // Regular paragraph line
        flushList();
        elements.push(<span key={`p-${i}-${li}`}>{renderInline(trimmed)}<br /></span>);
      });

      flushList();
      return <span key={i}>{elements}</span>;
    });
  };

  // Inline formatting: **bold** and `code`
  const renderInline = (text) => {
    return text.split(/(\*\*.*?\*\*|`[^`]+`)/g).map((segment, j) => {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        return <strong key={j} className="text-canvas-white font-semibold">{segment.slice(2, -2)}</strong>;
      }
      if (segment.startsWith('`') && segment.endsWith('`')) {
        return <code key={j} className="bg-white/[0.06] px-1.5 py-0.5 rounded text-[13px] font-mono text-muted-cyan">{segment.slice(1, -1)}</code>;
      }
      return <span key={j}>{segment}</span>;
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-muted-cyan to-blue-400 text-bg-deep shadow-[0_0_25px_rgba(88,166,255,0.3)] flex items-center justify-center hover:scale-110 hover:shadow-[0_0_35px_rgba(88,166,255,0.4)] transition-all duration-300 animate-pulse-glow ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        title="Project Mentor"
      >
        <BotMessageSquare size={26} />
      </button>

      {/* Chat Panel Overlay */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />

        {/* Chat Panel */}
        <div className={`absolute bottom-4 right-4 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-2rem)] bg-bg-base/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-elevation-4 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-muted-cyan/10 border border-muted-cyan/20 flex items-center justify-center">
                <BotMessageSquare size={16} className="text-muted-cyan" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-canvas-white leading-tight">Project Mentor</h3>
                <p className="text-[11px] text-muted-steel">AI assistant for this project</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-muted-steel hover:text-canvas-white hover:bg-white/[0.05] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 && !isThinking && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 rounded-full bg-muted-cyan/10 border border-muted-cyan/20 flex items-center justify-center mb-4">
                  <MessageCircle size={28} className="text-muted-cyan" />
                </div>
                <h4 className="text-canvas-white font-medium mb-2">How can I help?</h4>
                <p className="text-sm text-muted-steel leading-relaxed max-w-[280px]">
                  Ask me anything about this project — tech stack, architecture, phase guidance, debugging help, or best practices.
                </p>
                <div className="mt-5 space-y-2 w-full">
                  {[
                    "How should I structure this project?",
                    "Explain the tech stack choices",
                    "What should I focus on first?"
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(suggestion);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      className="w-full text-left text-xs text-muted-steel hover:text-canvas-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl px-3 py-2.5 transition-all duration-300 hover:border-muted-cyan/20 hover:shadow-[0_0_10px_rgba(88,166,255,0.06)]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-muted-cyan to-blue-400 text-bg-deep font-medium rounded-br-sm shadow-[0_0_15px_rgba(88,166,255,0.2)]'
                    : 'bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] text-canvas-white/90 rounded-bl-sm shadow-elevation-1'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <BotMessageSquare size={12} className="text-muted-cyan" />
                      <span className="text-[10px] font-mono text-muted-steel uppercase tracking-wider">Mentor</span>
                    </div>
                  )}
                  <div className="text-[14px]">{renderContent(msg.content)}</div>
                </div>
              </div>
            ))}

            {/* Thinking Indicator */}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-muted-surface border border-white/[0.05] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={12} className="text-muted-cyan" />
                    <span className="text-[10px] font-mono text-muted-steel uppercase tracking-wider">Mentor</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-muted-cyan animate-pulse" />
                    <span className="text-sm text-muted-steel">Thinking</span>
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 bg-muted-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1 h-1 bg-muted-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1 h-1 bg-muted-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="shrink-0 border-t border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your project..."
                rows={1}
                className="flex-1 resize-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-canvas-white placeholder:text-muted-steel/40 focus:outline-none focus:border-muted-cyan/40 focus:shadow-[0_0_15px_rgba(88,166,255,0.1)] transition-all duration-300 max-h-[100px] overflow-y-auto"
                style={{ minHeight: '44px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-muted-cyan to-blue-400 text-bg-deep flex items-center justify-center hover:shadow-[0_0_15px_rgba(88,166,255,0.3)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectChatAssistant;
