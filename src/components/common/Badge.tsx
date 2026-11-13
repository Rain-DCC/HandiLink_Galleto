import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'brown' | 'green' | 'amber' | 'crimson' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'brown', size = 'sm' }) => {
  const styles = {
    gold: 'bg-[#C9A227]/15 text-[#8C6B0F] border border-[#C9A227]/30',
    brown: 'bg-[#3B2418]/10 text-[#3B2418] border border-[#3B2418]/20',
    green: 'bg-emerald-900/10 text-emerald-800 border border-emerald-700/20',
    amber: 'bg-amber-700/10 text-amber-800 border border-amber-600/20',
    crimson: 'bg-rose-900/10 text-rose-800 border border-rose-700/20',
    neutral: 'bg-stone-200/50 text-stone-700 border border-stone-300'
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 tracking-wide font-medium',
    md: 'text-xs px-2.5 py-1 tracking-wide font-medium'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm ${styles[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};
