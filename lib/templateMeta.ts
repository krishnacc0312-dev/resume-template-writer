// Template definitions, shared by the browser and the server.
// Each sample is a set of design choices that the layout engine (lib/templates.ts) turns into PDF and Word.

export type FontKey = "calibri" | "cambria" | "times";
export const FONTS: { key: FontKey; name: string }[] = [
  { key: "calibri", name: "Calibri" }, { key: "cambria", name: "Cambria" }, { key: "times", name: "Times New Roman" }
];
export const SIZES = [10, 10.5, 11, 12];
export const TYPES = { ats: "ATS-friendly", recruiter: "Recruiter-friendly", boxed: "Boxed" } as const;
export const STYLES = { modern: "Modern", simple: "Simple", unique: "Unique" } as const;

export type HeaderSpec = {
  align: "left" | "center" | "split";
  /** Boxed: header sits in a filled colour band with white text. */
  band?: boolean;
  nameCase: "asis" | "upper";
  nameSize: number;
  nameBold: boolean;
  nameTracking?: number;          // letter spacing in pt
  nameColor: "accent" | "ink";
  titleStyle: "bold" | "accent" | "muted" | "caps-accent" | "caps-muted";
  titleSize: number;
  titleInline?: boolean;          // "NAME | Title" on one line
  contactSep: string;
  contactMuted: boolean;
  rule: "none" | "thin" | "thick-accent" | "double" | "thin-accent";
};

export type HeadingSpec = {
  case: "upper" | "title";
  colon?: boolean;                // "Professional Summary:"
  size: number;
  tracking?: number;
  color: "accent" | "ink" | "muted";
  rule: "none" | "below" | "below-accent" | "below-short-accent" | "above";
  ruleWeight?: number;
  align?: "left" | "center";
  before: number;
  after: number;
  lineBeforeExperience?: boolean; // full-width line above the experience heading only
  /** Boxed: heading text on a shaded bar. */
  bar?: boolean;
};

export type Template = {
  id: number;
  name: string;
  desc: string;
  font: FontKey;
  type: keyof typeof TYPES;
  style: keyof typeof STYLES;
  margin: number;                 // pt
  body: number;                   // pt
  line: number;                   // line height factor
  accent: string;                 // default accent colour
  header: HeaderSpec;
  heading: HeadingSpec;
  skills: "colon" | "tabbed" | "bullets" | "table";
  client: "harvard" | "rolefirst" | "oneline" | "stacked" | "labels" | "labels-classic";
  roleAccent?: boolean;           // role line in the accent colour
  respLabel: "none" | "plain" | "bold";
  bullet: "•" | "▪" | "–" | "›";
  bulletAccent?: boolean;
  clientGap: number;
  clientDivider?: boolean;        // thin line between clients
  envLabelAccent?: boolean;
  /** Sample copied from a real resume: exact single spacing. */
  exact?: boolean;
};

const H = (h: Partial<HeaderSpec>): HeaderSpec => ({
  align: "left", nameCase: "asis", nameSize: 22, nameBold: true, nameColor: "ink", titleStyle: "muted", titleSize: 12,
  contactSep: "  |  ", contactMuted: true, rule: "none", ...h
});
const S = (h: Partial<HeadingSpec>): HeadingSpec => ({ case: "upper", size: 11.5, color: "ink", rule: "below", before: 12, after: 5, ...h });

