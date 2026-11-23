import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { CalendarSkipLink } from "@/components/calendar-skip-link";
import { Compass } from "@/components/marks";
import { Navigation } from "@/components/navigation";
import { siteOrigin } from "@/lib/origin";
import "./globals.css";

const serif = localFont({
  src: [
    { path: "./fonts/instrument-serif.woff2", style: "normal" },
    { path: "./fonts/instrument-serif-italic.woff2", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
});

const sans = localFont({
  src: "./fonts/dm-sans.woff2",
  weight: "100 1000",
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteOrigin,
  title: { default: "Night Atlas — A dark-sky field guide", template: "%s · Night Atlas" },
  description:
    "Find a place to stargaze in six U.S. national parks, check the moon, and keep a personal logbook of observing sites.",
};

export default function RootLayout({ children, viewer }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <CalendarSkipLink />
        <header className="masthead">
          <div className="shell masthead-inner">
            <Link className="wordmark" href="/" aria-label="Night Atlas home">
              <Compass />
              Night Atlas
            </Link>
            <Navigation />
          </div>
        </header>
        {children}
        {viewer}
        <footer className="shell colophon">
          <Link className="footer-brand" href="/">
            <Compass size={21} /> Night Atlas
          </Link>
          <div>
            <Link href="/sky-notes">Sky notes</Link>
            <a href="https://github.com/alanhoff/nextjs-demo">Source code</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
