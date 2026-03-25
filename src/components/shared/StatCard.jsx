import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, delta, trend, sublabel = 'par rapport au mois dernier' }) {
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-zinc-400';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <div className="flex-1 px-6 py-5 min-w-0">
      <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.06em] mb-2">{label}</p>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[28px] font-bold text-zinc-900 leading-none tracking-tight">{value}</span>
        {delta && (
          <span className={cn('flex items-center gap-0.5 text-[11px] font-semibold', trendColor)}>
            {TrendIcon && <TrendIcon className="w-3 h-3" />}
            {delta}
          </span>
        )}
      </div>
      {sublabel && <p className="text-[11px] text-zinc-400">{sublabel}</p>}
    </div>
  );
}
