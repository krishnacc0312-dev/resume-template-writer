import { ImageResponse } from "next/og";

export const alt = "Resume Template Writer: your resume, rebuilt in a clean template, word for word";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
const LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTUiIGZpbGw9IiMxZjRmZDYiLz48cmVjdCB4PSIxMSIgeT0iMTUiIHdpZHRoPSIyNCIgaGVpZ2h0PSIzMiIgcng9IjMiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii40NSIgdHJhbnNmb3JtPSJyb3RhdGUoLTggMjMgMzEpIi8+PHJlY3QgeD0iMjciIHk9IjE0IiB3aWR0aD0iMjUiIGhlaWdodD0iMzQiIHJ4PSIzIiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iMzEiIHk9IjIwIiB3aWR0aD0iMTIiIGhlaWdodD0iMyIgcng9IjEuNSIgZmlsbD0iIzFmNGZkNiIvPjxyZWN0IHg9IjMxIiB5PSIyNyIgd2lkdGg9IjE3IiBoZWlnaHQ9IjIuNiIgcng9IjEuMyIgZmlsbD0iIzFmNGZkNiIgb3BhY2l0eT0iLjM1Ii8+PHJlY3QgeD0iMzEiIHk9IjMyIiB3aWR0aD0iMTUiIGhlaWdodD0iMi42IiByeD0iMS4zIiBmaWxsPSIjMWY0ZmQ2IiBvcGFjaXR5PSIuMzUiLz48cmVjdCB4PSIzMSIgeT0iMzciIHdpZHRoPSIxNyIgaGVpZ2h0PSIyLjYiIHJ4PSIxLjMiIGZpbGw9IiMxZjRmZDYiIG9wYWNpdHk9Ii4zNSIvPjxwYXRoIGQ9Ik0xNCA1MmgxNG0wIDBsLTQtNG00IDRsLTQgNCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPgo=";

// Picture shown when the site link is shared (LinkedIn, WhatsApp, Slack…).
export default function OgImage() {
  const line = (w: string, o = 1, h = 10) => <div style={{ width: w, height: h, borderRadius: 5, background: "#1f4fd6", opacity: o, marginBottom: 12 }} />;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg, #f4f7ff 0%, #ffffff 55%, #eaf0ff 100%)", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 34 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} width={56} height={56} alt="" />
            <div style={{ fontSize: 30, fontWeight: 700, color: "#14161a" }}>Resume Template Writer</div>
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, color: "#14161a", lineHeight: 1.08, letterSpacing: -1 }}>Your resume, rebuilt in a clean template.</div>
          <div style={{ fontSize: 64, fontWeight: 800, color: "#1f4fd6", lineHeight: 1.08, letterSpacing: -1, marginTop: 6 }}>Word for word.</div>
          <div style={{ display: "flex", gap: 14, marginTop: 36, fontSize: 24, color: "#3d424b" }}>
            <span>10 resume samples</span><span>·</span><span>PDF + Word</span><span>·</span><span>Free, no sign-up</span>
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
