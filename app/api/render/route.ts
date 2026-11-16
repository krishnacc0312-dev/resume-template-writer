import { fitScale, pageCount, renderDocx, renderPdf, sanitize, sanitizeOptions } from "@/lib/render";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = sanitize(body.data);
    const templateId = Number(body.templateId) || 1;
    const format = body.format === "docx" ? "docx" : "pdf";
    const { fitPages, ...opts } = sanitizeOptions(body.options);
    let scale = 1, fits = true, pdf: Buffer | null = null;
    if (fitPages) {
      const f = await fitScale(data, templateId, opts, fitPages);
      scale = f.scale; fits = f.fits; pdf = f.pdf;
    }
    const finalOpts = { ...opts, scale };
    if (format === "pdf" && !pdf) pdf = await renderPdf(data, templateId, finalOpts);
    const buf = format === "pdf" ? pdf! : await renderDocx(data, templateId, finalOpts);
    const pages = format === "pdf" ? pageCount(buf) : pdf ? pageCount(pdf) : 0;
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Cache-Control": "no-store",
        "X-Pages": String(pages), "X-Scale": String(scale), "X-Fits": fits ? "1" : "0"
      }
    });
  } catch {
    return Response.json({ error: "The file couldn't be created. Try again." }, { status: 500 });
  }
}
