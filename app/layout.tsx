import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocHub - Documentation Manager",
  description: "Central knowledge base for your team's documentation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-[#ededed] antialiased">
        {children}
      </body>
    </html>
  );
}
