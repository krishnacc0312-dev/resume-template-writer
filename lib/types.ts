export type SkillRow = { cat: string; items: string };

export type ClientEntry = {
  client: string;
  location: string;
  role: string;
  dates: string;
  description: string[];
  responsibilities: string[];
  environment: string;
};

export type ResumeData = {
  name: string;
  title: string;
  contact: string[];
  summary: string[];
  skills: SkillRow[];
  clients: ClientEntry[];
  education: string[];
};

/** One line of the source file, with formatting signals used by the parser. */
export type RichLine = {
  text: string;          // exact text, bullet symbol removed
  bullet: boolean;       // list item or started with a bullet symbol
  bold: boolean;         // whole line bold
  heading: boolean;      // heading style (Word) or larger font (PDF)
  size?: number;         // font size (PDF)
  x?: number;            // left position (PDF)
  segments?: string[];   // parts separated by a tab, table cell or wide gap
  cell?: { row: number; col: number; table: number }; // Word table position
  page?: number;
};

export type LineRole =
  | "name" | "title" | "contact" | "heading" | "label"
  | "summary" | "skills" | "client-header" | "description" | "responsibility" | "environment"
  | "education" | "other" | "ignored" | "unplaced";

export type OtherSection = { section: string; lines: string[] };

export type ParseResult = {
  data: ResumeData;
  lines: string[];       // source lines (for the accuracy check)
  roles: LineRole[];     // what each source line became
  other: OtherSection[]; // sections that are not part of the templates
  unplaced: string[];    // lines the parser could not place
  source: "pdf" | "docx" | "text";
  originalHtml?: string; // Word files only, for the before/after view
};

export const emptyClient = (): ClientEntry => ({
  client: "", location: "", role: "", dates: "", description: [], responsibilities: [], environment: ""
});
