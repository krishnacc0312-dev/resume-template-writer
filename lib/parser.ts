// Rule-based resume parser. No AI: dictionaries, patterns and a state machine.
// Text is never rewritten; every field is copied from the source lines.
import type { ClientEntry, LineRole, OtherSection, ParseResult, ResumeData, RichLine } from "./types";
import { emptyClient } from "./types";

type Section = "header" | "summary" | "skills" | "experience" | "education" | "other";

/* ---------------- Dictionaries ---------------- */
const SECTION_NAMES: Record<string, Section> = {};
const add = (s: Section, names: string[]) => names.forEach((n) => (SECTION_NAMES[n] = s));
add("summary", [
  "summary", "professional summary", "career summary", "executive summary", "profile", "professional profile",
  "profile summary", "summary of qualifications", "qualifications summary", "career objective", "objective",
  "professional overview", "overview", "about me", "career profile", "experience summary", "summary of experience",
  "technical summary", "professional experience summary", "career highlights", "highlights", "professional highlights"
]);
add("skills", [
  "skills", "technical skills", "technical skill set", "skill set", "skillset", "key skills", "core skills",
  "technical expertise", "core competencies", "competencies", "technical competencies", "technical proficiency",
  "technical proficiencies", "technologies", "tools and technologies", "tools & technologies", "technical stack",
  "tech stack", "areas of expertise", "expertise", "it skills", "software skills", "technical knowledge", "skills summary",
  "technical skills summary", "professional skills"
]);
add("experience", [
  "experience", "professional experience", "work experience", "employment history", "work history",
  "employment", "career history", "relevant experience", "professional work experience", "project experience",
  "projects experience", "client experience", "consulting experience", "it experience", "experience details",
  "professional background", "employment experience", "work profile", "projects", "project details", "project profile",
  "professional experience and projects", "experience and projects"
]);
add("education", [
  "education", "educational qualification", "educational qualifications", "academic qualification",
  "academic qualifications", "academics", "academic background", "educational background", "education details",
  "qualifications", "education and certifications", "education & certifications", "academic details", "education and training"
]);
add("other", [
  "certifications", "certification", "certificates", "licenses and certifications", "awards", "honors", "honours",
  "achievements", "accomplishments", "awards and achievements", "publications", "languages", "languages known",
  "personal details", "personal information", "personal profile", "references", "declaration", "training", "trainings",
  "volunteer", "volunteering", "volunteer experience", "interests", "hobbies", "extracurricular activities",
  "visa status", "work authorization", "patents", "courses", "professional development", "memberships", "contact",
  "contact information", "additional information", "strengths"
]);

const SECTION_FUZZY: [RegExp, Section][] = [
  [/certif|award|achievement|honou?r|publication|personal|reference|declaration|training|volunteer|interest|hobb|accomplish|visa|patent|course|membership|language/i, "other"],
  [/education|academic|qualification|degree/i, "education"],
  [/skill|competenc|technolog|expertise|proficienc|tool/i, "skills"],
  [/experience|employment|work history|career history|project/i, "experience"],
  [/summary|profile|objective|overview|about me|highlight/i, "summary"]
];

const MONTH = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.?";
const D1 = `(?:${MONTH}\\s*,?\\s*'?\\d{2,4}|\\d{1,2}\\s*[/.\\-]\\s*\\d{2,4}|(?:19|20)\\d{2})`;
const DEND = `(?:${D1}|Present|Current(?:ly)?|Till\\s*(?:Date|Now|Today)|To\\s*Date|Date|Now|Ongoing|Today|Continuing)`;
const DATE_RANGE = new RegExp(`\\(?\\s*${D1}\\s*(?:-|–|—|~|to|till|until|through|thru)\\s*${DEND}\\s*\\)?`, "i");
const DATE_SINCE = new RegExp(`\\(?\\s*(?:since|from)\\s+${D1}\\s*\\)?`, "i");

