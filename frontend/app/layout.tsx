import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/hooks/useAuth";

const inter = localFont({ src: "./fonts/GeistVF.woff", variable: "--font-inter", weight: "100 900" });

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Plan, track and ship work with your team.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}