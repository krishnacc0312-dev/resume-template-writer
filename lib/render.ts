// Server-side: build the PDF or Word file for a resume and template.
import path from "path";
import { Packer } from "docx";
import { TEMPLATES, pdfDef, docxDoc, type RenderOptions } from "./templates";
import type { ResumeData } from "./types";

let printer: unknown = null;
function getPrinter() {
  if (printer) return printer;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PdfPrinter = require("pdfmake");
  const dir = path.join(process.cwd(), "fonts");
  printer = new PdfPrinter({
    Carlito: {
      normal: path.join(dir, "Carlito-Regular.ttf"),
      bold: path.join(dir, "Carlito-Bold.ttf"),
      italics: path.join(dir, "Carlito-Italic.ttf"),
      bolditalics: path.join(dir, "Carlito-BoldItalic.ttf")
    }
  });
  return printer;
}

export function templateById(id: number) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

export function renderPdf(data: ResumeData, templateId: number, opts?: RenderOptions): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = getPrinter() as any;
  const doc = p.createPdfKitDocument(pdfDef(data, templateById(templateId), opts));
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export function renderDocx(data: ResumeData, templateId: number, opts?: RenderOptions): Promise<Buffer> {
  return Packer.toBuffer(docxDoc(data, templateById(templateId), opts));
}

export const pageCount = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type\s*\/Page(?![s\w])/g) || []).length;

/** Text sizes tried when fitting to a page count, largest first. Below 0.82 the text gets hard to read. */
const SCALES = [1, 0.97, 0.94, 0.91, 0.88, 0.85, 0.82];

/** Largest scale whose PDF fits in `target` pages. */
export async function fitScale(data: ResumeData, templateId: number, opts: RenderOptions, target: number) {
  let last: { scale: number; pages: number; pdf: Buffer } = { scale: 1, pages: 0, pdf: Buffer.alloc(0) };
  for (const scale of SCALES) {
    const pdf = await renderPdf(data, templateId, { ...opts, scale });
    const pages = pageCount(pdf);
    last = { scale, pages, pdf };
    if (pages <= target) return { ...last, fits: true };
  }
  return { ...last, fits: false };
}

export function sanitizeOptions(o: unknown): RenderOptions & { fitPages?: number } {
  const r = (o && typeof o === "object" ? o : {}) as Record<string, unknown>;
  const accent = typeof r.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(r.accent) ? r.accent : null;
  const fit = Number(r.fitPages);
  return { pageSize: r.pageSize === "a4" ? "a4" : "letter", accent, fitPages: fit >= 1 && fit <= 10 ? Math.round(fit) : undefined };
}

/** Accept only the expected shape and string fields, with size limits. */
export function sanitize(input: unknown): ResumeData {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const str = (v: unknown, max = 4000) => (typeof v === "string" ? v.slice(0, max) : "");
  const arr = (v: unknown, max = 200) => (Array.isArray(v) ? v.slice(0, max) : []);
  return {
    name: str(o.name, 200), title: str(o.title, 300),
    contact: arr(o.contact, 20).map((x) => str(x, 300)),
    summary: arr(o.summary).map((x) => str(x)),
    skills: arr(o.skills).map((s) => { const r = (s || {}) as Record<string, unknown>; return { cat: str(r.cat, 200), items: str(r.items) }; }),
    clients: arr(o.clients, 60).map((c) => {
      const r = (c || {}) as Record<string, unknown>;
      return {
        client: str(r.client, 300), location: str(r.location, 200), role: str(r.role, 300), dates: str(r.dates, 200),
        description: arr(r.description, 30).map((x) => str(x)),
        responsibilities: arr(r.responsibilities).map((x) => str(x)),
        environment: str(r.environment)
      };
    }),
    education: arr(o.education, 30).map((x) => str(x, 1000))
  };
}
