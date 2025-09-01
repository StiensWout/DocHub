import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DLP Queue Tracker',
  description: 'Real-time queue times and statistics for Disneyland Paris',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <nav className="border-b bg-card">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DLP Queue Tracker
                </h1>
                <div className="flex items-center gap-4">
                  <a href="/" className="hover:text-primary transition-colors">Live Queue Times</a>
                  <a href="/statistics" className="hover:text-primary transition-colors">Statistics</a>
                  <a href="/attractions" className="hover:text-primary transition-colors">Attractions</a>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </nav>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}