const STATES = "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|PR";
const STATE_NAMES = "Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming";
const COUNTRIES = "USA|U\\.S\\.A\\.?|US|United States|India|Canada|UK|United Kingdom|Australia|Germany|Singapore|Mexico|Ireland|Netherlands|UAE|Philippines|Sri Lanka|Pakistan|Bangladesh|Nepal|China|Japan|Poland|Brazil";
const LOC_TAIL = `(?:${STATES}|${STATE_NAMES}|${COUNTRIES})`;
// "City, ST", "City, State", "City, Country", "City, State, Country", "Remote".
const US_TAIL = `(?:${STATES}|${STATE_NAMES})`;
const CTRY_TAIL = `(?:${COUNTRIES})`;
const PLACE = "[A-Z][A-Za-z.'\\- ]{1,30}";
const LOCATION_ONLY_RE = new RegExp(`^\\(?\\s*(?:(?:${PLACE},\\s*)?${US_TAIL}\\.?|(?:${PLACE},\\s*){0,2}${CTRY_TAIL}\\.?|${PLACE},\\s*${US_TAIL},\\s*${CTRY_TAIL}|Remote|Hybrid|Onsite)\\s*\\)?$`);
const LOCATION_ONLY = { test: (s: string) => LOCATION_ONLY_RE.test(s.trim()) && !COMPANY_SUFFIX.test(s) && !/\b(services|technologies|solutions|systems|consult|bank|group)\b/i.test(s) };
const CLIENT_LOC = new RegExp(`^(.*?\\S)\\s*(?:,|\\s[-–—|@]|\\s)\\s*\\(?((?:[A-Z][A-Za-z.'\\- ]{1,30},\\s*)?${LOC_TAIL}\\.?|Remote|Hybrid)\\)?$`);

const ROLE_WORDS = /\b(developer|engineer|architect|lead|consultant|analyst|programmer|manager|specialist|administrator|intern|designer|tester|sde|devops|full[\s-]?stack|front[\s-]?end|back[\s-]?end|scrum master|director|coder|trainee|fellow)\b/i;
const COMPANY_SUFFIX = /\b(inc|llc|ltd|corp|corporation|pvt|plc|limited|l\.l\.c)\b\.?/i;
const COMPANY_WORDS = /\b(inc|llc|ltd|corp|corporation|company|bank|technologies|solutions|systems|group|services|consulting|labs|limited|pvt|plc|insurance|financial|healthcare|health|university|federal|airlines|motors|global|software)\b\.?/i;

const LABEL_CLIENT = /^(?:client|company|employer|organi[sz]ation|customer|firm|end\s*client)\s*(?:name)?\s*[:\-–]\s*/i;
const LABEL_ROLE = /^(?:role|title|position|designation|job\s*title)\s*[:\-–]\s*/i;
const LABEL_DATES = /^(?:duration|period|dates?|tenure|timeline|from)\s*[:\-–]\s*/i;
const LABEL_LOC = /^(?:location|place|city)\s*[:\-–]\s*/i;
const LABEL_RESP = /^(?:(?:key|job|major|my)\s+)?(?:roles?\s*(?:&|and|\/)\s*)?(?:responsibilit(?:y|ies)|duties|contributions?|accomplishments)\s*(?:include|included)?\s*[:\-]?\s*$|^roles?\s*:\s*$/i;
const LABEL_ENV = /^(?:environment|environments|technologies(?:\s+used)?|technology\s*stack|tech(?:nology)?\s*stack|tools(?:\s*(?:&|and)\s*technologies)?|tools\s+used|software\s+used|skills\s+used)\s*[:\-–]\s*/i;
const LABEL_PROJECT = /^(?:project(?:\s*(?:name|title|description|summary|overview|details))?|description|overview|summary)\s*[:\-–]\s*/i;

