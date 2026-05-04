import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Glossy CRM - Gestión inteligente para peluquerías",
  description: "El CRM diseñado para peluquerías. Reservas automáticas, fidelización de clientes, dashboard en tiempo real y mucho más.",
  keywords: ["CRM", "peluquería", "salón", "reservas", "gestión", "fidelización"],
  authors: [{ name: "Glossy CRM" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Glossy CRM",
    description: "Gestión inteligente para peluquerías",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Glossy CRM",
    description: "Gestión inteligente para peluquerías",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
