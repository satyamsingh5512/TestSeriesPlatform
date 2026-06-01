import type { Metadata } from "next";
import { CommandPalette } from '@/components/CommandPalette';
import "./globals.css";

export const metadata: Metadata = {
  title: "ExamForge",
  description: "High-Stakes Examination Platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{__html: `
          try {
            if (localStorage.getItem('theme') === 'light') {
              document.body.classList.add('light-theme');
            }
          } catch (e) {}
        `}} />
        {children}
        <CommandPalette />
      </body>
    </html>
  );
}