const DEGREE = /\b(bachelor'?s?|master'?s?|b\.?\s?tech|m\.?\s?tech|b\.\s?e\.?|m\.\s?e\.?|b\.?\s?sc|m\.?\s?sc|b\.?\s?s\.?(?=\s|,|$)|m\.?\s?s\.?(?=\s|,|$)|mba|mca|bca|ph\.?\s?d|doctor(?:ate)?|diploma|associate'?s?\s+degree|b\.?\s?a\.?(?=\s|,|$)|m\.?\s?a\.?(?=\s|,|$)|b\.?\s?com|high school|ssc|hsc|intermediate|graduat)/i;

const CONTACT_HINT = /@|\b(?:phone|mobile|cell|email|e-mail|linkedin|github|portfolio|website|address|tel)\b|https?:\/\/|www\.|\.com\b|\.io\b|\(\d{3}\)|\+\d|\d{3}[\s.\-]\d{3}[\s.\-]\d{4}|\b(?:h-?1b|h4|ead|gc|green card|usc|us citizen|opt|cpt|tn visa|visa|work authorization|relocat)/i;

/* ---------------- Helpers ---------------- */
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const key = (s: string) => s.toLowerCase().replace(/[^a-z& ]+/g, " ").replace(/\s+/g, " ").trim();
const words = (s: string) => norm(s).split(" ").filter(Boolean).length;
const isCaps = (s: string) => /[A-Z]/.test(s) && s === s.toUpperCase() && /[A-Z]{3}/.test(s);
const endsSentence = (s: string) => /[.!?]["')]?$/.test(s.trim());
const trimSep = (s: string) => s.replace(/^[\s,|:;\-–—@()]+|[\s,|:;\-–—@(]+$/g, "").replace(/^\((.*)\)$/, "$1").trim();
const balance = (s: string) => {
  // Drop an unmatched trailing "(" or leading ")" left after splitting.
  let t = s;
  if ((t.match(/\(/g) || []).length > (t.match(/\)/g) || []).length) t = t.replace(/\s*\($/, "");
  return t.trim();
};

// Words that are also common skill categories or field labels: only a heading when styled as one.
const AMBIGUOUS = new Set(["languages", "technologies", "tools and technologies", "tools & technologies", "projects", "summary",
  "overview", "contact", "training", "trainings", "courses", "expertise", "employment", "highlights", "interests",
  "qualifications", "tech stack", "technical stack", "competencies", "strengths"]);

function headingOf(l: RichLine): { section: Section; label: string } | null {
  if (l.bullet || l.cell) return null;
  const t = l.text.replace(/[:\-–—]+\s*$/, "").trim();
  if (!t || t.length > 55) return null;
  const k = key(t);
  const styled = l.heading || l.bold || isCaps(t);
  if (SECTION_NAMES[k] && (styled || !AMBIGUOUS.has(k))) return { section: SECTION_NAMES[k], label: t };
  if (styled && words(t) <= 6 && !/[.,;]$/.test(t) && !DATE_RANGE.test(t) && !LABEL_ENV.test(l.text) && !LABEL_CLIENT.test(l.text)) {
    for (const [re, s] of SECTION_FUZZY) if (re.test(t)) return { section: s, label: t };
  }
  return null;
}

function findDate(s: string): string | null {
  const m = s.match(DATE_RANGE) || s.match(DATE_SINCE);
  return m ? trimSep(m[0]).replace(/^\(|\)$/g, "").trim() : null;
}

/* ---------------- Main ---------------- */
export function parseResume(lines: RichLine[], source: ParseResult["source"]): ParseResult {
  const N = lines.length;
  const roles: LineRole[] = new Array(N).fill("unplaced");
  const data: ResumeData = { name: "", title: "", contact: [], summary: [], skills: [], clients: [], education: [] };
  const other: OtherSection[] = [];
  const isPdf = source === "pdf";

  // Page numbers / repeated headers.
  lines.forEach((l, i) => {
    if (/^(?:page\s*)?\d{1,2}(?:\s*(?:of|\/)\s*\d{1,2})?$/i.test(l.text) || /^page\s+\d+/i.test(l.text)) roles[i] = "ignored";
    if (/^(?:resume|curriculum vitae|cv|r[ée]sum[ée])$/i.test(l.text.trim())) roles[i] = "ignored";
  });

  // Split into sections.
  type Block = { section: Section; label: string; idx: number[] };
  const blocks: Block[] = [{ section: "header", label: "", idx: [] }];
  for (let i = 0; i < N; i++) {
    if (roles[i] === "ignored") continue;
    const h = headingOf(lines[i]);
    if (h) {
      roles[i] = "heading";
      blocks.push({ section: h.section, label: h.label, idx: [] });
      continue;
    }
    const cur = blocks[blocks.length - 1];
    // A "Client:" line outside any experience section starts one.
    if (LABEL_CLIENT.test(lines[i].text) && cur.section !== "experience") {
      blocks.push({ section: "experience", label: "", idx: [i] });
      continue;
    }
    cur.idx.push(i);
  }

  for (const b of blocks) {
    if (b.section === "header") parseHeader(b.idx);
    else if (b.section === "summary") parseItems(b.idx, data.summary, "summary");
    else if (b.section === "skills") parseSkills(b.idx);
    else if (b.section === "experience") parseExperience(b.idx);
    else if (b.section === "education") parseEducation(b.idx);
    else {
      b.idx.forEach((i) => (roles[i] = "other"));
      if (b.idx.length) other.push({ section: b.label || "Other", lines: b.idx.map((i) => lines[i].text) });
    }
  }

  // Lines repeating the name later (page headers) are not content.
  if (data.name) lines.forEach((l, i) => { if (roles[i] === "unplaced" && norm(l.text).toLowerCase() === data.name.toLowerCase()) roles[i] = "ignored"; });

  return {
    data, other, source,
    lines: lines.map((l) => l.text),
    roles,
    unplaced: lines.filter((_, i) => roles[i] === "unplaced").map((l) => l.text)
  };

  /* ---------- Header ---------- */
  function parseHeader(idx: number[]) {
    const items: string[] = [];
    const itemLines: number[] = [];
    for (const i of idx) {
      const l = lines[i];
      const t = l.text;
      // Name: first short line that looks like a person's name.
      if (!data.name) {
        const first = (l.segments && l.segments[0]) || t.split(/\s+\|\s+/)[0];
        if (words(first) >= 1 && words(first) <= 5 && !/[@\d]/.test(first) && !CONTACT_HINT.test(first) && first.length <= 45) {
          data.name = norm(first);
          roles[i] = "name";
          const rest = norm(t.slice(t.indexOf(first) + first.length)).replace(/^[|,\-–—\s]+/, "");
          if (rest) {
            if (ROLE_WORDS.test(rest) && !CONTACT_HINT.test(rest) && words(rest) <= 10) data.title = rest;
            else splitContact(rest).forEach((c) => { items.push(c); itemLines.push(i); });
          }
          continue;
        }
      }
      if (!data.title && ROLE_WORDS.test(t) && !CONTACT_HINT.test(t) && words(t) <= 12 && !endsSentence(t)) {
        data.title = norm(t); roles[i] = "title"; continue;
      }
      if (CONTACT_HINT.test(t) || LOCATION_ONLY.test(t.trim()) || /\s[|•·]\s/.test(t) || (l.segments && l.segments.length > 1)) {
        splitContact(t, l.segments).forEach((c) => { items.push(c); itemLines.push(i); });
        roles[i] = "contact";
        continue;
      }
      if (words(t) >= 12) { data.summary.push(norm(t)); roles[i] = "summary"; continue; }
      if (/^(?:contact|contact info(?:rmation)?|personal details)\s*:?$/i.test(t)) { roles[i] = "label"; continue; }
    }
    // Join a dangling "LinkedIn:" with the value on the next part/line.
    for (let k = 0; k < items.length; k++) {
      if (/:$/.test(items[k]) && k + 1 < items.length) { items[k] = items[k] + " " + items[k + 1]; items.splice(k + 1, 1); }
    }
    data.contact.push(...items.filter(Boolean));
  }
  function splitContact(t: string, segs?: string[]): string[] {
    const parts = (segs && segs.length > 1 ? segs : [t]).flatMap((p) => p.split(/\s*[|•·▪●♦◆]\s*|\s{3,}|\t/));
    return parts.map((p) => trimSep(p) === p.trim() ? p.trim() : p.trim().replace(/^[,;]\s*|[,;]\s*$/g, "")).filter((p) => p && !/^[,;|]$/.test(p));
  }

  /* ---------- Summary-style items ---------- */
  function parseItems(idx: number[], target: string[], role: LineRole) {
    const minX = Math.min(...idx.map((i) => lines[i].x ?? 0));
    let last = -1;
    let lastLine: RichLine | null = null;
    for (const i of idx) {
      const l = lines[i];
      const cont = last >= 0 && !l.bullet && lastLine && (
        (isPdf && ((l.x ?? 0) > minX + 3 && (lastLine.bullet || (lastLine.x ?? 0) > minX + 3))) ||
        (isPdf && !endsSentence(target[last])) ||
        (source === "text" && !endsSentence(target[last]) && /^[a-z(]/.test(l.text))
      );
      if (cont) target[last] = norm(target[last] + " " + l.text);
      else { target.push(norm(l.text)); last = target.length - 1; }
      roles[i] = role;
      lastLine = l;
    }
  }

  /* ---------- Skills ---------- */
  function parseSkills(idx: number[]) {
    const minX = Math.min(...idx.map((i) => lines[i].x ?? 0));
    let pendingCat: string | null = null;
    let k = 0;
    while (k < idx.length) {
      const i = idx[k];
      const l = lines[i];
      roles[i] = "skills";
      // Word table: gather the whole row.
      if (l.cell) {
        const { table, row } = l.cell;
        const cells: string[][] = [];
        let j = k;
        while (j < idx.length && lines[idx[j]].cell && lines[idx[j]].cell!.table === table && lines[idx[j]].cell!.row === row) {
          const c = lines[idx[j]].cell!.col;
          (cells[c] = cells[c] || []).push(lines[idx[j]].text);
          roles[idx[j]] = "skills";
          j++;
        }
        const cellText = cells.map((c) => norm((c || []).join(" ")));
        if (cellText.filter(Boolean).length === 1) {
          addSkillLine(cellText.find(Boolean)!);
        } else {
          for (let c = 0; c < cellText.length; c += 2) {
            const cat = (cellText[c] || "").replace(/\s*[:\-–]\s*$/, "");
            const val = cellText[c + 1] || "";
            if (cat && val) data.skills.push({ cat, items: val });
            else if (cat || val) addSkillLine(cat || val);
          }
        }
        k = j;
        continue;
      }
      const t = l.text;
      const last = data.skills[data.skills.length - 1];
      if (/^[^:]{2,45}:$/.test(t)) { pendingCat = t.replace(/:$/, "").trim(); k++; continue; }
      if (pendingCat) { data.skills.push({ cat: pendingCat, items: norm(t) }); pendingCat = null; k++; continue; }
      const isCont = last && !l.bullet && (
        (isPdf && (l.x ?? 0) > minX + 20) ||
        /[,&/]$/.test(last.items) ||
        (/^[a-z]/.test(t) && !/:/.test(t))
      ) && !(l.segments && l.segments.length > 1) && !/^[^:]{2,45}:\s/.test(t);
      if (isCont) { last.items = norm(last.items + " " + t); k++; continue; }
      addSkillLine(t, l.segments);
      k++;
    }
    if (pendingCat) data.skills.push({ cat: pendingCat, items: "" });
  }
  function addSkillLine(t: string, segs?: string[]) {
    if (segs && segs.length > 1 && words(segs[0]) <= 6 && segs[0].length <= 45) {
      data.skills.push({ cat: segs[0].replace(/\s*[:\-–]\s*$/, ""), items: norm(segs.slice(1).join(" ")) });
      return;
    }
    const m = t.match(/^([^:]{2,50}?)\s*:\s*(.+)$/);
    if (m && words(m[1]) <= 7) data.skills.push({ cat: m[1].trim(), items: norm(m[2]) });
    else data.skills.push({ cat: "", items: norm(t) });
  }

  /* ---------- Experience ---------- */
  function parseExperience(idx: number[]) {
    const minX = Math.min(...idx.map((i) => lines[i].x ?? 0));
    type Entry = ClientEntry & { _body: boolean; _afterLabel: boolean };
    let E = null as Entry | null;
    // The text item that a wrapped PDF line would continue.
    let lastKind: "resp" | "desc" | "env" | null = null;
    let lastLine: RichLine | null = null;

    const start = (): Entry => {
      E = Object.assign(emptyClient(), { _body: false, _afterLabel: false });
      data.clients.push(E);
      lastKind = null;
      return E;
    };
    const cur = () => E || start();

    for (const i of idx) {
      const l = lines[i];
      const t = l.text;
      const prev = lastLine;
      lastLine = l;

      if (!l.bullet && LABEL_RESP.test(t)) { cur()._body = true; cur()._afterLabel = true; roles[i] = "label"; lastKind = null; continue; }

      if (!l.bullet && LABEL_ENV.test(t)) {
        const e = cur();
        const val = t.replace(LABEL_ENV, "").trim();
        e.environment = e.environment ? norm(e.environment + " " + val) : val;
        e._body = true; roles[i] = "environment"; lastKind = "env";
        continue;
      }

      if (!l.bullet && LABEL_CLIENT.test(t)) {
        if (!E || E._body || E.client) start();
        headerFields(cur(), t, l.segments);
        roles[i] = "client-header"; lastKind = null;
        continue;
      }
      if (!l.bullet && (LABEL_ROLE.test(t) || LABEL_DATES.test(t) || LABEL_LOC.test(t))) {
        const isRole = LABEL_ROLE.test(t);
        if (!E || E._body || (isRole && E.role)) start();
        headerFields(cur(), t, l.segments);
        roles[i] = "client-header"; lastKind = null;
        continue;
      }
      if (!l.bullet && LABEL_PROJECT.test(t) && words(t) > 1) {
        const e = cur();
        e.description.push(norm(t)); roles[i] = "description"; lastKind = "desc";
        continue;
      }

      if (l.bullet) {
        const e = cur();
        e.responsibilities.push(norm(t)); e._body = true; roles[i] = "responsibility"; lastKind = "resp";
        continue;
      }

      // Plain line: continuation, a new entry header, or body text.
      const isContinuation = !!(lastKind && prev && isPdf && (
        ((l.x ?? 0) > minX + 3 && lastKind !== "env") ||
        (lastKind === "env" && !headerish(l)) ||
        (!endsSentence(lastText()) && !headerish(l)) ||
        /^[a-z(]/.test(t)
      ));
      if (isContinuation) { appendLast(t); roles[i] = roleOfKind(lastKind!); continue; }

      if (headerish(l)) {
        const date = findDate(t);
        if (!E || E._body || (date && E.dates)) start();
        headerFields(cur(), t, l.segments);
        roles[i] = "client-header"; lastKind = null;
        continue;
      }

      const e = cur();
      if (!e._body && words(t) <= 12 && !endsSentence(t)) {
        // Still in the entry header (e.g. a client name or role on its own line).
        headerFields(e, t, l.segments);
        roles[i] = "client-header";
        continue;
      }
      if (e._afterLabel || e.responsibilities.length) {
        e.responsibilities.push(norm(t)); e._body = true; roles[i] = "responsibility"; lastKind = "resp";
      } else {
        e.description.push(norm(t)); roles[i] = "description"; lastKind = "desc";
      }
    }
    data.clients.forEach((c) => { const x = c as Partial<Entry>; delete x._body; delete x._afterLabel; });

    function lastText(): string {
      const e = E!;
      if (lastKind === "resp") return e.responsibilities[e.responsibilities.length - 1] || "";
      if (lastKind === "desc") return e.description[e.description.length - 1] || "";
      return e.environment;
    }
    function appendLast(t: string) {
      const e = E!;
      if (lastKind === "resp") e.responsibilities[e.responsibilities.length - 1] = norm(lastText() + " " + t);
      else if (lastKind === "desc") e.description[e.description.length - 1] = norm(lastText() + " " + t);
      else e.environment = norm(e.environment + " " + t);
    }
    function roleOfKind(k: "resp" | "desc" | "env"): LineRole { return k === "resp" ? "responsibility" : k === "desc" ? "description" : "environment"; }
  }

  function headerish(l: RichLine): boolean {
    const t = l.text;
    if (words(t) > 22) return false;
    if (findDate(t) && words(t) <= 18) return true;
    if (l.segments && l.segments.some((s) => findDate(s))) return true;
    if (endsSentence(t)) return false;
    if ((l.bold || l.heading) && words(t) <= 15) return true;
    if (CLIENT_LOC.test(t) && words(t) <= 12) return true;
    if (LOCATION_ONLY.test(t)) return true;
    if (ROLE_WORDS.test(t) && words(t) <= 8 && !/[,;]/.test(t.replace(/,\s*(?:Sr|Jr)\.?/g, ""))) return true;
    return false;
  }

  function headerFields(e: ClientEntry, text: string, segs?: string[]) {
    let parts = segs && segs.length > 1 ? segs.slice() : [text];
    // Split on " | " and similar separators.
    parts = parts.flatMap((p) => p.split(/\s+\|\s+|\s*\|\s*(?=[A-Z])/));
    for (let raw of parts) {
      raw = raw.trim();
      if (!raw) continue;
      if (LABEL_CLIENT.test(raw)) { assignClient(e, raw.replace(LABEL_CLIENT, "")); continue; }
      if (LABEL_ROLE.test(raw)) {
        let v = raw.replace(LABEL_ROLE, "");
        const d = findDate(v); if (d && !e.dates) { e.dates = d; v = v.replace(d, ""); }
        if (!e.role) e.role = balance(trimSep(v)); continue;
      }
      if (LABEL_DATES.test(raw)) { const v = raw.replace(LABEL_DATES, ""); e.dates = findDate(v) || trimSep(v); continue; }
      if (LABEL_LOC.test(raw)) { e.location = trimSep(raw.replace(LABEL_LOC, "")); continue; }
      let rest = raw;
      const d = findDate(rest);
      if (d) { if (!e.dates) e.dates = d; rest = rest.replace(d, " "); rest = rest.replace(/\(\s*\)/g, " "); }
      rest = balance(trimSep(rest));
      if (!rest) continue;
      // "Role @ Company", "Role at Company", "Company - Role"
      const pieces = rest.split(/\s+(?:@|at|–|—|-)\s+|\s*,\s*(?=(?:Sr\.?|Senior|Lead|Principal|Staff|Junior|Jr\.?)\b)/).map((p) => balance(trimSep(p))).filter(Boolean);
      for (const p of pieces) assignPiece(e, p);
    }
  }
  function assignClient(e: ClientEntry, v: string) {
    let s = v;
    const d = findDate(s); if (d) { if (!e.dates) e.dates = d; s = s.replace(d, " "); }
    s = balance(trimSep(s));
    const m = s.match(CLIENT_LOC);
    if (m && !e.location) { e.client = balance(trimSep(m[1])); e.location = trimSep(m[2]); }
    else e.client = s;
  }
  function assignPiece(e: ClientEntry, p: string) {
    if (LOCATION_ONLY.test(p) && !e.location) { e.location = trimSep(p); return; }
    const roleLike = ROLE_WORDS.test(p) && !COMPANY_SUFFIX.test(p);
    if (roleLike && !e.role) { e.role = p; return; }
    if (!e.client) {
      const m = p.match(CLIENT_LOC);
      if (m && !e.location) { e.client = balance(trimSep(m[1])); e.location = trimSep(m[2]); }
      else e.client = p;
      return;
    }
    if (!e.role) { e.role = p; return; }
    if (!e.location && LOCATION_ONLY.test(p)) { e.location = p; return; }
    e.description.push(p);
  }

  /* ---------- Education ---------- */
  function parseEducation(idx: number[]) {
    const anyDegree = idx.some((i) => DEGREE.test(lines[i].text));
    let cur = -1;
    for (const i of idx) {
      const t = norm(lines[i].text);
      const startNew = cur < 0 || lines[i].bullet || !anyDegree || (DEGREE.test(t) && !/^(?:from|at|in)\b/i.test(t));
      if (startNew) { data.education.push(t); cur = data.education.length - 1; }
      else {
        const prev = data.education[cur];
        data.education[cur] = /^[a-z(]/.test(t) || /[,(&\-–]$/.test(prev) ? prev + " " + t : prev + ", " + t;
      }
      roles[i] = "education";
    }
  }
}
