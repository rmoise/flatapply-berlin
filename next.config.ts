import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.wg-gesucht.de',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.wg-gesucht.de',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pictures.immobilienscout24.de',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ebayimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.immowelt.de',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.immonet.de',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
