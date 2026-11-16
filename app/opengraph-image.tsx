import { ImageResponse } from "next/og";

export const alt = "Resume Template Writer: your resume, rebuilt in a clean template, word for word";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Picture shown when the site link is shared (LinkedIn, WhatsApp, Slack…).
export default function OgImage() {
  const line = (w: string, o = 1, h = 10) => <div style={{ width: w, height: h, borderRadius: 5, background: "#1f4fd6", opacity: o, marginBottom: 12 }} />;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg, #f4f7ff 0%, #ffffff 55%, #eaf0ff 100%)", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 34 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "#1f4fd6", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 6 }}>
              <div style={{ width: 26, height: 4, borderRadius: 2, background: "#fff" }} /><div style={{ width: 26, height: 4, borderRadius: 2, background: "#fff", opacity: 0.7 }} /><div style={{ width: 26, height: 4, borderRadius: 2, background: "#fff" }} />
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#14161a" }}>Resume Template Writer</div>
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, color: "#14161a", lineHeight: 1.08, letterSpacing: -1 }}>Your resume, rebuilt in a clean template.</div>
          <div style={{ fontSize: 64, fontWeight: 800, color: "#1f4fd6", lineHeight: 1.08, letterSpacing: -1, marginTop: 6 }}>Word for word.</div>
          <div style={{ display: "flex", gap: 14, marginTop: 36, fontSize: 24, color: "#3d424b" }}>
            <span>11 ATS-friendly samples</span><span>·</span><span>PDF + Word</span><span>·</span><span>Free, no sign-up</span>
          </div>
        </div>
        <div style={{ display: "flex", flex: 1, justifyContent: "flex-end", alignItems: "center" }}>
          <div style={{ width: 340, height: 440, background: "#fff", borderRadius: 14, boxShadow: "0 30px 70px rgba(16,24,40,.18)", border: "1px solid #e6e7ea", padding: 34, display: "flex", flexDirection: "column", transform: "rotate(3deg)" }}>
            {line("60%", 1, 16)}{line("40%", 0.5)}
            <div style={{ height: 2, background: "#14161a", margin: "10px 0 18px" }} />
            {line("100%", 0.25)}{line("92%", 0.25)}{line("96%", 0.25)}{line("70%", 0.25)}
            <div style={{ height: 2, background: "#14161a", margin: "12px 0 18px" }} />
            {line("100%", 0.25)}{line("88%", 0.25)}{line("94%", 0.25)}{line("60%", 0.25)}{line("84%", 0.25)}
          </div>
        </div>
      </div>
    ),
    size
  );
}
