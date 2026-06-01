const fs = require('fs');
const logPath = '/home/satym-in/.gemini/tmp/edtech-platform/tool-outputs/session-1522831d-7c1e-4109-9b5f-74937a7fdc71/write_file_write_file_1779561418936_0_a2i1zw.txt';
const logContent = fs.readFileSync(logPath, 'utf8');
const parsed = JSON.parse(logContent);
let code = parsed.output;

// Remove the prefix precisely
const prefix = "Successfully overwrote file: /home/satym-in/Documents/projects/Test-Series-startup/edtech-platform/frontend/src/app/dashboard/page.tsx. Here is the updated code:\n";
if (code.startsWith(prefix)) {
  code = code.substring(prefix.length);
} else {
  // Try finding 'use client'
  const startIdx = code.indexOf("'use client'");
  if (startIdx !== -1) {
    code = code.substring(startIdx);
  }
}

// Apply the cloneElement fixes
code = code.replace(/Object\.cloneElement/g, 'React.cloneElement');
code = code.replace(/import { useEffect, useState } from 'react';/, "import React, { useEffect, useState } from 'react';");

// Apply the Promise.allSettled fix
code = code.replace(/await Promise\.all\(\[/, 'await Promise.allSettled([');
code = code.replace(/setUser\(uRes\.data\.user\);/g, "if (uRes.status === 'fulfilled') setUser(uRes.value.data.user); else throw new Error('Failed to load user profile');");
code = code.replace(/setExams\(eRes\.data\.exams\);/g, "if (eRes.status === 'fulfilled') setExams(eRes.value.data.exams || []);");
code = code.replace(/setAttempts\(aRes\.data\.attempts\);/g, "if (aRes.status === 'fulfilled') setAttempts(aRes.value.data.attempts || []);");
code = code.replace(/setStats\(sRes\.data\.stats\);/g, "if (sRes.status === 'fulfilled') setStats(sRes.value.data.stats || null);");

fs.writeFileSync('frontend/src/app/dashboard/page.tsx', code);
console.log('Dashboard restored to the loved state.');
