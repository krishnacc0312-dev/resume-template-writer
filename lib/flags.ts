// Resume flags: technology release dates vs. the client timeline, the timeline itself, and ATS keywords.
// Pure functions with no AI; runs in the browser.
import type { ResumeData } from "./types";
import { TECH, monthIndex, fmtYM, type Tech } from "./techDates";

export type Severity = "error" | "warn" | "ok" | "info";
export type Flag = { severity: Severity; title: string; detail?: string; where?: string };
export type FlagReport = {
  tech: Flag[];
  timeline: Flag[];
  ats: { flags: Flag[]; found: string[]; missing: string[]; unusedSkills: string[]; notInSkills: string[] };
  counts: { error: number; warn: number };
};

/* ---------------- Dates ---------------- */
const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const NOW_WORDS = /present|current|till\s*(?:date|now|today)|to\s*date|now|ongoing|today|continuing/i;

function parseOne(s: string, isEnd: boolean, now: number): number | null {
  const t = s.trim().toLowerCase().replace(/[()]/g, "");
  if (!t) return null;
  if (NOW_WORDS.test(t)) return now;
  let m = t.match(/([a-z]{3})[a-z]*\.?\s*,?\s*'?(\d{2,4})/);
  if (m && MONTHS[m[1]] !== undefined) return year(m[2]) * 12 + MONTHS[m[1]];
  m = t.match(/(\d{1,2})\s*[/.\-]\s*(\d{2,4})/);
  if (m && +m[1] >= 1 && +m[1] <= 12) return year(m[2]) * 12 + (+m[1] - 1);
  m = t.match(/((?:19|20)\d{2})/);
  if (m) return +m[1] * 12 + (isEnd ? 11 : 0);
  return null;
}
function year(y: string) { const n = +y; return y.length === 2 ? (n > 50 ? 1900 + n : 2000 + n) : n; }

/** "Jan 2020 – Present" -> [start, end] as month indexes. */
export function parseRange(dates: string, now = currentMonth()): [number, number] | null {
  if (!dates || !dates.trim()) return null;
  const parts = dates.split(/\s*(?:-|–|—|~|\bto\b|\btill\b(?!\s*(?:date|now|today))|\buntil\b|\bthrough\b|\bthru\b)\s*/i).filter(Boolean);
  if (parts.length >= 2) {
    const a = parseOne(parts[0], false, now), b = parseOne(parts.slice(1).join(" "), true, now);
    if (a !== null && b !== null) return [a, b];
  }
  const since = dates.match(/(?:since|from)\s+(.+)/i);
  if (since) { const a = parseOne(since[1], false, now); if (a !== null) return [a, now]; }
  return null;
}
export function currentMonth() { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); }
const ym = (i: number) => fmtYM(`${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`);
const months = (n: number) => {
  const y = Math.floor(n / 12), m = n % 12;
  return [y ? `${y} year${y > 1 ? "s" : ""}` : "", m ? `${m} month${m > 1 ? "s" : ""}` : ""].filter(Boolean).join(" ") || "0 months";
};

/* ---------------- Technology mentions ---------------- */
const VERSION_LIST = "\\s*(?:SE\\s*)?(?:v(?:ersion)?\\.?\\s*)?\\(?\\s*((?:\\d{1,2}(?:\\.\\d{1,2})?)(?:\\s*(?:/|,|&|and|or)\\s*\\d{1,2}(?:\\.\\d{1,2})?(?![\\d.]*\\s*(?:years?|yrs|%|\\+\\s*years)))*)(?![\\d.]*\\s*(?:years?|yrs|%|ms|seconds|minutes|hours|days|months|million|k\\b))";
const compiled = TECH.map((t) => ({
  t,
  re: new RegExp(`(?<![\\w.])(?:${t.re})(?![\\w])(?:${t.versions ? VERSION_LIST : "(?!)"})?`, "gi")
}));

export type Mention = { tech: Tech; label: string; ga: string };

