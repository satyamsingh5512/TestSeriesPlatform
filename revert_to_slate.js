const fs = require('fs');

const files = [
  'frontend/src/app/exam/[id]/page.tsx',
  'frontend/src/app/result/[attemptId]/page.tsx',
  'frontend/src/app/admin/exams/page.tsx',
  'frontend/src/app/admin/exams/create/page.tsx',
  'frontend/src/app/admin/proctoring/[attemptId]/page.tsx',
  'frontend/src/components/auth/AuthModals.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Remove token classes and restore slate theme
    content = content.replace(/glass-panel/g, 'bg-slate-800 border border-slate-700 rounded-2xl');
    content = content.replace(/btn-primary/g, 'bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow-lg');
    content = content.replace(/btn-secondary/g, 'bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold px-5 py-2.5 rounded-xl transition');
    content = content.replace(/badge/g, 'bg-slate-700/50 border border-slate-600 px-3 py-1.5 rounded-xl text-xs text-slate-400 font-semibold uppercase tracking-widest');
    
    content = content.replace(/text-highlight/g, 'text-white');
    content = content.replace(/text-muted/g, 'text-slate-400');
    content = content.replace(/text-accent/g, 'text-blue-400');
    content = content.replace(/text-error/g, 'text-red-400');
    content = content.replace(/text-main/g, 'text-slate-300');
    
    content = content.replace(/bg-base/g, 'bg-slate-900');
    content = content.replace(/bg-panel-hover/g, 'bg-slate-700');
    content = content.replace(/bg-panel/g, 'bg-slate-800');
    
    content = content.replace(/var\(--bg-base\)/g, '#0f172a');
    content = content.replace(/var\(--bg-panel\)/g, '#1e293b');
    content = content.replace(/var\(--border-color\)/g, '#334155');
    content = content.replace(/var\(--border-focus\)/g, '#3b82f6');
    content = content.replace(/var\(--accent-primary\)/g, '#3b82f6');
    content = content.replace(/var\(--error\)/g, '#ef4444');
    
    content = content.replace(/border-color/g, 'border-slate-700');

    // Restore Exam page specific backgrounds
    if (file.includes('exam')) {
      content = content.replace(/bg-\[\#0f172a\]/g, 'bg-slate-900');
      content = content.replace(/bg-\[\#1e293b\]/g, 'bg-slate-800');
      content = content.replace(/border-\[\#334155\]/g, 'border-slate-700');
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log('Reverted to slate theme in ' + file);
  }
});

// Revert globals.css and layout.tsx
const layoutCss = `import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ExamForge",
  description: "AI-Powered Examination Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={\`\${geistSans.variable} \${geistMono.variable} antialiased\`}>
        {children}
      </body>
    </html>
  );
}
`;
fs.writeFileSync('frontend/src/app/layout.tsx', layoutCss);

const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0f172a;
    --foreground: #f8fafc;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: Arial, Helvetica, sans-serif;
}
`;
fs.writeFileSync('frontend/src/app/globals.css', globalsCss);

const tailwindConfig = `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;`;
fs.writeFileSync('frontend/tailwind.config.ts', tailwindConfig);

console.log('Restored globals and tailwind config');
