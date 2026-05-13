import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Autorise les images de profil LinkedIn via Proxycurl
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.licdn.com',
      },
    ],
  },

  // Variables d'env exposées côté client (attention : visibles dans le bundle)
  // CRON_SECRET ne doit JAMAIS être ici
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  },
}

export default nextConfig
