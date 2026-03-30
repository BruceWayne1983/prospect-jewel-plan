import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/emma-assistant`;

interface EmmaAssistantProps {
  displayName: string;
  context: Record<string, any>;
}

export function EmmaAssistant({ displayName, context }: EmmaAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const firstName = displayName?.split(" ")[0] || "Emma Louise";

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Good to see you, ${firstName}! 👋\n\nWhat would you like to work on today? I can help you:\n\n- 📋 **Plan your day** — visits, calls & follow-ups\n- 🔍 **Find new prospects** in your territory\n- 📊 **Review account health** & pipeline\n- 🗺️ **Plan a route** for your next trip\n\nJust ask me anything!`
      }]);
    }
  }, [open, firstName]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          context,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({ error: "Something went wrong" }));
        setMessages(prev => [...prev, { role: "assistant", content: errData.error || "Sorry, something went wrong. Try again!" }]);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > allMessages.length) {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't connect. Please try again!" }]);
    }
    setIsLoading(false);
  };

  const quickActions = [
    "What should I focus on today?",
    "Which accounts need attention?",
    "Help me plan a route",
    "Find me new prospects",
  ];

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gold-gradient shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" style={{ color: "hsl(var(--sidebar-background))" }} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-4rem)] bg-card border border-border/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/30 bg-card">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" style={{ color: "hsl(var(--sidebar-background))" }} />
              </div>
              <div>
                <p className="text-sm font-display font-semibold text-foreground">Your AI Assistant</p>
                <p className="text-[10px] text-muted-foreground">Nomination Territory Planner</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted/50 text-foreground rounded-bl-sm"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:text-foreground text-[13px] leading-relaxed">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-[13px] leading-relaxed">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted/50 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-gold" />
                </div>
              </div>
            )}

            {/* Quick actions on first open */}
            {messages.length === 1 && !isLoading && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {quickActions.map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); setTimeout(() => { setInput(q); }, 0); }}
                    className="text-[11px] text-left px-3 py-2 rounded-xl border border-border/30 hover:border-gold/30 hover:bg-champagne/10 text-muted-foreground hover:text-foreground transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border/30 bg-card">
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-muted/30 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/40 transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center disabled:opacity-40 transition-opacity shadow-sm"
              >
                <Send className="w-4 h-4" style={{ color: "hsl(var(--sidebar-background))" }} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
