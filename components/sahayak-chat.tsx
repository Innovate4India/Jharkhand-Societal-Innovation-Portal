"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, Loader2, Send, Sparkles, X } from "lucide-react";
import { chatWithSahayak } from "@/lib/api";

type SahayakResponse = {
  message?: string;
  understanding?: { summary?: string };
  severity?: string;
  can_solve_myself?: boolean;
  solution_info?: { steps?: string[]; tools_materials?: string[]; estimated_time?: string; estimated_cost?: string };
  safety_guidance?: { precautions?: string[]; when_to_stop?: string };
  escalation?: { required?: boolean; contact?: string; reason?: string };
  prevention?: string[];
  helplines?: { name?: string; number?: string; purpose?: string }[];
};

type Message = { id: number; author: "user" | "sahayak"; text?: string; response?: SahayakResponse };
type View = "citizen" | "submit" | "challenges";

const quickActions: { label: string; view: View }[] = [
  { label: "Submit a Problem", view: "submit" },
  { label: "Browse Challenges", view: "challenges" },
  { label: "My Submissions", view: "citizen" },
];

function ResponseBody({ response }: { response: SahayakResponse }) {
  if (response.message) {
    return <p dir="auto" className="text-sm leading-6">{response.message}</p>;
  }

  const sections = [
    ["What Sahayak understood", response.understanding?.summary],
    ["Next steps", response.solution_info?.steps],
    ["Safety", response.safety_guidance?.precautions],
    ["Stop and get help if", response.safety_guidance?.when_to_stop],
    ["When to get help", response.escalation?.contact],
    ["Prevention", response.prevention],
    ["Estimated time", response.solution_info?.estimated_time],
    ["Estimated cost", response.solution_info?.estimated_cost],
  ] as const;
  return (
    <div className="space-y-3 text-sm leading-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
          {response.severity || "Guidance"}
        </span>
        <span className="text-xs font-semibold text-slate-500">
          {response.can_solve_myself ? "Safe basic steps available" : "Professional help may be needed"}
        </span>
      </div>
      {sections.map(([title, content]) => {
        if (!content || (Array.isArray(content) && content.length === 0)) return null;
        return (
          <section key={title}>
            <p className="font-bold text-slate-800">{title}</p>
            {Array.isArray(content) ? (
              <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600">
                {content.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : <p className="mt-1 text-slate-600">{content}</p>}
          </section>
        );
      })}
      {response.helplines?.length ? (
        <section>
          <p className="font-bold text-slate-800">Verified helplines</p>
          <div className="mt-1 space-y-1 text-slate-600">
            {response.helplines.slice(0, 3).map((helpline) => (
              <p key={`${helpline.name}-${helpline.number}`}>
                {helpline.name}: <a className="font-bold text-emerald-800 underline" href={`tel:${helpline.number}`}>{helpline.number}</a>
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function SahayakChat({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, author: "sahayak", text: "Hello! I am Sahayak. Tell me about a local problem or ask how the portal can help." },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(event?: React.FormEvent, preset?: string) {
    event?.preventDefault();
    const problem = (preset ?? input).trim();
    if (!problem || sending) return;
    setError("");
    if (!preset) setInput("");
    setMessages((current) => [...current, { id: Date.now(), author: "user", text: problem }]);
    setSending(true);
    const response = await chatWithSahayak(problem, language);
    setSending(false);
    if (!response.success || !response.data) {
      setError(response.message === "fetch failed" ? "Sahayak is unavailable right now. Please try again." : response.message || "Sahayak is unavailable right now. Please try again.");
      return;
    }
    setMessages((current) => [...current, { id: Date.now() + 1, author: "sahayak", response: response.data }]);
  }

  return (
    <>
      <section className={`mobile-sahayak-window fixed inset-x-4 bottom-24 z-50 flex max-h-[min(680px,calc(100vh-7rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition duration-200 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[min(410px,calc(100vw-2rem))] ${isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`} aria-label="Sahayak chat" aria-hidden={!isOpen} inert={!isOpen ? true : undefined}>
          <header className="flex items-start justify-between gap-2 bg-emerald-900 px-3 py-3 text-white sm:gap-3 sm:px-4 sm:py-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-400 text-emerald-950"><Bot className="size-5" /></span><div className="min-w-0"><h2 className="font-bold">Sahayak</h2><p className="break-words text-xs text-emerald-100">Your AI assistant for the Jharkhand Innovation Portal</p></div></div>
            <div className="flex shrink-0 items-center gap-1"><label className="sr-only" htmlFor="sahayak-language">Language</label><select id="sahayak-language" value={language} onChange={(event) => setLanguage(event.target.value as "en" | "hi")} className="max-w-[84px] rounded-md border-0 bg-white/10 px-1 py-1 text-xs text-white outline-none [&>option]:text-slate-900"><option value="en">English</option><option value="hi">हिंदी</option></select><button onClick={() => setIsOpen(false)} aria-label="Close Sahayak" className="rounded-lg p-2 hover:bg-white/10"><X className="size-5" /></button></div>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.author === "user" ? "justify-end" : "justify-start"}`}>
                <div className={message.author === "user" ? "max-w-[85%] rounded-2xl rounded-br-md bg-emerald-800 px-3.5 py-2.5 text-sm leading-6 text-white" : "max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-3 text-slate-700 shadow-sm"}>
                  {message.text ? <p dir="auto">{message.text}</p> : <ResponseBody response={message.response!} />}
                </div>
              </div>
            ))}
            {sending ? <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" />Sahayak is thinking...</div> : null}
            <div ref={messagesEndRef} />
          </div>
          {error ? <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p> : null}
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {quickActions.map((action) => <button key={action.label} onClick={() => { setIsOpen(false); onNavigate(action.view); }} className="shrink-0 rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50">{action.label}</button>)}
              <button onClick={() => void sendMessage(undefined, "How does this portal work?")} disabled={sending} className="shrink-0 rounded-full border border-orange-200 px-3 py-1.5 text-xs font-bold text-orange-800 hover:bg-orange-50 disabled:opacity-50">How does this portal work?</button>
            </div>
            <form onSubmit={sendMessage} className="flex items-end gap-2">
              <label className="sr-only" htmlFor="sahayak-input">Message Sahayak</label>
              <textarea id="sahayak-input" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={1} disabled={sending} placeholder="Describe your problem..." className="min-h-10 flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-100" />
              <button type="submit" disabled={sending || !input.trim()} aria-label="Send message" className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"><Send className="size-4" /></button>
            </form>
          </div>
      </section>
      <button onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen} aria-label={isOpen ? "Close Sahayak" : "Open Sahayak assistant"} className="mobile-sahayak-trigger fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-emerald-900 px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-700/25 sm:right-6"><Sparkles className="size-4 text-orange-300" />Sahayak<ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} /></button>
    </>
  );
}