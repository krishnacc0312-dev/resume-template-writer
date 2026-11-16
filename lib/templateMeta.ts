// Template list, shared by the browser and the server.
export type Template = {
  id: number; name: string; desc: string;
  hdr: "left" | "center" | "inline" | "plain";
  h: "rule" | "caps" | "thin" | "plain" | "accent" | "colon";
  sk: "lines" | "bullets" | "table";
  cl: "right" | "below" | "caps" | "oneline" | "rolefirst" | "labels";
  color?: string; airy?: boolean; compact?: boolean;
  /** Layout copied from a real resume: exact sizes and margins. */
  exact?: { margin: number; body: number; name: number };
};

export const TEMPLATES: Template[] = [
  { id: 1, name: "Classic", desc: "Left header, uppercase headings with full rule, dates right-aligned.", hdr: "left", h: "rule", sk: "lines", cl: "right" },
  { id: 2, name: "Centered traditional", desc: "Centered header, centered spaced-caps headings.", hdr: "center", h: "caps", sk: "lines", cl: "right" },
  { id: 3, name: "Modern navy", desc: "Navy name and headings, thin rules.", hdr: "left", h: "thin", color: "#1F3A5F", sk: "lines", cl: "right" },
  { id: 4, name: "Minimal whitespace", desc: "Bold headings without rules, generous spacing.", hdr: "left", h: "plain", sk: "lines", cl: "right", airy: true },
  { id: 5, name: "Inline title header", desc: "Name and title on one line; dates under the role.", hdr: "inline", h: "rule", sk: "lines", cl: "below" },
  { id: 6, name: "Bulleted skills", desc: "Each skill category as a bullet; client name in caps.", hdr: "left", h: "thin", sk: "bullets", cl: "caps" },
  { id: 7, name: "Compact dense", desc: "Smaller type and tight spacing for long careers.", hdr: "left", h: "rule", sk: "lines", cl: "right", compact: true },
  { id: 8, name: "Single-line client header", desc: "Client, location, role and dates on one line.", hdr: "center", h: "rule", sk: "lines", cl: "oneline" },
  { id: 9, name: "Accent underline", desc: "Short underline under each heading, dark teal accent.", hdr: "left", h: "accent", color: "#0F5257", sk: "lines", cl: "right" },
  { id: 10, name: "Role-first entries", desc: "Job title leads each entry, client below it.", hdr: "center", h: "thin", sk: "bullets", cl: "rolefirst" },
  { id: 11, name: "Professional table", desc: "Bold headings with colons, skills in a table, CLIENT and ROLE labels.", hdr: "plain", h: "colon", sk: "table", cl: "labels", exact: { margin: 34, body: 10.5, name: 11 } }
];

/** Heading colours offered on the results page. */
export const ACCENTS: { name: string; value: string | null }[] = [
  { name: "Sample default", value: null }, { name: "Black", value: "#111111" }, { name: "Navy", value: "#1F3A5F" },
  { name: "Blue", value: "#1D4ED8" }, { name: "Teal", value: "#0F5257" }, { name: "Forest", value: "#1E5631" },
  { name: "Maroon", value: "#7A1F2B" }, { name: "Purple", value: "#4C2A85" }, { name: "Slate", value: "#475569" }
];
