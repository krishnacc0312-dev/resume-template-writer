import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default function Contact() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <main className="container">
      <article className="legal">
        <h1>Contact</h1>
        <p>Questions, a resume that didn&apos;t convert well, or an idea for the site? Send a message and we&apos;ll reply by email.</p>
        {email && <p style={{ marginTop: 10 }}>Email: <a href={`mailto:${email}`}>{email}</a></p>}
        <ContactForm />
      </article>
    </main>
  );
}
