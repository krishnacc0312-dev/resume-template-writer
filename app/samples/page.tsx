import type { Metadata } from "next";
import Link from "next/link";
import SamplesGallery from "@/components/SamplesGallery";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = { title: "Samples" };

export default function Samples() {
  return (
    <main className="container" style={{ paddingTop: 48 }}>
      <Reveal className="section-head">
        <span className="eyebrow">Samples</span>
        <h1 style={{ fontSize: "clamp(30px, 4vw, 42px)", margin: "10px 0 12px" }}>All resume samples</h1>
        <p>Hover over a sample to preview every page or download it. Click a sample to convert your resume with it.</p>
      </Reveal>
      <SamplesGallery />
      <div className="row center" style={{ marginTop: 36 }}>
        <Link href="/convert" className="btn primary big">Convert my resume</Link>
      </div>
    </main>
  );
}
