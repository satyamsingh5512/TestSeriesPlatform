'use client';
import React from 'react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  sparkline?: number[];
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="#003799"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <polyline
        points={`0,${h} ${pts.join(' ')} ${w},${h}`}
        fill="url(#sparkGrad)"
        stroke="none"
        opacity="0.15"
      />
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#003799" />
          <stop offset="100%" stopColor="#003799" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function MetricCard({
  label, value, subtext, trend, trendValue, icon: Icon, iconBg = 'bg-growly-blue-light', iconColor = 'text-growly-blue', sparkline,
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 flex flex-col gap-3">
      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={iconColor} />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-growly-sage-light text-green-700' : 'bg-red-50 text-red-600'
          }`}>
            {trend === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trendValue}
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <p className="text-[28px] font-bold text-growly-ink leading-none tracking-tight">{value}</p>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-growly-muted mt-1">{label}</p>
        {subtext && <p className="text-[11px] text-growly-muted/70 mt-0.5">{subtext}</p>}
      </div>

      {/* Sparkline */}
      {sparkline && (
        <div className="mt-1">
          <MiniSparkline data={sparkline} />
        </div>
      )}
    </div>
  );
}
