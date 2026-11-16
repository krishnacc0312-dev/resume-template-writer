import { NextResponse } from "next/server";
import { docxHtml, extractAny, extractText } from "@/lib/extract";
import { parseResume } from "@/lib/parser";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const text = form.get("text");
    let result;
    if (file && typeof file !== "string") {
      if (file.size > MAX_BYTES) return NextResponse.json({ error: "That file is over 4 MB. Upload a smaller file." }, { status: 413 });
      const buf = Buffer.from(await file.arrayBuffer());
      const { lines, source } = await extractAny(file.name, buf);
      result = { ...parseResume(lines, source), originalHtml: source === "docx" ? await docxHtml(buf).catch(() => "") : undefined };
    } else if (typeof text === "string" && text.trim()) {
      result = parseResume(extractText(text.slice(0, 200000)), "text");
    } else {
      return NextResponse.json({ error: "Upload your resume or paste its text first." }, { status: 400 });
    }
    if (result.lines.length < 5) {
      return NextResponse.json({ error: "No readable text was found. If this is a scanned PDF, upload the Word version instead." }, { status: 422 });
    }
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error && /\.doc files|Upload a PDF/.test(e.message) ? e.message : "This file couldn't be read. Try the Word (.docx) version, or paste the text.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
