import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
