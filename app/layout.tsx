import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Feedback from "@/components/Feedback";

const site = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#0f1115" }]
};

export const metadata: Metadata = {
  metadataBase: new URL(site),
  applicationName: "Resume Template Writer",
  appleWebApp: { capable: true, title: "Resume Writer", statusBarStyle: "default" },
  // Declared explicitly (with a version tag so browsers fetch the new logo instead of a cached icon).
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "any" },
      { url: "/icon.svg?v=3", type: "image/svg+xml" },
      { url: "/icons/icon-192.png?v=3", type: "image/png", sizes: "192x192" }
    ],
    shortcut: "/favicon.ico?v=3",
    apple: [{ url: "/icons/apple-touch-icon.png?v=3", sizes: "180x180" }]
  },
  openGraph: {
    type: "website", siteName: "Resume Template Writer", url: "/",
    title: "Resume Template Writer: ATS-friendly resumes, word for word",
    description: "Rebuild your resume in one of 10 clean resume samples. Your text stays word for word. PDF and Word. Free, no sign-up, no AI."
  },
  twitter: { card: "summary_large_image", title: "Resume Template Writer", description: "Your resume, rebuilt in a clean template. Word for word." },
  title: { default: "Resume Template Writer: ATS-friendly resumes, word for word", template: "%s | Resume Template Writer" },
  description: "Upload your resume and rebuild it in one of 10 clean resume samples, in Calibri, Cambria or Times New Roman. Your text stays word for word. Download Word or PDF. Free, no sign-up, no AI."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before the page paints, so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("rtw-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}` }} />
      </head>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <Feedback />
      </body>
    </html>
  );
}
