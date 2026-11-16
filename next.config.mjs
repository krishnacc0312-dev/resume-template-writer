/** @type {import('next').NextConfig} */
const nextConfig = {
  // These packages read files at runtime, so keep them out of the server bundle.
  serverExternalPackages: ["pdfmake", "pdfjs-dist", "mammoth"],
  // Ship the PDF fonts with the server functions on Vercel.
  outputFileTracingIncludes: {
    "/api/render": ["./fonts/**"],
    "/api/parse": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.js"]
  },
  webpack: (config) => {
    // pdf.js references an optional Node "canvas" package that the browser build never uses.
    config.resolve.alias = { ...(config.resolve.alias || {}), canvas: false };
    return config;
  }
};
export default nextConfig;
