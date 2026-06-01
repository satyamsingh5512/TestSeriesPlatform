const fs = require('fs');

const files = [
  'frontend/src/app/admin/exams/page.tsx',
  'frontend/src/app/admin/exams/create/page.tsx',
  'frontend/src/app/admin/proctoring/[attemptId]/page.tsx',
  'frontend/src/components/auth/AuthModals.tsx'
];

// Simple script to clean up hardcoded colors and replace them with theme semantic classes
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Remove specific dark mode modifiers completely
    content = content.replace(/\bdark:[^\s"']+\b/g, '');
    
    // Replace complex glass classes with simple semantic class
    content = content.replace(/bg-white\/\d+\s+border-[^\s"']+\s+rounded-\w+\s+backdrop-blur-[^\s"']+/g, 'glass-panel');
    content = content.replace(/bg-white\/\[[0-9.]+\]\s+border-[^\s"']+\s+rounded-\w+\s+backdrop-blur-[^\s"']+/g, 'glass-panel');
    content = content.replace(/bg-\[\#111827\]/g, 'glass-panel');
    
    // Clean text colors
    content = content.replace(/text-slate-400|text-slate-500/g, 'text-muted');
    content = content.replace(/text-slate-900|text-white/g, 'text-highlight');
    content = content.replace(/text-cyan-400|text-cyan-500|text-cyan-600|text-blue-500|text-blue-600/g, 'text-accent');
    content = content.replace(/text-red-500|text-red-600|text-red-400/g, 'text-error');
    
    // Clean background colors
    content = content.replace(/bg-slate-50|bg-\[\#030303\]/g, 'bg-base');
    content = content.replace(/bg-slate-900|bg-slate-800/g, 'glass-panel');
    
    // Replace buttons
    content = content.replace(/bg-blue-[^\s"']+\s+hover:bg-[^\s"']+\s+text-[^\s"']+/g, 'btn-primary');
    
    // Strip trailing spaces
    content = content.replace(/\s{2,}/g, ' ');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Cleaned ' + file);
  }
});
