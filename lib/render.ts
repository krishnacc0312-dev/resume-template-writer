// Server-side: build the PDF or Word file for a resume and template.
import path from "path";
import { Packer } from "docx";
import { TEMPLATES, pdfDef, docxDoc } from "./templates";
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

export function renderPdf(data: ResumeData, templateId: number): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = getPrinter() as any;
  const doc = p.createPdfKitDocument(pdfDef(data, templateById(templateId)));
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export function renderDocx(data: ResumeData, templateId: number): Promise<Buffer> {
  return Packer.toBuffer(docxDoc(data, templateById(templateId)));
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
