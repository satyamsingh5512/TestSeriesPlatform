const fs = require('fs');

const files = [
  'frontend/src/app/dashboard/page.tsx',
  'frontend/src/app/exam/[id]/page.tsx',
  'frontend/src/app/result/[attemptId]/page.tsx',
  'frontend/src/app/admin/exams/page.tsx',
  'frontend/src/app/admin/exams/create/page.tsx',
  'frontend/src/app/admin/proctoring/[attemptId]/page.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Main Backgrounds
    content = content.replace(/dark:bg-\[\#030303\]/g, 'dark:bg-black');
    content = content.replace(/dark:bg-\[\#030303\]\/80/g, 'dark:bg-black');
    
    // Solidify Cards (No glass transparency in dark mode)
    content = content.replace(/dark:bg-white\/\[0\.01\]/g, 'dark:bg-[#0a0a0a]');
    content = content.replace(/dark:bg-white\/\[0\.02\]/g, 'dark:bg-[#111111]');
    content = content.replace(/dark:bg-white\/\[0\.03\]/g, 'dark:bg-[#141414]');
    content = content.replace(/dark:bg-white\/\[0\.04\]/g, 'dark:bg-[#1a1a1a]');
    content = content.replace(/dark:bg-white\/\[0\.05\]/g, 'dark:bg-[#222222]');
    content = content.replace(/dark:bg-white\/\[0\.06\]/g, 'dark:bg-[#262626]');
    content = content.replace(/dark:bg-white\/\[0\.08\]/g, 'dark:bg-[#2a2a2a]');
    content = content.replace(/dark:bg-white\/5/g, 'dark:bg-[#222222]');
    content = content.replace(/dark:bg-white\/10/g, 'dark:bg-[#333333]');
    
    // Make Borders Solid Dark
    content = content.replace(/dark:border-white\/\[0\.02\]/g, 'dark:border-[#1a1a1a]');
    content = content.replace(/dark:border-white\/\[0\.05\]/g, 'dark:border-[#222222]');
    content = content.replace(/dark:border-white\/\[0\.08\]/g, 'dark:border-[#333333]');
    content = content.replace(/dark:border-white\/\[0\.1\]/g, 'dark:border-[#333333]');
    content = content.replace(/dark:border-white\/10/g, 'dark:border-[#333333]');
    content = content.replace(/dark:border-white\/20/g, 'dark:border-[#444444]');
    
    // Convert remaining semi-transparent blacks to solid
    content = content.replace(/dark:bg-black\/20/g, 'dark:bg-[#0a0a0a]');
    content = content.replace(/dark:bg-black\/50/g, 'dark:bg-[#0a0a0a]');
    content = content.replace(/bg-black\/60/g, 'bg-black');

    // Turn off radial glows entirely in dark mode
    content = content.replace(/dark:opacity-100/g, 'dark:hidden');

    // Solidify GlassCard in Light Mode too
    content = content.replace(/bg-white\/60/g, 'bg-white');
    content = content.replace(/bg-white\/40/g, 'bg-white');
    content = content.replace(/bg-white\/80/g, 'bg-white');
    content = content.replace(/backdrop-blur-2xl/g, '');
    content = content.replace(/backdrop-blur-3xl/g, '');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
