import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Template Writer",
  description: "Rebuild your resume in one of 10 ATS-friendly templates, word for word. Download as Word or PDF."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
