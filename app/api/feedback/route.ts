// Feedback: forwards a message to a Slack/Discord webhook and/or opens a GitHub issue.
// Configure in Vercel → Settings → Environment Variables (any one is enough):
//   FEEDBACK_WEBHOOK_URL                       Slack or Discord incoming webhook URL
//   FEEDBACK_GITHUB_TOKEN + FEEDBACK_GITHUB_REPO  token with Issues: write, and "owner/repo"
export const runtime = "nodejs";

const hits = new Map<string, number[]>();
const enabled = () => !!(process.env.FEEDBACK_WEBHOOK_URL || (process.env.FEEDBACK_GITHUB_TOKEN && process.env.FEEDBACK_GITHUB_REPO));

export async function GET() {
  return Response.json({ enabled: enabled() });
}

export async function POST(req: Request) {
  if (!enabled()) return Response.json({ error: "Feedback isn't set up on this site yet." }, { status: 503 });
  // At most 5 messages per address per 10 minutes.
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 600000);
  if (recent.length >= 5) return Response.json({ error: "Too many messages. Try again in a few minutes." }, { status: 429 });
  hits.set(ip, [...recent, now]);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const kind = String(body.kind || "Other").slice(0, 40);
  const message = String(body.message || "").trim().slice(0, 4000);
  const email = String(body.email || "").trim().slice(0, 200);
  const page = String(body.page || "").slice(0, 200);
  const name = String(body.name || "").trim().slice(0, 120);
  if (message.length < 5) return Response.json({ error: "Write a little more so we can understand the problem." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "That email address doesn't look right." }, { status: 400 });

  if (kind === "Contact" && !email) return Response.json({ error: "Add your email so we can reply." }, { status: 400 });
  const label = kind === "Contact" ? "Contact message" : `Feedback: ${kind}`;
  const text = `${label}${name ? ` from ${name}` : ""}\n${message}\n\nPage: ${page || "-"}\nReply to: ${email || "not given"}`;
  const jobs: Promise<Response>[] = [];
  if (process.env.FEEDBACK_WEBHOOK_URL) {
    jobs.push(fetch(process.env.FEEDBACK_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, content: text.slice(0, 1990) }) }));
  }
  if (process.env.FEEDBACK_GITHUB_TOKEN && process.env.FEEDBACK_GITHUB_REPO) {
    jobs.push(fetch(`https://api.github.com/repos/${process.env.FEEDBACK_GITHUB_REPO}/issues`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.FEEDBACK_GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "resume-template-writer" },
      body: JSON.stringify({ title: `${label}: ${message.slice(0, 60)}`, body: `${message}\n\n---\nFrom: ${name || "-"}\nPage: ${page || "-"}\nReply to: ${email || "not given"}`, labels: [kind === "Contact" ? "contact" : "feedback"] })
    }));
  }
  const results = await Promise.allSettled(jobs);
  const ok = results.some((r) => r.status === "fulfilled" && r.value.ok);
  return ok ? Response.json({ ok: true }) : Response.json({ error: "Your message couldn't be sent. Try again later." }, { status: 502 });
}
