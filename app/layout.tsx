import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend"
});

export const metadata: Metadata = {
  title: "Projeto Base Matemática",
  description: "Sistema acessível para alunos com TDAH e TEA em matemática básica."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${lexend.variable} font-sans`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