/** All technologies (with versions where written) mentioned in a text. */
export function mentions(text: string): Mention[] {
  const out: Mention[] = [];
  const seen = new Set<string>();
  for (const { t, re } of compiled) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const list = m[1];
      if (list && t.versions) {
        for (let v of list.split(/\s*(?:\/|,|&|and|or)\s*/i)) {
          if (t.oneDot && /^1\.\d/.test(v)) v = v.split(".")[1];
          const ga = t.versions[v] || t.versions[v.split(".")[0]];
          const label = `${t.name} ${v}`;
          if (ga && !seen.has(label)) { seen.add(label); out.push({ tech: t, label, ga }); }
        }
      } else if (!seen.has(t.name)) {
        seen.add(t.name); out.push({ tech: t, label: t.name, ga: t.ga });
      }
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  return out;
}

/* ---------------- ATS keywords ---------------- */
// Keywords recruiters commonly search for in Senior Full Stack Developer roles. Each entry: label and pattern.
const ATS_KEYWORDS: [string, RegExp][] = [
  ["Java or JavaScript/TypeScript back end", /\bjava\b(?!\s*script)|node\.?js|nodejs|\bc#|\.net|python|golang/i],
  ["JavaScript", /javascript|\bjs\b|es6/i],
  ["TypeScript", /typescript/i],
  ["React or Angular", /react|angular|vue/i],
  ["HTML5 / CSS3", /html|css/i],
  ["Spring Boot or Node.js framework", /spring\s*boot|express|nestjs|\.net core|django|fastapi|flask/i],
  ["Microservices", /micro-?services?/i],
  ["REST APIs", /\brest(?:ful)?\b|rest api/i],
  ["GraphQL", /graphql/i],
  ["SQL database", /\bsql\b|oracle|postgres|mysql|sql server|db2|mariadb/i],
  ["NoSQL database", /nosql|mongo|dynamo|cassandra|cosmos|couchbase|redis/i],
  ["Cloud (AWS, Azure or GCP)", /\baws\b|amazon web services|azure|\bgcp\b|google cloud/i],
  ["Docker", /docker|container/i],
  ["Kubernetes", /kubernetes|\bk8s\b|openshift|\beks\b|\baks\b|\bgke\b/i],
  ["CI/CD", /ci\s*\/\s*cd|continuous (?:integration|delivery|deployment)|jenkins|github actions|gitlab|azure devops|bamboo|circleci/i],
  ["Git", /\bgit\b|github|gitlab|bitbucket/i],
  ["Messaging (Kafka, RabbitMQ…)", /kafka|rabbit\s*mq|activemq|\bjms\b|\bsqs\b|pub\/?sub|kinesis/i],
  ["Unit testing", /junit|jest|mockito|jasmine|karma|pytest|mocha|unit test|\btdd\b/i],
  ["Security (OAuth, JWT)", /oauth|jwt|spring security|saml|sso|okta/i],
  ["Agile / Scrum", /agile|scrum|kanban/i],
  ["Monitoring and logging", /splunk|elk|kibana|prometheus|grafana|datadog|new relic|cloudwatch|dynatrace/i],
  ["Infrastructure as code", /terraform|cloudformation|\bcdk\b|ansible|pulumi|bicep/i]
];

const clientText = (d: ResumeData) => d.clients.map((c) => [c.role, ...c.description, ...c.responsibilities, c.environment].join(" ")).join(" \n ");
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Split a skills line into individual skills: "AWS (EC2, S3), Docker" -> ["AWS", "Docker"]. */
function skillItems(items: string): string[] {
  let depth = 0, cur = "";
  const out: string[] = [];
  for (const ch of items) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === ";") && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.replace(/\(.*?\)/g, "").replace(/\b(?:v?\d+(?:\.\d+)*\+?)(?:\s*\/\s*\d+(?:\.\d+)*)*\b/g, "").replace(/\.$/, "").trim()).filter((s) => s.length > 1 && s.length < 40);
}

