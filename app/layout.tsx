import type { Metadata, Viewport } from "next";
import { Chakra_Petch, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "../context/AppContext";
import Sidebar from "../components/Sidebar";

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rpg-body",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-rpg-mono",
});

export const metadata: Metadata = {
  title: "SP Tracker · RPG Quest Command",
  description: "Gamified RPG Quest Tracking, Arcane Rewards Wheel & Finance Command Center",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SP Tracker",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${chakraPetch.variable} ${jetbrainsMono.variable}`}
      style={{ ["--font-rpg-display" as any]: "'Cinzel', serif" }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${chakraPetch.className} antialiased selection:bg-indigo-500 selection:text-white`}>
        <AppProvider>
          <div className="flex flex-col md:flex-row min-h-screen bg-slate-100/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <Sidebar />
            <main className="flex-1 pb-20 md:pb-0 h-screen overflow-y-auto custom-scrollbar">
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}