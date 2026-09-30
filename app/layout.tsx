import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Space_Grotesk,
  Montserrat,
  Manrope,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CAVERNIUM — What Deserves to Be Heard",
  description: "What deserves to be heard.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${montserrat.variable} ${manrope.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-screen">
        {isProduction ? (
          <main className="fixed inset-0 z-[9999] overflow-hidden bg-black">
            <img
              src="/coming-soon.png"
              alt="CAVERNIUM — Coming Soon"
              className="h-full w-full object-cover object-center"
            />
          </main>
        ) : (
          <>
            {children}
            <Footer />
          </>
        )}
      </body>
    </html>
  );
}