"use client";
import { useRouter } from "next/navigation";
import SampleCard from "./SampleCard";
import Reveal from "./Reveal";
import { useSampleTools } from "./SampleTools";
import { useSampleFilters } from "./SampleFilters";

/** Grid of all samples with Preview and Download. Clicking a card starts the converter with it. */
export default function SamplesGallery({ selected, onSelect }: { selected?: number; onSelect?: (id: number) => void }) {
  const router = useRouter();
  const choose = onSelect || ((id: number) => router.push(`/convert?sample=${id}`));
  const tools = useSampleTools(choose);
  const f = useSampleFilters();
  return (
    <>
      {f.bar}
      {f.empty}
      <div className="grid">
        {f.list.map((t, i) => (
          <Reveal key={t.id} delay={(i % 4) * 50}>
            <SampleCard t={t} selected={selected === t.id} onSelect={() => choose(t.id)}
              onPreview={() => tools.preview(t.id)} onDownload={() => tools.download(t.id)} />
          </Reveal>
        ))}
      </div>
      {tools.dialogs}
    </>
  );
}
