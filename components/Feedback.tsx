"use client";
import { useEffect, useState } from "react";

const KINDS = ["My resume came out wrong", "Something isn't working", "Idea or suggestion", "Other"];

/** Floating Feedback button with a short form. Hidden until the site owner sets up a destination. */
export default function Feedback() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(KINDS[0]);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/feedback").then((r) => r.json()).then((j) => setEnabled(!!j.enabled)).catch(() => {}); }, []);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);
  if (!enabled) return null;

  async function send(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (message.trim().length < 5) { setError("Write a little more so we can understand the problem."); return; }
    setState("sending");
    try {
      const r = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, message, email, page: location.pathname }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setState("sent"); setMessage("");
    } catch (err) { setError(err instanceof Error && err.message ? err.message : "Your message couldn't be sent."); setState("idle"); }
  }

  return (
    <>
      <button type="button" className="fb-btn" onClick={() => { setOpen(true); setState("idle"); }}>💬 Feedback</button>
      {open && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="fb-title" onClick={() => setOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={send}>
            <h3 id="fb-title">Send feedback</h3>
            {state === "sent" ? (
              <>
                <p className="muted" style={{ margin: "10px 0 0" }}>Thanks, your message was sent.</p>
                <div className="row end"><button type="button" className="btn primary" onClick={() => setOpen(false)}>Close</button></div>
              </>
            ) : (
              <>
                <p className="muted">Tell us what happened. Please don&apos;t paste your whole resume.</p>
                <div className="field" style={{ marginTop: 12 }}>
                  <label htmlFor="fb-kind">What is it about?</label>
                  <select id="fb-kind" value={kind} onChange={(e) => setKind(e.target.value)} style={{ maxWidth: "none", padding: 8, fontSize: 14 }}>
                    {KINDS.map((k) => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="fb-msg">Message</label>
                  <textarea id="fb-msg" rows={5} value={message} onChange={(e) => { setMessage(e.target.value); setError(""); }}
                    placeholder="For example: the client 'Acme Corp' was split into two entries" />
                </div>
                <div className="field">
                  <label htmlFor="fb-email">Your email (optional, if you'd like a reply)</label>
                  <input id="fb-email" type="text" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
                </div>
                {error && <p className="err" role="alert">{error}</p>}
                <div className="row end">
                  <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
                  <button type="submit" className="btn primary" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send"}</button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </>
  );
}
