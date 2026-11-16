"use client";
import { useEffect, useRef, useState } from "react";
import type { ResumeData } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsPromise: Promise<any> | null = null;
function loadPdfjs() {
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

export async function renderFile(data: ResumeData, templateId: number, format: "pdf" | "docx"): Promise<Blob> {
  const res = await fetch("/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, templateId, format })
  });
  if (!res.ok) throw new Error("render failed");
  return res.blob();
}

export default function Preview({ data, templateId, onPages }: { data: ResumeData; templateId: number; onPages: (n: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Rendering preview…");
  const seq = useRef(0);

  useEffect(() => {
    const my = ++seq.current;
    setStatus("Rendering preview…");
    const timer = setTimeout(async () => {
      try {
        const blob = await renderFile(data, templateId, "pdf");
        if (my !== seq.current) return;
        const pdfjs = await loadPdfjs();
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        const width = Math.min(720, (box.current?.clientWidth || 720) - 12);
        const canvases: HTMLCanvasElement[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const v1 = page.getViewport({ scale: 1 });
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const vp = page.getViewport({ scale: (width / v1.width) * dpr });
          const c = document.createElement("canvas");
          c.width = vp.width; c.height = vp.height; c.style.width = width + "px";
          c.setAttribute("aria-label", `Page ${i} of ${pdf.numPages}`);
          await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
          canvases.push(c);
        }
        if (my !== seq.current || !box.current) return;
        box.current.replaceChildren(...canvases);
        onPages(pdf.numPages);
        setStatus("");
      } catch {
        if (my === seq.current) setStatus("The preview couldn't be drawn. Downloads may still work.");
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [data, templateId, onPages]);

  return (
    <div>
      {status && <p className="muted">{status}</p>}
      <div className="pages" ref={box} />
    </div>
  );
}
