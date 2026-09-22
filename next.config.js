/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // File uploads (student/question CSV & XLSX import) are read in full into
  // memory via request.formData() inside the Route Handlers — raise the
  // default body size limit for Server Actions/route bodies accordingly.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
