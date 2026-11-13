import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import { ClarityScript } from "@/components/layout/clarity-script";
import { Providers } from "@/components/layout/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const barlow = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "LeagueUp — Your game. Your league. Your moment.", template: "%s · LeagueUp" },
  description: "Find your game, connect with teams, and experience recreational sports in one place.",
};

export const viewport: Viewport = { themeColor: "#071426" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${barlow.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
        <ClarityScript />
      </body>
    </html>
  );
}
