// Server-side: turn an uploaded file into lines with formatting signals.
import { parse as parseHtml, HTMLElement, Node, NodeType } from "node-html-parser";
import type { RichLine } from "./types";

const BULLET_CHARS =
  "•●○◦▪▫■□◆◇►▸‣⁃∙·*➢➤✓✔→❖▶▹➔➜★☆";
const BULLET_RE = new RegExp(
  "^(?:[" + BULLET_CHARS + "]|[-–—](?=\\s)|o(?=\\s{1,3}[A-Z])|>(?=\\s))\\s*"
);

export function splitBullet(text: string): { text: string; bullet: boolean } {
  const m = text.match(BULLET_RE);
  if (m) return { text: text.slice(m[0].length).trim(), bullet: true };
  return { text: text.trim(), bullet: false };
}

function clean(s: string): string {
  return s.replace(/ /g, " ").replace(/​|﻿/g, "").replace(/[ ]{2,}/g, (m) => (m.length >= 3 ? "   " : " ")).trim();
}

function segmentsOf(text: string): string[] | undefined {
  const parts = text.split(/\t+| {3,}/).map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts : undefined;
}

/* ---------------- Word (.docx) ---------------- */
export async function extractDocx(buf: Buffer): Promise<RichLine[]> {
  const mammoth = (await import("mammoth")).default;
  const { value: html } = await mammoth.convertToHtml(
    { buffer: buf },
    { includeDefaultStyleMap: true, ignoreEmptyParagraphs: true }
  );
  const root = parseHtml(html);
  const out: RichLine[] = [];
  let tableNo = 0;

  const isBoldWhole = (el: HTMLElement) => {
    const all = el.text.replace(/\s+/g, "");
    if (!all) return false;
    const boldText = el.querySelectorAll("strong").map((s) => s.text).join("").replace(/\s+/g, "");
    return boldText.length >= all.length * 0.9;
  };

  // A paragraph may contain <br>: split into separate lines.
  const pushPara = (el: HTMLElement, base: Partial<RichLine>) => {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    parts.forEach((p) => {
      const frag = parseHtml("<p>" + p + "</p>").firstChild as HTMLElement;
      const raw = clean(frag.text);
      if (!raw) return;
      const b = splitBullet(raw);
      out.push({
        text: b.text,
        bullet: !!base.bullet || b.bullet,
        bold: isBoldWhole(frag),
        heading: !!base.heading,
        segments: segmentsOf(b.text),
        cell: base.cell
      });
    });
  };

  const walk = (node: Node, ctx: { bullet?: boolean; cell?: RichLine["cell"] }) => {
    if (node.nodeType !== NodeType.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName ? el.tagName.toLowerCase() : "";
    if (/^h[1-6]$/.test(tag)) return pushPara(el, { heading: true, cell: ctx.cell });
    if (tag === "p") return pushPara(el, { bullet: ctx.bullet, cell: ctx.cell });
    if (tag === "li") {
      // Direct text of the item, then any nested lists.
      const own = el.clone() as HTMLElement;
      own.querySelectorAll("ul,ol").forEach((n) => n.remove());
      if (own.querySelector("p")) own.querySelectorAll("p").forEach((p) => pushPara(p, { bullet: true, cell: ctx.cell }));
      else pushPara(own, { bullet: true, cell: ctx.cell });
      el.childNodes.forEach((c) => {
        const t = (c as HTMLElement).tagName?.toLowerCase();
        if (t === "ul" || t === "ol") walk(c, { ...ctx, bullet: true });
      });
      return;
    }
    if (tag === "table") {
      const t = ++tableNo;
      el.querySelectorAll("tr").forEach((tr, r) => {
        tr.querySelectorAll("td,th").forEach((td, c) => {
          const kids = td.childNodes.filter((k) => k.nodeType === NodeType.ELEMENT_NODE);
          if (!kids.length) pushPara(td, { cell: { table: t, row: r, col: c } });
          else kids.forEach((k) => walk(k, { cell: { table: t, row: r, col: c } }));
        });
      });
      return;
    }
    el.childNodes.forEach((c) => walk(c, ctx));
  };
  root.childNodes.forEach((n) => walk(n, {}));
  return out;
}

/* ---------------- PDF ---------------- */
type Item = { s: string; x: number; y: number; w: number; h: number; bold: boolean };

export async function extractPdf(buf: Buffer): Promise<RichLine[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.js");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buf), isEvalSupported: false, disableFontFace: true, useSystemFonts: false, verbosity: 0
  }).promise;
  const out: RichLine[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    // Load fonts so their real names (e.g. "Calibri-Bold") are known.
    await page.getOperatorList();
    const fontBold = new Map<string, boolean>();
    const isBold = (fontName: string) => {
      if (fontBold.has(fontName)) return fontBold.get(fontName)!;
      let bold = false;
      try {
        const f = page.commonObjs.get(fontName);
        const nm = String((f && (f.name || f.loadedName)) || "");
        bold = /bold|black|heavy|semibold|demi/i.test(nm) || !!(f && f.bold);
      } catch { /* font not loaded */ }
      fontBold.set(fontName, bold);
      return bold;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: Item[] = tc.items.filter((it: any) => typeof it.str === "string" && it.str.length).map((it: any) => ({
      s: it.str, x: it.transform[4], y: it.transform[5], w: it.width || 0,
      h: Math.abs(it.transform[3]) || Math.abs(it.transform[0]) || 10, bold: isBold(it.fontName)
    }));
    // Group into rows by baseline.
    items.sort((a, b) => (Math.abs(b.y - a.y) > 2 ? b.y - a.y : a.x - b.x));
    const rows: { y: number; items: Item[] }[] = [];
    for (const it of items) {
      const r = rows.find((row) => Math.abs(row.y - it.y) <= Math.max(2, it.h * 0.3));
      if (r) r.items.push(it); else rows.push({ y: it.y, items: [it] });
    }
    rows.sort((a, b) => b.y - a.y);
    for (const r of rows) {
      r.items.sort((a, b) => a.x - b.x);
      let text = "", end: number | null = null;
      const segs: string[] = [];
      let seg = "";
      for (const it of r.items) {
        // Whitespace items can span a whole column gap; the gap logic adds spacing instead.
        if (!it.s.trim()) continue;
        if (end !== null) {
          const gap = it.x - end;
          if (gap > Math.max(12, it.h * 1.2)) { segs.push(seg); seg = ""; text += "   "; }
          else if (gap > it.h * 0.12 && !/\s$/.test(text) && !/^\s/.test(it.s)) { text += " "; seg += " "; }
        }
        text += it.s; seg += it.s; end = it.x + it.w;
      }
      segs.push(seg);
      const raw = clean(text);
      if (!raw) continue;
      const b = splitBullet(raw);
      const visible = r.items.filter((i) => i.s.trim() && !BULLET_RE.test(i.s.trim() + " "));
      const textItems = visible.length ? visible : r.items;
      const sz = Math.max(...textItems.map((i) => i.h));
      const cleanSegs = segs.map((s) => splitBullet(clean(s)).text).filter(Boolean);
      out.push({
        text: b.text,
        bullet: b.bullet,
        bold: textItems.every((i) => i.bold || !i.s.trim()),
        heading: false,
        size: Math.round(sz * 10) / 10,
        x: Math.round(textItems[0].x),
        segments: cleanSegs.length > 1 ? cleanSegs : undefined,
        page: p
      });
    }
  }
  // Mark lines in a clearly larger font than the body as headings.
  const sizes = out.map((l) => l.size || 0).sort((a, b) => a - b);
  const body = sizes[Math.floor(sizes.length / 2)] || 10;
  out.forEach((l) => { if ((l.size || 0) >= body * 1.15 && l.text.length < 60) l.heading = true; });
  return out;
}

/* ---------------- Plain text ---------------- */
export function extractText(text: string): RichLine[] {
  return text.replace(/\r/g, "").split("\n").map((l) => clean(l.replace(/\t/g, "   "))).filter(Boolean).map((raw) => {
    const b = splitBullet(raw);
    return { text: b.text, bullet: b.bullet, bold: false, heading: false, segments: segmentsOf(b.text) };
  });
}

export async function extractAny(name: string, buf: Buffer): Promise<{ lines: RichLine[]; source: "pdf" | "docx" | "text" }> {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return { lines: await extractPdf(buf), source: "pdf" };
  if (n.endsWith(".docx")) return { lines: await extractDocx(buf), source: "docx" };
  if (n.endsWith(".txt") || n.endsWith(".md")) return { lines: extractText(buf.toString("utf8")), source: "text" };
  if (n.endsWith(".doc")) throw new Error("Old .doc files can't be read. Open the file in Word, save it as .docx or PDF, and upload it again.");
  throw new Error("Upload a PDF, Word (.docx) or text file.");
}
