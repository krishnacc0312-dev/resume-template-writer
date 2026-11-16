"use client";
import { useEffect, useRef, useState } from "react";
import type { ResumeData } from "@/lib/types";

export type LayoutOptions = { pageSize?: "letter" | "a4"; accent?: string | null; fitPages?: number; font?: "calibri" | "cambria" | "times" | null; size?: number | null };
export type RenderMeta = { pages: number; scale: number; fits: boolean };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsPromise: Promise<any> | null = null;
export function loadPdfjs() {
  if (!pdfjsPromise) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore -- pdf.js ships no types for this entry
    pdfjsPromise = import("pdfjs-dist/build/pdf").then((m) => {
      const lib = m.default || m;
      lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      return lib;
    });
  }
  return pdfjsPromise;
}

export async function renderWithMeta(data: ResumeData, templateId: number, format: "pdf" | "docx", options?: LayoutOptions): Promise<{ blob: Blob; meta: RenderMeta }> {
  const res = await fetch("/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, templateId, format, options })
  });
  if (!res.ok) throw new Error("render failed");
  const meta = { pages: Number(res.headers.get("X-Pages")) || 0, scale: Number(res.headers.get("X-Scale")) || 1, fits: res.headers.get("X-Fits") !== "0" };
  return { blob: await res.blob(), meta };
}
export async function renderFile(data: ResumeData, templateId: number, format: "pdf" | "docx", options?: LayoutOptions): Promise<Blob> {
  return (await renderWithMeta(data, templateId, format, options)).blob;
}

/** Draws PDF pages to canvases at a given width. */
export async function pdfToCanvases(bytes: Uint8Array, width: number, maxPages = 99): Promise<HTMLCanvasElement[]> {
  const pdfjs = await loadPdfjs();
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const out: HTMLCanvasElement[] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
    const page = await pdf.getPage(i);
    const v1 = page.getViewport({ scale: 1 });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const vp = page.getViewport({ scale: (width / v1.width) * dpr });
    const c = document.createElement("canvas");
    c.width = vp.width; c.height = vp.height; c.style.width = width + "px";
    c.setAttribute("aria-label", `Page ${i} of ${pdf.numPages}`);
    await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
    out.push(c);
  }
  return out;
}

type Props = {
  data: ResumeData; templateId: number; options?: LayoutOptions;
  onPages: (n: number) => void; onMeta?: (m: RenderMeta) => void; allowBook?: boolean;
};

export default function Preview({ data, templateId, options, onPages, onMeta, allowBook }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const bookBox = useRef<HTMLDivElement>(null);
  const canvases = useRef<HTMLCanvasElement[]>([]);
  const [status, setStatus] = useState("Rendering preview…");
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"scroll" | "book">("scroll");
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [turn, setTurn] = useState<"" | "next" | "prev">("");
  const seq = useRef(0);
  const optKey = JSON.stringify(options || {});

  useEffect(() => {
    const my = ++seq.current;
    setStatus("Rendering preview…");
    const timer = setTimeout(async () => {
      try {
        const { blob, meta } = await renderWithMeta(data, templateId, "pdf", JSON.parse(optKey));
        if (my !== seq.current) return;
        const width = Math.min(720, (box.current?.parentElement?.clientWidth || 720) - 40);
        const list = await pdfToCanvases(new Uint8Array(await blob.arrayBuffer()), Math.max(260, width));
        if (my !== seq.current || !box.current) return;
        canvases.current = list;
        box.current.replaceChildren(...list);
        setCount(list.length); setPage((p) => Math.min(p, list.length - 1));
        onPages(list.length); onMeta?.(meta);
        setStatus(""); setReady(true);
      } catch {
        if (my === seq.current) setStatus("The preview couldn't be drawn. Downloads may still work.");
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [data, templateId, optKey, onPages, onMeta]);

  // Book mode shows one page at a time, with a page-turn animation.
  useEffect(() => {
    if (mode !== "book" || !bookBox.current || !canvases.current[page]) return;
    const c = canvases.current[page].cloneNode(false) as HTMLCanvasElement;
    c.getContext("2d")!.drawImage(canvases.current[page], 0, 0);
    bookBox.current.replaceChildren(c);
  }, [mode, page, count]);

  const go = (d: 1 | -1) => {
    const n = page + d;
    if (n < 0 || n >= count) return;
    setTurn(d > 0 ? "next" : "prev"); setPage(n);
    setTimeout(() => setTurn(""), 650);
  };
  useEffect(() => {
    if (mode !== "book") return;
    const key = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && /input|textarea|select/i.test(el.tagName)) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  return (
    <div>
      {allowBook && ready && (
        <div className="view-switch" role="group" aria-label="Preview style">
          <button type="button" aria-pressed={mode === "scroll"} onClick={() => setMode("scroll")}>Scroll</button>
          <button type="button" aria-pressed={mode === "book"} onClick={() => { setMode("book"); setPage(0); }}>Page turn</button>
        </div>
      )}
      {status && ready && <p className="muted" aria-live="polite">{status}</p>}
      {status && !ready && !status.startsWith("Rendering") && <p className="err">{status}</p>}
      {!ready && status.startsWith("Rendering") && <div className="pages"><div className="skeleton" aria-label="Loading preview" /></div>}
      <div className="pages" ref={box} style={ready && mode === "scroll" ? undefined : { display: "none" }} />
      {ready && mode === "book" && (
        <div className="book">
          <div className={"book-page" + (turn ? " turn-" + turn : "")} ref={bookBox} key={page} />
          <div className="book-nav">
            <button type="button" className="btn" onClick={() => go(-1)} disabled={page === 0} aria-label="Previous page">‹ Previous</button>
            <span className="muted">Page {page + 1} of {count}</span>
            <button type="button" className="btn" onClick={() => go(1)} disabled={page >= count - 1} aria-label="Next page">Next ›</button>
          </div>
        </div>
      )}
    </div>
  );
}
