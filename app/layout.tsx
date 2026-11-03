import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "../context/AppContext";
import Sidebar from "../components/Sidebar";

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
      style={{
        ["--font-rpg-body" as any]: "'Chakra Petch', system-ui, sans-serif",
        ["--font-rpg-mono" as any]: "'JetBrains Mono', monospace",
        ["--font-rpg-display" as any]: "'Cinzel', serif",
      }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Cinzel:wght@700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
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