export const TEMPLATES: Template[] = [
  {
    id: 1, name: "Professional table", desc: "Bold headings with colons, skills in a table, CLIENT and ROLE labels.",
    font: "calibri", type: "ats", style: "simple",
    margin: 34, body: 10.5, line: 1.0, accent: "#000000", exact: true,
    header: H({ nameSize: 11, titleStyle: "bold", titleSize: 11, contactSep: " | ", contactMuted: false }),
    heading: S({ case: "title", colon: true, size: 11, rule: "none", before: 12, after: 6, lineBeforeExperience: true }),
    skills: "table", client: "labels", respLabel: "bold", bullet: "•", clientGap: 12
  },
  {
    id: 2, name: "Executive navy", desc: "Large navy name, spaced-capital title and a strong navy line under the header.",
    font: "cambria", type: "recruiter", style: "modern",
    margin: 46, body: 10.5, line: 1.15, accent: "#1F3A5F",
    header: H({ nameSize: 26, nameColor: "accent", titleStyle: "caps-accent", titleSize: 10.5, rule: "thick-accent" }),
    heading: S({ size: 11, tracking: 1.4, color: "accent", rule: "none", before: 14, after: 5 }),
    skills: "tabbed", client: "harvard", respLabel: "none", bullet: "•", bulletAccent: true, clientGap: 10
  },
  {
    id: 3, name: "Harvard classic", desc: "Centered and conservative. Employer on the left, dates on the right. Black only.",
    font: "times", type: "ats", style: "simple",
    margin: 50, body: 11, line: 1.12, accent: "#111111",
    header: H({ align: "center", nameSize: 20, titleStyle: "muted", titleSize: 12, contactSep: "  ·  " }),
    heading: S({ size: 11.5, tracking: 0.8, rule: "below", ruleWeight: 0.8, before: 12, after: 5 }),
    skills: "colon", client: "harvard", respLabel: "none", bullet: "•", clientGap: 9
  },
  {
    id: 4, name: "Modern teal", desc: "Teal name and headings with a short underline. The job title leads each entry.",
    font: "calibri", type: "recruiter", style: "modern",
    margin: 48, body: 10.5, line: 1.18, accent: "#0F6E6E",
    header: H({ nameSize: 25, nameColor: "accent", titleStyle: "bold", titleSize: 12.5, contactSep: "  •  " }),
    heading: S({ case: "title", size: 13, color: "accent", rule: "below-short-accent", before: 15, after: 6 }),
    skills: "colon", client: "stacked", respLabel: "none", bullet: "•", bulletAccent: true, clientGap: 11
  },
  {
    id: 5, name: "Compact pro", desc: "Dense but tidy. One line per client header. Fits long careers in fewer pages.",
    font: "calibri", type: "ats", style: "simple",
    margin: 36, body: 10, line: 1.08, accent: "#222222",
    header: H({ nameSize: 18, titleStyle: "muted", titleSize: 11, titleInline: true, contactSep: " | ", rule: "thin" }),
    heading: S({ size: 10.5, tracking: 0.6, rule: "below", ruleWeight: 0.5, before: 8, after: 3 }),
    skills: "colon", client: "oneline", respLabel: "none", bullet: "•", clientGap: 6
  },
  {
    id: 6, name: "Minimal air", desc: "Lots of white space, no lines, quiet grey headings. Calm and modern.",
    font: "calibri", type: "recruiter", style: "modern",
    margin: 56, body: 11, line: 1.22, accent: "#3F4A5A",
    header: H({ nameSize: 28, nameBold: false, nameTracking: 0.5, titleStyle: "caps-muted", titleSize: 10.5, contactSep: "   ·   " }),
    heading: S({ size: 10.5, tracking: 2, color: "muted", rule: "none", before: 20, after: 7 }),
    skills: "tabbed", client: "harvard", roleAccent: true, respLabel: "none", bullet: "–", clientGap: 14
  },
  {
    id: 7, name: "Bold header", desc: "Big uppercase name over a double line. Job title first, then client.",
    font: "cambria", type: "recruiter", style: "unique",
    margin: 46, body: 10.5, line: 1.15, accent: "#B4541A",
    header: H({ nameCase: "upper", nameSize: 30, nameTracking: 1, titleStyle: "accent", titleSize: 13, rule: "double" }),
    heading: S({ size: 11.5, tracking: 1, rule: "below", ruleWeight: 1.4, before: 14, after: 5 }),
    skills: "bullets", client: "rolefirst", respLabel: "none", bullet: "•", clientGap: 11
  },
  {
    id: 8, name: "Header band", desc: "Name and contact in a deep navy band; section headings with a navy line.",
    font: "calibri", type: "boxed", style: "modern",
    margin: 44, body: 10.5, line: 1.15, accent: "#1F3A5F",
    header: H({ band: true, nameSize: 26, titleStyle: "bold", titleSize: 12.5, contactSep: "  |  " }),
    heading: S({ size: 11.5, tracking: 1, color: "accent", rule: "below-accent", ruleWeight: 1, before: 14, after: 5 }),
    skills: "tabbed", client: "harvard", roleAccent: true, respLabel: "none", bullet: "›", bulletAccent: true, clientGap: 10, clientDivider: true
  },
  {
    id: 9, name: "Section bars", desc: "Each heading on a shaded bar, skills in a bordered grid. Bold and structured.",
    font: "cambria", type: "boxed", style: "unique",
    margin: 44, body: 10.5, line: 1.15, accent: "#4C2A85",
    header: H({ align: "center", nameSize: 24, nameColor: "accent", titleStyle: "muted", titleSize: 12, contactSep: "  ·  " }),
    heading: S({ bar: true, size: 11.5, tracking: 1.2, color: "accent", rule: "none", before: 14, after: 6 }),
    skills: "table", client: "harvard", respLabel: "none", bullet: "•", bulletAccent: true, clientGap: 10
  },
  {
    id: 10, name: "C2C labeled", desc: "The vendor-friendly layout: Client, Role and Responsibilities labels, cleaned up.",
    font: "times", type: "ats", style: "simple",
    margin: 44, body: 11, line: 1.12, accent: "#1F3A5F",
    header: H({ nameSize: 22, nameColor: "accent", titleStyle: "bold", titleSize: 12, rule: "thin" }),
    heading: S({ size: 12, tracking: 0.8, color: "accent", rule: "below", ruleWeight: 0.8, before: 13, after: 5 }),
    skills: "colon", client: "labels-classic", respLabel: "plain", bullet: "•", clientGap: 11, clientDivider: true
  }
];

/** Heading colours offered on the results page. */
export const ACCENTS: { name: string; value: string | null }[] = [
  { name: "Sample default", value: null }, { name: "Black", value: "#111111" }, { name: "Navy", value: "#1F3A5F" },
  { name: "Blue", value: "#1D4ED8" }, { name: "Teal", value: "#0F5257" }, { name: "Forest", value: "#1E5631" },
  { name: "Maroon", value: "#7A1F2B" }, { name: "Purple", value: "#4C2A85" }, { name: "Slate", value: "#475569" }
];
