"use client";
import { useEffect, useState } from "react";

export default function ContactForm() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [name, setName] = useState(""), [email, setEmail] = useState(""), [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/feedback").then((r) => r.json()).then((j) => setEnabled(!!j.enabled)).catch(() => setEnabled(false)); }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Enter your email address so we can reply."); return; }
    if (message.trim().length < 5) { setError("Write a little more in your message."); return; }
    setState("sending");
    try {
      const r = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "Contact", name, email, message, page: "/contact" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setState("sent");
    } catch (err) { setError(err instanceof Error && err.message ? err.message : "Your message couldn't be sent."); setState("idle"); }
  }

  if (enabled === false) return <p className="muted" style={{ marginTop: 20 }}>The contact form isn&apos;t available yet.</p>;
  if (state === "sent") return (
    <div className="check ok" style={{ marginTop: 22 }}><strong>✓ Message sent</strong><p>Thanks. We&apos;ll reply to {email}.</p></div>
  );
  return (
    <form className="contact-form" onSubmit={send} noValidate>
      <div className="two">
        <div className="field"><label htmlFor="c-name">Name (optional)</label><input id="c-name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
        <div className="field"><label htmlFor="c-email">Email</label><input id="c-email" type="text" inputMode="email" autoComplete="email" value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="name@example.com" /></div>
      </div>
      <div className="field"><label htmlFor="c-msg">Message</label>
        <textarea id="c-msg" rows={7} value={message} onChange={(e) => { setMessage(e.target.value); setError(""); }} /></div>
      {error && <p className="err" role="alert">{error}</p>}
      <div className="row end" style={{ marginTop: 10 }}>
        <button type="submit" className="btn primary" disabled={state === "sending" || enabled === null}>{state === "sending" ? "Sending…" : "Send message"}</button>
      </div>
    </form>
  );
}
