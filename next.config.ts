import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

// Chemin absolu du repo — évite que Turbopack / tracing remontent au lockfile parent (ex. C:\Users\mathe\)
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)))

const nextConfig: NextConfig = {
  // Limite le file tracing prod au repo (monorepo / lockfiles voisins)
  outputFileTracingRoot: PROJECT_ROOT,

  turbopack: {
    root: PROJECT_ROOT,
  },

  images: {
    // Images de profil LinkedIn (media.licdn.com)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'talqo.fr',
      },
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
