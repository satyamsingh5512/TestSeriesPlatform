const fs = require('fs');
const glob = require('child_process').execSync('find /home/satym-in/Documents/projects/Test-Series-startup/edtech-platform/frontend/src/app -type f -name "*.tsx"').toString().trim().split('\n');
for (const file of glob) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/baseURL: process\.env\.NEXT_PUBLIC_API_URL,/g, 'baseURL: process.env.NEXT_PUBLIC_API_URL || \'http://localhost:3001\',');
  content = content.replace(/\`\$\{process\.env\.NEXT_PUBLIC_API_URL\}\/api\/auth\/register\`/g, '\`${process.env.NEXT_PUBLIC_API_URL || \\'http://localhost:3001\\'}/api/auth/register\`');
  fs.writeFileSync(file, content);
}
console.log('Replaced in all files');
