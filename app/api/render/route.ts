import { renderDocx, renderPdf, sanitize } from "@/lib/render";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = sanitize(body.data);
    const templateId = Number(body.templateId) || 1;
    const format = body.format === "docx" ? "docx" : "pdf";
    const buf = format === "pdf" ? await renderPdf(data, templateId) : await renderDocx(data, templateId);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return Response.json({ error: "The file couldn't be created. Try again." }, { status: 500 });
  }
}
