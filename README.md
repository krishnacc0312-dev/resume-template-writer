# Resume Template Writer

Rebuild a resume in one of **10 ATS-friendly templates**, word for word, and download it as **Word (.docx)** or **PDF**.
Built for Senior Full Stack Developer resumes in the US C2C / C2H contract market.

- **No AI and no login.** A rule-based parser reads the resume; anyone can use the site.
- **Word for word.** Text is copied from the uploaded file and never rewritten. An accuracy check confirms every line made it into the new version and highlights anything that was edited.
- **Fixed structure:** Header → Summary → Skills → Clients → Education. Other sections (certifications, awards…) are listed as "left out on purpose" and can be added back with one click.
- **10 templates**, all Calibri, US Letter, single column, no tables or boxes.
- **Edit before download:** fix fields, reorder items, move a line to another section, add missed lines.
- **Private:** files are processed in memory and never stored.

## How it works

```
Upload (PDF / DOCX / TXT)
  → lib/extract.ts   lines + formatting signals (bold, bullets, heading styles, table cells, font size, indents)
  → lib/parser.ts    rule-based parser:
                       1. section headings (dictionary + styling)
                       2. header: name, title, contact items
                       3. summary items, skill rows ("Label: values", tables, tab/gap columns)
                       4. clients: a state machine over client/role/date/location lines, labels such as
                          "Client:", "Role:", "Responsibilities:", "Environment:", bullets and wrapped lines
                       5. education entries
  → lib/verify.ts    accuracy check against the original lines
  → Editor (browser) review and fix
  → lib/render.ts    PDF (pdfmake + Carlito) or Word (docx + Calibri) from lib/templates.ts
```

The PDF uses **Carlito**, an open font with the same letter widths as Calibri (Calibri can't be embedded). The Word file uses Calibri itself.

## Run locally

Requires Node.js 18.18 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # parser tests against the sample resumes in tests/fixtures
```

## Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import this GitHub repository.
2. Keep the defaults (framework: Next.js). No environment variables are needed.
3. Click **Deploy**.

It also runs on any host that supports Next.js (Netlify, Render, Railway, a VPS with `npm run build && npm start`).

## Optional settings (Vercel → Settings → Environment Variables)

| Variable | What it does |
| --- | --- |
| `FEEDBACK_WEBHOOK_URL` | Slack or Discord incoming-webhook URL. Turns on the Feedback button; messages are posted there. |
| `FEEDBACK_GITHUB_TOKEN` + `FEEDBACK_GITHUB_REPO` | Alternative: a GitHub token with *Issues: read and write* and `owner/repo`; each message becomes an issue labelled `feedback`. |
| `NEXT_PUBLIC_SITE_URL` | Your custom domain (e.g. `https://resumewriter.com`) for share links. Not needed on the default Vercel domain. |

The Feedback button stays hidden until one feedback destination is set.

## Project layout

| Path | What it is |
| --- | --- |
| `app/page.tsx` | The single-page UI: template picker, upload, editor, preview, downloads |
| `app/api/parse/route.ts` | `POST` a file or text → parsed resume + accuracy data |
| `app/api/render/route.ts` | `POST` resume JSON + template → PDF or DOCX |
| `lib/extract.ts` | Reads DOCX (via mammoth HTML) and PDF (via pdf.js text, fonts and positions) |
| `lib/parser.ts` | The rule-based parser |
| `lib/verify.ts` | Accuracy check |
| `lib/templates.ts`, `lib/templateMeta.ts` | The 10 template layouts for PDF and Word |
| `components/` | Editor and preview |
| `fonts/` | Carlito font files for the PDF |
| `public/thumbs/` | Template thumbnails (regenerate with `npx tsx scripts/make-thumbs.ts`, needs poppler) |
| `tests/` | Parser tests and sample resumes |

## Improving the parser

When a resume is parsed wrongly, add it (with personal details removed) to `tests/fixtures`, add an expectation in
`tests/parser.test.ts`, then adjust the dictionaries or rules in `lib/parser.ts` until `npm test` passes.

## Limits

- Scanned (image-only) PDFs have no text to read; use the Word version.
- Old `.doc` files must be saved as `.docx` or PDF first.
- Text inside Word headers, footers or text boxes is not read; contact details placed there may need to be typed into the editor.
