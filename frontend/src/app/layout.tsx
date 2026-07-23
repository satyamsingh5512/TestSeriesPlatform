import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Calistoga } from 'next/font/google';
import { CommandPalette } from '@/components/CommandPalette';
import { TenantProvider } from '@/components/TenantProvider';
import "./globals.css";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });
const calistoga = Calistoga({ weight: '400', subsets: ['latin'], variable: '--font-calistoga' });

export const metadata: Metadata = {
  title: "ExamForge | Online Assessment & Exam Platform",
  description: "Create, deliver, and analyze secure online assessments with adaptive testing, automatic scoring, integrity monitoring, and detailed performance reports.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${calistoga.variable}`}>
      <body className="bg-white text-black antialiased selection:bg-black selection:text-white">
        <script dangerouslySetInnerHTML={{__html: `
          try {
            if (localStorage.getItem('theme') === 'dark') {
              document.body.classList.add('dark-theme');
            }
          } catch (e) {}
        `}} />
        <TenantProvider>
          {children}
          <CommandPalette />
        </TenantProvider>
      </body>
    </html>
  );
}
