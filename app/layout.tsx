import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LexQuest MVP",
  description: "Prototipo jogavel do caso Habeas Corpus em 48h."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
