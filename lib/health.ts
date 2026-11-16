// Resume health check: consistency and writing issues recruiters notice. No AI.
import type { ResumeData } from "./types";
import type { Flag } from "./flags";

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function dateStyle(d: string): string | null {
  const t = d.trim();
  if (!t) return null;
  if (/\b(?:January|February|March|April|June|July|August|September|October|November|December)\b/.test(t)) return "full month name (January 2020)";
  if (/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s*'?\d/.test(t)) return "short month name (Jan 2020)";
  if (/\b\d{1,2}\s*[/.\-]\s*\d{2,4}\b/.test(t)) return "numbers (01/2020)";
  if (/\b(?:19|20)\d{2}\b/.test(t)) return "year only (2020)";
  return null;
}

// Terms often written several ways in one resume.
const SPELLINGS: [string, RegExp][] = [
  ["JavaScript", /\bjava\s?script\b/gi], ["TypeScript", /\btype\s?script\b/gi], ["Node.js", /\bnode(?:\.|\s)?js\b/gi],
  ["React", /\breact(?:\.|\s)?js\b|\breact\b(?!\s*native)/gi], ["Angular", /\bangular\b(?!\s*js)/gi], ["PostgreSQL", /\bpostgre(?:s|sql)\b/gi],
  ["MongoDB", /\bmongo\s?db\b/gi], ["GitHub", /\bgit\s?hub\b/gi], ["Microservices", /\bmicro-?\s?services?\b/gi],
  ["Spring Boot", /\bspring\s?boot\b/gi], ["MySQL", /\bmy\s?sql\b/gi], ["Kubernetes", /\bkubernetes\b/gi], ["DynamoDB", /\bdynamo\s?db\b/gi],
["CI/CD", /\bci\s?\/\s?cd\b/gi], ["Jenkins", /\bjenkins\b/gi], ["Hibernate", /\bhibernate\b/gi]
];

export function healthCheck(d: ResumeData, pages?: number): Flag[] {
  const f: Flag[] = [];
  const name = (i: number) => d.clients[i].client || d.clients[i].role || `Client ${i + 1}`;
  const bullets = d.clients.flatMap((c, i) => c.responsibilities.map((b) => ({ b, i })));

  // Dates written in different styles.
  const styles = new Map<string, string[]>();
  d.clients.forEach((c, i) => { const s = dateStyle(c.dates); if (s) styles.set(s, [...(styles.get(s) || []), name(i)]); });
  if (styles.size > 1) f.push({ severity: "warn", title: "Client dates use different styles",
    detail: [...styles.entries()].map(([s, n]) => `${s}: ${n.join(", ")}`).join(" · ") + ". Use one style everywhere." });
  const endWords = new Set(d.clients.map((c) => (c.dates.match(/present|current|till\s*date|to\s*date|now|ongoing/i) || [""])[0].toLowerCase()).filter(Boolean));
  if (endWords.size > 1) f.push({ severity: "info", title: "Ongoing roles are written in different ways", detail: [...endWords].map((w) => `"${w}"`).join(", ") });
  const dashes = new Set(d.clients.map((c) => (c.dates.match(/\s[-–—]\s|[-–—]/) || [""])[0].trim()).filter(Boolean));
  if (dashes.size > 1) f.push({ severity: "info", title: "Date ranges mix hyphens and dashes", detail: "For example \"Jan 2020 - Present\" and \"Jan 2020 – Present\"." });

  // Client entries.
  d.clients.forEach((c, i) => {
    if (!c.responsibilities.length && !c.description.length) f.push({ severity: "warn", title: `${name(i)} has no responsibilities` });
    if (!c.role) f.push({ severity: "warn", title: `${name(i)} has no role` });
    if (!c.location) f.push({ severity: "info", title: `${name(i)} has no location`, detail: "US recruiters expect City, ST for each client." });
    if (!c.environment) f.push({ severity: "info", title: `${name(i)} has no Environment line`, detail: "C2C resumes usually list the technologies used at each client." });
  });

  // Bullets.
  const long = bullets.filter((x) => words(x.b) > 45);
  if (long.length) f.push({ severity: "info", title: `${long.length} very long bullet${long.length > 1 ? "s" : ""} (over 45 words)`,
    detail: long.slice(0, 4).map((x) => `${name(x.i)}: "${x.b.split(/\s+/).slice(0, 8).join(" ")}…"`).join(" · ") });
  const short = bullets.filter((x) => words(x.b) < 4);
  if (short.length) f.push({ severity: "info", title: `${short.length} very short bullet${short.length > 1 ? "s" : ""} (under 4 words)`, detail: short.slice(0, 6).map((x) => `"${x.b}"`).join(", ") });
  const seen = new Map<string, number[]>();
  bullets.forEach((x) => { const k = norm(x.b); if (k.length > 15) seen.set(k, [...(seen.get(k) || []), x.i]); });
  d.summary.forEach((s) => { const k = norm(s); if (seen.has(k)) seen.get(k)!.push(-1); });
  const dups = [...seen.entries()].filter(([, v]) => v.length > 1);
  if (dups.length) f.push({ severity: "warn", title: `${dups.length} bullet${dups.length > 1 ? "s are" : " is"} repeated word for word`,
    detail: dups.slice(0, 4).map(([k, v]) => `"${k.split(" ").slice(0, 8).join(" ")}…" in ${[...new Set(v.map((i) => (i < 0 ? "Summary" : name(i))))].join(", ")}`).join(" · ") });
  const firsts = new Map<string, number>();
  bullets.forEach((x) => { const w = (x.b.match(/^[A-Za-z]+/) || [""])[0]; if (w) firsts.set(w.toLowerCase(), (firsts.get(w.toLowerCase()) || 0) + 1); });
  const top = [...firsts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 6 && top[1] / Math.max(1, bullets.length) > 0.2) f.push({ severity: "info", title: `"${top[0][0].toUpperCase() + top[0].slice(1)}" starts ${top[1]} of ${bullets.length} bullets`, detail: "Varying the opening verbs reads better (Built, Designed, Led, Migrated, Automated…)." });
  const all = [...d.summary, ...bullets.map((x) => x.b)];
  const withDot = all.filter((b) => /[.]\s*$/.test(b)).length;
  if (withDot && withDot < all.length && withDot / all.length > 0.15 && withDot / all.length < 0.85)
    f.push({ severity: "info", title: "Some bullets end with a full stop and some don't", detail: `${withDot} of ${all.length} end with "."` });
  const lower = all.filter((b) => /^[a-z]/.test(b.trim()));
  if (lower.length) f.push({ severity: "info", title: `${lower.length} bullet${lower.length > 1 ? "s start" : " starts"} with a lowercase letter`, detail: lower.slice(0, 3).map((b) => `"${b.slice(0, 50)}…"`).join(", ") });
  const pron = all.filter((b) => /\b(?:I|my|me)\b/.test(b));
  if (pron.length) f.push({ severity: "info", title: `${pron.length} bullet${pron.length > 1 ? "s use" : " uses"} "I", "my" or "me"`, detail: "Resumes are usually written without first-person words." });

  // Sections.
  if (!d.skills.length) f.push({ severity: "error", title: "No Technical Skills section" });
  if (!d.summary.length) f.push({ severity: "warn", title: "No Professional Summary" });
  else if (d.summary.length > 16) f.push({ severity: "info", title: `Summary has ${d.summary.length} bullets`, detail: "8–14 bullets is typical for a senior C2C resume." });
  if (!d.education.length) f.push({ severity: "info", title: "No Education entry", detail: "Many vendors and clients ask for degree details." });
  if (pages && pages > 6) f.push({ severity: "info", title: `The resume is ${pages} pages`, detail: "Use Fit to pages to bring it to 4 or 5 pages." });

  // Spelling consistency.
  const text = [d.title, ...d.summary, ...d.skills.map((s) => s.cat + " " + s.items), ...d.clients.flatMap((c) => [c.role, ...c.description, ...c.responsibilities, c.environment])].join(" \n ");
  const mixed: string[] = [];
  for (const [label, re] of SPELLINGS) {
    // Only the first letter's case may differ ("microservices" mid-sentence is fine).
    const forms = new Set((text.match(re) || []).map((s) => { const x = s.replace(/\s+/g, " "); return x[0].toUpperCase() + x.slice(1); }));
    if (forms.size > 1) mixed.push(`${label}: ${[...forms].map((x) => `"${x}"`).join(", ")}`);
  }
  if (mixed.length) f.push({ severity: "info", title: `${mixed.length} term${mixed.length > 1 ? "s are" : " is"} spelled more than one way`, detail: mixed.slice(0, 6).join(" · ") });

  if (!f.some((x) => x.severity === "error" || x.severity === "warn")) f.unshift({ severity: "ok", title: "No major consistency problems found", detail: "Remaining notes below are optional polish." });
  return f;
}
