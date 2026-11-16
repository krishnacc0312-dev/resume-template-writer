// Plain text version of a resume, for job portals that ask you to paste text.
import type { ResumeData } from "./types";

export function toPlainText(d: ResumeData): string {
  const out: string[] = [];
  const sec = (t: string) => { out.push("", t.toUpperCase(), "-".repeat(t.length)); };
  if (d.name) out.push(d.name);
  if (d.title) out.push(d.title);
  if (d.contact.length) out.push(d.contact.join(" | "));
  if (d.summary.length) { sec("Professional Summary"); d.summary.forEach((s) => out.push("• " + s)); }
  if (d.skills.length) { sec("Technical Skills"); d.skills.forEach((s) => out.push(s.cat ? `${s.cat}: ${s.items}` : s.items)); }
  if (d.clients.length) {
    sec("Professional Experience");
    d.clients.forEach((c, i) => {
      if (i) out.push("");
      out.push([c.client + (c.location ? ", " + c.location : ""), c.dates].filter(Boolean).join(" | "));
      if (c.role) out.push(c.role);
      c.description.forEach((x) => out.push(x));
      if (c.responsibilities.length) { out.push("Responsibilities:"); c.responsibilities.forEach((r) => out.push("• " + r)); }
      if (c.environment) out.push("Environment: " + c.environment);
    });
  }
  if (d.education.length) { sec("Education"); d.education.forEach((e) => out.push(e)); }
  return out.join("\r\n").trim() + "\r\n";
}
