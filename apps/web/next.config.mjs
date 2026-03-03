/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@supporthub/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
}

export default nextConfig
