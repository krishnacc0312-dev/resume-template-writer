"use client";
import { useCallback, useState } from "react";
import { TEMPLATES } from "@/lib/templateMeta";
import { SAMPLE } from "@/lib/sample";
import SamplePreview from "./SamplePreview";
import DownloadDialog, { type Format } from "./DownloadDialog";
import { renderFile } from "./Preview";
import { toPlainText } from "@/lib/plaintext";

/**
 * Preview and Download for samples filled with the example resume.
 * Returns functions to open them, and the dialogs to render once on the page.
 */
export function useSampleTools(onUse: (id: number) => void) {
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [dlId, setDlId] = useState<number | null>(null);
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState("");
  const closePreview = useCallback(() => setPreviewId(null), []);

  async function download(format: Format) {
    if (dlId === null) return;
    const t = TEMPLATES.find((x) => x.id === dlId)!;
    setBusy(format); setError("");
    try {
      for (const f of format === "both" ? (["docx", "pdf"] as const) : ([format] as const)) {
        const blob = f === "txt" ? new Blob([toPlainText(SAMPLE)], { type: "text/plain;charset=utf-8" }) : await renderFile(SAMPLE, t.id, f);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `Sample_${t.id}_${t.name.replace(/[^\w]+/g, "_")}.${f}`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 8000);
        if (format === "both") await new Promise((r) => setTimeout(r, 400));
      }
      setDlId(null);
    } catch { setError("The file couldn't be created. Try again."); }
    finally { setBusy(null); }
  }

  const dialogs = (
    <>
      {previewId !== null && (
        <SamplePreview id={previewId} data={SAMPLE} isOwn={false} onChange={setPreviewId} onClose={closePreview}
          useLabel="Use this sample →" onUse={() => { const id = previewId; setPreviewId(null); onUse(id); }}
          onDownload={() => { setError(""); setDlId(previewId); setPreviewId(null); }} />
      )}
      {dlId !== null && (
        <DownloadDialog title="Download this sample" busy={busy} error={error} onPick={download} onClose={() => setDlId(null)}
          note={`Sample ${dlId}, filled with the example resume. Choose a format.`} />
      )}
    </>
  );
  return { preview: (id: number) => setPreviewId(id), download: (id: number) => { setError(""); setDlId(id); }, dialogs };
}
