import type { Metadata } from "next";
import { Chakra_Petch, Cinzel, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "../context/AppContext";
import Sidebar from "../components/Sidebar";

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rpg-body",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-rpg-display",
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
  themeColor: "#4f46e5",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SP Tracker",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${chakraPetch.variable} ${cinzel.variable} ${jetbrainsMono.variable}`}
    >
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