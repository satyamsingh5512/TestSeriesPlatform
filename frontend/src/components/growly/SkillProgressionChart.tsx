'use client';
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { month: 'Jan', hours: 320, skills: 12 },
  { month: 'Feb', hours: 480, skills: 18 },
  { month: 'Mar', hours: 390, skills: 14 },
  { month: 'Apr', hours: 610, skills: 23 },
  { month: 'May', hours: 520, skills: 20 },
  { month: 'Jun', hours: 740, skills: 29 },
];

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-3 text-sm">
      <p className="font-semibold text-growly-ink mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-growly-muted text-[12px]">{entry.name}:</span>
          <span className="font-semibold text-growly-ink text-[12px]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function SkillProgressionChart() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-semibold text-growly-ink">Skill Progression & Hours</h3>
          <p className="text-[12px] text-growly-muted mt-0.5">Jan – Jun 2025 · All teams</p>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-growly-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-growly-blue" /> Hours Spent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-growly-steel" /> Skills Mastered
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={6} barSize={28}>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="#E5E7EB"
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#7593A1', fontSize: 12, fontWeight: 500 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#7593A1', fontSize: 12 }}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8F9FF', radius: 6 }} />
          <Bar dataKey="hours" name="Hours Spent" fill="#003799" radius={[4, 4, 0, 0]} />
          <Bar dataKey="skills" name="Skills Mastered" fill="#3D73B6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
