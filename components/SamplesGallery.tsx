"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/templateMeta";
import { SAMPLE } from "@/lib/sample";
import SampleCard from "./SampleCard";
import SamplePreview from "./SamplePreview";
import DownloadDialog, { type Format } from "./DownloadDialog";
import { renderFile } from "./Preview";
import Reveal from "./Reveal";

/** Home page gallery: preview or download each sample with the example resume. */
export default function SamplesGallery() {
  const router = useRouter();
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
        const blob = await renderFile(SAMPLE, t.id, f);
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

  return (
    <>
      <div className="grid">
        {TEMPLATES.map((t, i) => (
          <Reveal key={t.id} delay={(i % 4) * 70}>
            <SampleCard t={t} onSelect={() => router.push(`/convert?sample=${t.id}`)}
              onPreview={() => setPreviewId(t.id)} onDownload={() => { setError(""); setDlId(t.id); }} />
          </Reveal>
        ))}
      </div>
      {previewId !== null && (
        <SamplePreview id={previewId} data={SAMPLE} isOwn={false} onChange={setPreviewId} onClose={closePreview}
          useLabel="Use this sample →" onUse={() => router.push(`/convert?sample=${previewId}`)}
          onDownload={() => { setDlId(previewId); setPreviewId(null); }} />
      )}
      {dlId !== null && (
        <DownloadDialog title="Download this sample" busy={busy} error={error} onPick={download} onClose={() => setDlId(null)}
          note={`Sample ${dlId}, filled with the example resume. Choose a format.`} />
      )}
    </>
  );
}
