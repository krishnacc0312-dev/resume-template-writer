import Link from "next/link";
import LogoMark from "./Logo";
import AppInstall from "./AppInstall";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="foot-grid">
          <div>
            <Link href="/" className="logo"><LogoMark />Resume Template Writer</Link>
            <p style={{ marginTop: 10, maxWidth: 360 }}>Rebuild your resume in a clean, ATS-friendly template, word for word. Free, no sign-up, no AI.</p>
            <div style={{ marginTop: 12 }}><AppInstall /></div>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><Link href="/convert">Convert a resume</Link></li>
              <li><Link href="/samples">Samples</Link></li>
              <li><Link href="/#how">How it works</Link></li>
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li><Link href="/#faq">FAQ</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} Resume Template Writer - Created by BDR</span>
          <span>Your files are processed in memory and never stored.</span>
        </div>
      </div>
    </footer>
  );
}
