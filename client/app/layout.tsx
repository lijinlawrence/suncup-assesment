import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuraFeed | Real-Time Coaching Feed",
  description: "Instant updates from your coaches, cached with Redis and updated in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500 selection:text-white">
        <header className="sticky top-0 z-50 w-full border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                A
              </div>
              <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-300 bg-clip-text text-transparent">
                AuraFeed
              </span>
            </div>
            
            <nav className="flex items-center gap-6">
              <Link 
                href="/" 
                className="text-sm font-medium text-zinc-400 hover:text-zinc-50 transition-colors"
              >
                Feed Board
              </Link>
              <Link 
                href="/admin" 
                className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
              >
                Coach Panel
              </Link>
            </nav>
          </div>
        </header>
        
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        
        <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-600">
          <p>© {new Date().getFullYear()} AuraFeed. Powered by Express, Socket.IO, Redis & MongoDB.</p>
        </footer>
      </body>
    </html>
  );
}
