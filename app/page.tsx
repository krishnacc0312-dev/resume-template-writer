import Link from "next/link";
import { TEMPLATES } from "@/lib/templateMeta";
import Reveal from "@/components/Reveal";
import Splash from "@/components/Splash";
import Faq from "@/components/Faq";
import SamplesGallery from "@/components/SamplesGallery";
import HeroArt from "@/components/HeroArt";

const STEPS = [
  ["Add your resume", "Upload a PDF or Word file, or paste the text."],
  ["Choose a sample", "Pick from 11 clean, ATS-friendly templates."],
  ["Check the result", "See a live preview and an accuracy check. Edit if needed."],
  ["Download", "Get it as PDF, Word, or both."]
];

const FEATURES = [
  ["≡", "Word for word", "Your text is copied exactly. Nothing is rewritten, summarized or invented."],
  ["✓", "Accuracy check", "Every line from your original is checked against the new version."],
  ["▤", "ATS-friendly", "Standard headings, one column and Calibri, so screening software can read it."],
  ["✎", "Easy to fix", "Edit any field, reorder items or move a line before you download."],
  ["⇩", "PDF and Word", "Download one or both. Word files open in Microsoft Word and Google Docs."],
  ["⚿", "Private", "No sign-up, no AI, and your file is never stored."]
];

export default function Home() {
  return (
    <main>
      <Splash />
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <Reveal><span className="badge"><span className="dot" />Free · No sign-up · No AI</span></Reveal>
            <Reveal delay={80}><h1>Your resume, rebuilt in a <em>clean template</em>, word for word</h1></Reveal>
            <Reveal delay={160}><p className="lead">Upload your current resume, pick one of 11 ATS-friendly samples, and download it as PDF or Word in a couple of minutes.</p></Reveal>
            <Reveal delay={240}>
              <div className="hero-cta">
                <Link href="/convert" className="btn primary big">Convert my resume</Link>
                <Link href="/samples" className="btn big">See samples</Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <ul className="ticks"><li>Text stays exactly the same</li><li>PDF and Word</li><li>Files never stored</li></ul>
            </Reveal>
          </div>
          <HeroArt />
        </div>
      </section>

      <div className="strip">
        <div className="container stats">
          <Reveal><b>{TEMPLATES.length}</b><span>Resume samples</span></Reveal>
          <Reveal delay={80}><b>100%</b><span>Word-for-word text</span></Reveal>
          <Reveal delay={160}><b>PDF + Word</b><span>Download formats</span></Reveal>
          <Reveal delay={240}><b>0</b><span>Files stored</span></Reveal>
        </div>
      </div>

      <section className="section" id="how">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>Four simple steps</h2>
            <p>No account and nothing to install. It takes about two minutes.</p>
          </Reveal>
          <div className="steps4">
            {STEPS.map(([t, d], i) => (
              <Reveal key={t} delay={i * 90} className="card"><div className="num">{i + 1}</div><h3>{t}</h3><p>{d}</p></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="samples">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Samples</span>
            <h2>Pick the look you like</h2>
            <p>All samples have the same sections: Header, Summary, Skills, Clients and Education. Hover over a sample to preview or download it, or click it to start.</p>
          </Reveal>
          <SamplesGallery />
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Why use it</span>
            <h2>Built for accuracy</h2>
            <p>Made for experienced developers applying to US contract roles, where every detail on the resume matters.</p>
          </Reveal>
          <div className="features">
            {FEATURES.map(([ic, t, d], i) => (
              <Reveal key={t} delay={(i % 3) * 90} className="card"><div className="ficon" aria-hidden="true">{ic}</div><h3>{t}</h3><p>{d}</p></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">FAQ</span>
            <h2>Questions and answers</h2>
          </Reveal>
          <Reveal><Faq /></Reveal>
          <Reveal>
            <div className="cta-band">
              <h2>Ready to give your resume a clean look?</h2>
              <p>It&apos;s free and takes about two minutes.</p>
              <Link href="/convert" className="btn big">Convert my resume</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
