"use client";
import { useRouter } from "next/navigation";
import { useSampleTools } from "./SampleTools";
import { TEMPLATES } from "@/lib/templateMeta";

const SHOWN = [3, 11, 9];

/** The three floating samples in the banner. Hover for Preview and Download. */
export default function HeroArt() {
  const router = useRouter();
  const tools = useSampleTools((id) => router.push(`/convert?sample=${id}`));
  return (
    <div className="hero-art">
      {SHOWN.map((id, i) => {
        const t = TEMPLATES.find((x) => x.id === id)!;
        return (
          <div key={id} className={`paper p${i + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/thumbs/${id}.png`} alt={`${t.name} sample`} />
            <div className="paper-actions">
              <span className="paper-name">{t.name}</span>
              <button type="button" className="ta-btn" onClick={() => tools.preview(id)}>⤢ Preview</button>
              <button type="button" className="ta-btn ghost" onClick={() => tools.download(id)}>⇩ Download</button>
            </div>
          </div>
        );
      })}
      {tools.dialogs}
    </div>
  );
}
