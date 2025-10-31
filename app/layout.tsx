import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { TagProvider } from "@/contexts/TagContext";

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
      <body className="bg-background text-foreground antialiased">
        <ToastProvider>
          <TagProvider>
            {children}
          </TagProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
