import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <main className="container">
      <article className="legal">
        <h1>Privacy</h1>
        <p>Resume Template Writer is built to keep your resume private.</p>
        <h2>What happens to your file</h2>
        <ul>
          <li>Your file or pasted text is sent to our server only to read it and build the new version.</li>
          <li>It&apos;s processed in memory and never saved to disk or a database.</li>
          <li>Nothing is sent to any AI service or third party.</li>
        </ul>
        <h2>Accounts and tracking</h2>
        <p>There are no accounts and no sign-up. The site doesn&apos;t use advertising or tracking cookies.</p>
        <h2>Your downloads</h2>
        <p>The PDF and Word files are created on request and sent straight to your browser. We don&apos;t keep copies.</p>
      </article>
    </main>
  );
}
