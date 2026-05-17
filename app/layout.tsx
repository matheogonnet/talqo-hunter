import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { TALQO_FAVICON_PATH, TALQO_FAVICON_VERSION } from '@/lib/brand'

const faviconHref = `${TALQO_FAVICON_PATH}?v=${TALQO_FAVICON_VERSION}`

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Talqo Hunter',
  description: 'Automatise ta prospection de startups P1 pour Talqo',
  icons: {
    icon: [{ url: faviconHref, sizes: 'any' }],
    shortcut: faviconHref,
    apple: faviconHref,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
