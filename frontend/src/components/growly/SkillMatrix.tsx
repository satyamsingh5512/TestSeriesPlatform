'use client';
import React from 'react';

const employees = [
  {
    id: 1,
    name: 'Priya Sharma',
    role: 'Senior Engineer',
    path: 'Advanced Leadership',
    progress: 87,
    avatarColor: 'from-growly-blue to-growly-steel',
    badges: [
      { label: 'React Master', color: 'bg-growly-blue-light text-growly-blue' },
      { label: 'Adv. Leadership', color: 'bg-growly-sage-light text-green-700' },
    ],
  },
  {
    id: 2,
    name: 'Rohan Mehta',
    role: 'Product Designer',
    path: 'Design Thinking',
    progress: 63,
    avatarColor: 'from-purple-400 to-purple-600',
    badges: [
      { label: 'Design Systems', color: 'bg-purple-50 text-purple-700' },
    ],
  },
  {
    id: 3,
    name: 'Ananya Nair',
    role: 'Marketing Lead',
    path: 'Data Analytics',
    progress: 45,
    avatarColor: 'from-growly-steel to-teal-500',
    badges: [
      { label: 'Analytics Pro', color: 'bg-teal-50 text-teal-700' },
      { label: 'Growth Certified', color: 'bg-growly-blue-light text-growly-blue' },
    ],
  },
];

export function SkillMatrix() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[16px] font-semibold text-growly-ink">Live Skill Matrix</h3>
          <p className="text-[12px] text-growly-muted mt-0.5">Top performers this quarter</p>
        </div>
        <button className="text-[12px] font-semibold text-growly-blue hover:text-growly-steel transition-colors">
          View all →
        </button>
      </div>

      <div className="space-y-5 flex-1">
        {employees.map((emp) => (
          <div key={emp.id} className="group">
            <div className="flex items-center gap-3 mb-2">
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${emp.avatarColor} flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0`}>
                {emp.name.split(' ').map(n => n[0]).join('')}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <p className="text-[13px] font-semibold text-growly-ink truncate">{emp.name}</p>
                  <span className="text-[12px] font-bold text-growly-blue ml-2 flex-shrink-0">{emp.progress}%</span>
                </div>
                <p className="text-[11px] text-growly-muted truncate">{emp.path}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="ml-12 mb-2">
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-growly-blue transition-all duration-500"
                  style={{ width: `${emp.progress}%` }}
                />
              </div>
            </div>

            {/* Badges */}
            <div className="ml-12 flex flex-wrap gap-1.5">
              {emp.badges.map((b) => (
                <span key={b.label} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.color}`}>
                  {b.label}
                </span>
              ))}
            </div>

            {/* Subtle divider except last */}
            {emp.id !== employees.length && (
              <div className="mt-5 h-px bg-gray-50" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
