import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: { default: "Resume Template Writer: ATS-friendly resumes, word for word", template: "%s | Resume Template Writer" },
  description: "Upload your resume and rebuild it in one of 11 clean, ATS-friendly templates. Your text stays word for word. Download Word or PDF. Free, no sign-up, no AI."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
