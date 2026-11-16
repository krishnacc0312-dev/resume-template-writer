"use client";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/templateMeta";
import SampleCard from "./SampleCard";
import Reveal from "./Reveal";
import { useSampleTools } from "./SampleTools";

/** Grid of all samples with Preview and Download. Clicking a card starts the converter with it. */
export default function SamplesGallery({ selected, onSelect }: { selected?: number; onSelect?: (id: number) => void }) {
  const router = useRouter();
  const choose = onSelect || ((id: number) => router.push(`/convert?sample=${id}`));
  const tools = useSampleTools(choose);
  return (
    <>
      <div className="grid">
        {TEMPLATES.map((t, i) => (
          <Reveal key={t.id} delay={(i % 4) * 70}>
            <SampleCard t={t} selected={selected === t.id} onSelect={() => choose(t.id)}
              onPreview={() => tools.preview(t.id)} onDownload={() => tools.download(t.id)} />
          </Reveal>
        ))}
      </div>
      {tools.dialogs}
    </>
  );
}
