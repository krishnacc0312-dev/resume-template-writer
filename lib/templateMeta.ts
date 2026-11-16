// Template list, shared by the browser and the server.
export type Template = {
  id: number; name: string; desc: string;
  hdr: "left" | "center" | "inline";
  h: "rule" | "caps" | "thin" | "plain" | "accent";
  sk: "lines" | "bullets";
  cl: "right" | "below" | "caps" | "oneline" | "rolefirst";
  color?: string; airy?: boolean; compact?: boolean;
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
  { id: 10, name: "Role-first entries", desc: "Job title leads each entry, client below it.", hdr: "center", h: "thin", sk: "bullets", cl: "rolefirst" }
  ];
