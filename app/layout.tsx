import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import PwaRegister from '@/components/pwa-register'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jharkhand Societal Innovation Portal',
  description: 'A trusted platform connecting communities, government and universities to solve real-world problems in Jharkhand.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: '/portal-logo.png',
    apple: '/portal-logo.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#06245C' },
    { media: '(prefers-color-scheme: dark)', color: '#06245C' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="antialiased">
        {children}
        <PwaRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
