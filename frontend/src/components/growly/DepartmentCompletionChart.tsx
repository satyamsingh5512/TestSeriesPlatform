'use client';
import React from 'react';
import {
  RadialBarChart, RadialBar, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const data = [
  { name: 'Engineering', value: 88, fill: '#003799' },
  { name: 'Product', value: 74, fill: '#3D73B6' },
  { name: 'Marketing', value: 61, fill: '#B7C5BC' },
  { name: 'Sales', value: 52, fill: '#D6E0FF' },
];

const TOTAL = 74; // org-wide average

export function DepartmentCompletionChart() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-[16px] font-semibold text-growly-ink">Department Completion</h3>
        <p className="text-[12px] text-growly-muted mt-0.5">Avg. across all active paths</p>
      </div>

      {/* Chart */}
      <div className="relative flex-1 flex items-center justify-center min-h-[200px]">
        <ResponsiveContainer width="100%" height={220}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="30%"
            outerRadius="90%"
            data={data}
            startAngle={90}
            endAngle={-270}
            barSize={12}
          >
            <RadialBar
              dataKey="value"
              background={{ fill: '#F3F4F6' }}
              cornerRadius={8}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-100 shadow-md rounded-xl px-3 py-2 text-[12px]">
                    <p className="font-semibold text-growly-ink">{d.name}</p>
                    <p className="text-growly-muted">{d.value}% complete</p>
                  </div>
                );
              }}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[28px] font-bold text-growly-ink leading-none">{TOTAL}%</span>
          <span className="text-[11px] text-growly-muted font-medium mt-0.5">Org Average</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
              <span className="text-[12px] text-growly-muted">{d.name}</span>
            </div>
            <span className="text-[12px] font-semibold text-growly-ink">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
