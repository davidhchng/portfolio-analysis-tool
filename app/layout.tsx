import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Portfolio Risk & Regime",
  description: "Interactive Portfolio Risk & Regime Analyzer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <nav className="border-b bg-white">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/" className="text-lg font-semibold">
              Portfolio Risk & Regime
            </Link>
            <div className="flex gap-4">
              <Link href="/setup" className="text-sm text-muted-foreground hover:text-foreground">
                Setup
              </Link>
              <Link href="/logic" className="text-sm text-muted-foreground hover:text-foreground">
                Logic
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                GitHub
              </a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}

