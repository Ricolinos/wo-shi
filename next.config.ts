import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default de Next.js es 1mb — insuficiente para fotos/video de una
      // entrada de diario. saveEntry() sube a Vercel Blob vía Server Action,
      // así que el body completo (incluida la media) pasa por este límite.
      bodySizeLimit: "15mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com", pathname: "**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "**" },
      { protocol: "https", hostname: "i.pravatar.cc", pathname: "**" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "**" },
    ],
  },
};

export default nextConfig;
