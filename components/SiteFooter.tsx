import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="foot-grid">
          <div>
            <Link href="/" className="logo"><span className="logo-mark" aria-hidden="true"><i /></span>Resume Template Writer</Link>
            <p style={{ marginTop: 10, maxWidth: 360 }}>Rebuild your resume in a clean, ATS-friendly template, word for word. Free, no sign-up, no AI.</p>
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
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} Resume Template Writer</span>
          <span>Your files are processed in memory and never stored.</span>
        </div>
      </div>
    </footer>
  );
}