/* ---------------- Main ---------------- */
export function checkResume(d: ResumeData, now = currentMonth()): FlagReport {
  const tech: Flag[] = [];
  const timeline: Flag[] = [];
  const ranges = d.clients.map((c) => parseRange(c.dates, now));
  const nameOf = (i: number) => d.clients[i].client || d.clients[i].role || `Client ${i + 1}`;

  // 1. Technology release dates vs. each client's dates.
  d.clients.forEach((c, i) => {
    const r = ranges[i];
    if (!r) return;
    const [start, end] = r;
    const text = [...c.description, ...c.responsibilities, c.environment, c.role].join(" \n ");
    for (const m of mentions(text)) {
      const ga = monthIndex(m.ga);
      if (ga > end) {
        tech.push({ severity: "error", where: nameOf(i),
          title: `${m.label} at ${nameOf(i)} (${c.dates})`,
          detail: `${m.label} was released in ${fmtYM(m.ga)}, after this client ended (${ym(end)}).` });
      } else if (ga > start && end - ga < 3) {
        tech.push({ severity: "warn", where: nameOf(i),
          title: `${m.label} at ${nameOf(i)} (${c.dates})`,
          detail: `${m.label} was released in ${fmtYM(m.ga)}, less than 3 months before this client ended. Recruiters may question it.` });
      }
    }
  });
  if (!tech.length) tech.push({ severity: "ok", title: "No technology appears before its release date", detail: "Every technology version mentioned under a client was released before that client ended." });

  // 2. Client timeline.
  d.clients.forEach((c, i) => {
    const r = ranges[i];
    if (!c.dates.trim()) timeline.push({ severity: "warn", title: `${nameOf(i)} has no dates`, detail: "Recruiters expect a start and end month for every client." });
    else if (!r) timeline.push({ severity: "warn", title: `${nameOf(i)}: dates couldn't be read`, detail: `"${c.dates}" isn't in a usual format such as "Jan 2020 – Present" or "01/2020 - 12/2022".` });
    else {
      if (r[1] < r[0]) timeline.push({ severity: "error", title: `${nameOf(i)}: end date is before start date`, detail: c.dates });
      if (r[0] > now) timeline.push({ severity: "error", title: `${nameOf(i)}: start date is in the future`, detail: c.dates });
      if (r[1] > now && !NOW_WORDS.test(c.dates)) timeline.push({ severity: "warn", title: `${nameOf(i)}: end date is in the future`, detail: c.dates });
    }
  });
  const valid = ranges.map((r, i) => ({ r, i })).filter((x): x is { r: [number, number]; i: number } => !!x.r && x.r[1] >= x.r[0]);
  // Order: most recent first.
  for (let k = 1; k < valid.length; k++) {
    if (valid[k].r[0] > valid[k - 1].r[0]) {
      timeline.push({ severity: "warn", title: "Clients aren't in reverse date order", detail: `${nameOf(valid[k].i)} starts after ${nameOf(valid[k - 1].i)} but is listed below it. US resumes list the most recent client first.` });
      break;
    }
  }
  const sorted = [...valid].sort((a, b) => a.r[0] - b.r[0]);
  for (let k = 1; k < sorted.length; k++) {
    const prev = sorted[k - 1], cur = sorted[k];
    const overlap = Math.min(prev.r[1], cur.r[1]) - cur.r[0];
    if (overlap >= 1) timeline.push({ severity: "warn", title: `${nameOf(prev.i)} and ${nameOf(cur.i)} overlap by ${months(overlap)}`,
      detail: `${d.clients[prev.i].dates} and ${d.clients[cur.i].dates}. Make sure this is intended; recruiters ask about overlapping full-time roles.` });
    const gap = cur.r[0] - prev.r[1] - 1;
    if (gap >= 3) timeline.push({ severity: gap >= 6 ? "warn" : "info", title: `${months(gap)} gap between ${nameOf(prev.i)} and ${nameOf(cur.i)}`,
      detail: `${nameOf(prev.i)} ended ${ym(prev.r[1])}; ${nameOf(cur.i)} started ${ym(cur.r[0])}. Be ready to explain it.` });
  }
  if (sorted.length) {
    const first = sorted[0].r[0], last = Math.max(...sorted.map((s) => s.r[1]));
    const span = last - first + 1;
    const claim = [...d.summary, d.title].join(" ").match(/(\d{1,2})\s*\+?\s*(?:years|yrs)/i);
    if (claim) {
      const claimed = +claim[1];
      if (claimed * 12 > span + 12) timeline.push({ severity: "warn", title: `Summary says ${claim[0]}, but the clients cover ${months(span)}`,
        detail: `Clients run from ${ym(first)} to ${ym(last)}. Add the missing earlier roles, or adjust the summary.` });
      else timeline.push({ severity: "ok", title: `Experience claim matches the timeline`, detail: `Summary says ${claim[0]}; clients cover ${months(span)} (${ym(first)} – ${ym(last)}).` });
    }
  }
  if (!timeline.some((f) => f.severity === "error" || f.severity === "warn")) timeline.unshift({ severity: "ok", title: "Client timeline looks consistent", detail: "Dates are readable, in order, and have no overlaps or long gaps." });

  // 3. ATS keywords.
  const all = [d.title, ...d.summary, ...d.skills.map((s) => s.cat + " " + s.items), clientText(d)].join(" \n ");
  const found: string[] = [], missing: string[] = [];
  for (const [label, re] of ATS_KEYWORDS) (re.test(all) ? found : missing).push(label);
  const cText = clientText(d);
  const skillsText = d.skills.map((s) => s.items).join(", ");
  const unusedSkills = Array.from(new Set(d.skills.flatMap((s) => skillItems(s.items))))
    .filter((k) => !new RegExp(`(?<![\\w])${esc(k).replace(/\\\s+|\s+/g, "\\s*")}(?![\\w])`, "i").test(cText));
  const inClients = new Map<string, string>();
  for (const m of mentions(cText)) inClients.set(m.tech.name, m.tech.name);
  const skillNames = new Set(mentions(skillsText + " " + d.summary.join(" ")).map((m) => m.tech.name));
  const notInSkills = [...inClients.keys()].filter((n) => !skillNames.has(n));
  const atsFlags: Flag[] = [];
  const contact = d.contact.join(" ");
  if (!/@/.test(contact)) atsFlags.push({ severity: "error", title: "No email address in the header" });
  if (!/\d{3}[\s.\-)]*\d{3}[\s.\-]*\d{4}/.test(contact)) atsFlags.push({ severity: "warn", title: "No phone number in the header" });
  if (!/linkedin/i.test(contact)) atsFlags.push({ severity: "info", title: "No LinkedIn profile in the header", detail: "Most US recruiters look for one." });
  if (!d.title) atsFlags.push({ severity: "info", title: "No job title under the name", detail: "A title like \"Senior Full Stack Developer\" helps ATS keyword matching." });
  if (missing.length) atsFlags.push({ severity: missing.length > 4 ? "warn" : "info", title: `${missing.length} commonly searched keyword${missing.length > 1 ? "s" : ""} not found`, detail: missing.join(", ") });
  else atsFlags.push({ severity: "ok", title: "All commonly searched keywords are present" });
  if (notInSkills.length) atsFlags.push({ severity: "info", title: `${notInSkills.length} technolog${notInSkills.length > 1 ? "ies" : "y"} used at clients but not in Skills`, detail: notInSkills.join(", ") });
  if (unusedSkills.length) atsFlags.push({ severity: "info", title: `${unusedSkills.length} skill${unusedSkills.length > 1 ? "s" : ""} not mentioned at any client`, detail: "Recruiters often check that listed skills show up in your experience: " + unusedSkills.slice(0, 40).join(", ") + (unusedSkills.length > 40 ? "…" : "") });

  const every = [...tech, ...timeline, ...atsFlags];
  return {
    tech, timeline,
    ats: { flags: atsFlags, found, missing, unusedSkills, notInSkills },
    counts: { error: every.filter((f) => f.severity === "error").length, warn: every.filter((f) => f.severity === "warn").length }
  };
}
