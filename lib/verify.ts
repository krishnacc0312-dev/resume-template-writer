// Accuracy check: compares the resume being exported with the original file's lines.
import type { LineRole, ResumeData } from "./types";

const cmp = (s: string) =>
  s.replace(/[•]/g, " ").replace(/[,;|]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

export type Report = {
  ok: boolean;
  missing: string[];          // original lines that are not in the new resume
  changed: { where: string; text: string }[]; // text in the new resume that isn't in the original
  placed: number;
  total: number;
};

export function fieldsOf(d: ResumeData): { where: string; text: string }[] {
  const f: { where: string; text: string }[] = [];
  const push = (where: string, text: string) => { if (text && text.trim()) f.push({ where, text }); };
  push("Name", d.name); push("Title", d.title);
  d.contact.forEach((c) => push("Contact", c));
  d.summary.forEach((s, i) => push(`Summary item ${i + 1}`, s));
  d.skills.forEach((s, i) => { push(`Skill row ${i + 1} label`, s.cat); push(`Skill row ${i + 1}`, s.items); });
  d.clients.forEach((c, i) => {
    const w = `Client ${i + 1}`;
    push(`${w} name`, c.client); push(`${w} location`, c.location); push(`${w} role`, c.role); push(`${w} dates`, c.dates);
    c.description.forEach((x) => push(`${w} description`, x));
    c.responsibilities.forEach((x, j) => push(`${w} bullet ${j + 1}`, x));
    push(`${w} environment`, c.environment);
  });
  d.education.forEach((e, i) => push(`Education ${i + 1}`, e));
  return f;
}

const SKIP: LineRole[] = ["heading", "label", "ignored", "other"];

export function verify(data: ResumeData, lines: string[], roles: LineRole[]): Report {
  const source = cmp(lines.join(" "));
  const fields = fieldsOf(data);
  const changed = fields.filter((f) => !source.includes(cmp(f.text)));
  const output = fields.map((f) => cmp(f.text)).join(" \u0000 ");
  const missing: string[] = [];
  let total = 0;
  lines.forEach((l, i) => {
    if (SKIP.includes(roles[i])) return;
    total++;
    // Labels like "Client:" or "Environment:" are template text, so compare without them.
    const t = cmp(l.replace(/^(?:client|company|employer|role|title|position|designation|duration|period|location|environment|technologies(?:\s+used)?|tech(?:nology)?\s*stack|tools(?:\s*(?:&|and)\s*technologies)?)\s*(?:name)?\s*[:\-–]\s*/i, ""));
    if (!t) return;
    if (output.includes(t)) return;
    // A line split across fields (e.g. "Client, City, ST   Dates") counts if each part is present.
    const parts = t.split(/\s{2,}|\s[–—-]\s|\s@\s|:\s+/).map((p) => p.trim()).filter((p) => p.length > 1);
    const tokens = t.split(" ").filter((w) => w.length > 1);
    if (parts.length > 1 && parts.every((p) => output.includes(p))) return;
    if (tokens.length && tokens.every((w) => output.includes(w)) && tokens.length <= 14) return;
    missing.push(l);
  });
  return { ok: !missing.length && !changed.length, missing, changed, placed: total - missing.length, total };
}
