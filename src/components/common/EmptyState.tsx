import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-[#FAF6ED] rounded-xl border border-[#C9A227]/20 my-6">
      <div className="w-14 h-14 rounded-full bg-[#3B2418]/5 border border-[#C9A227]/30 flex items-center justify-center text-[#C9A227] mb-4 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-serif text-lg font-semibold text-[#3B2418] mb-1">{title}</h3>
      <p className="text-sm text-[#5A3825]/80 max-w-md mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] font-medium text-xs tracking-wider uppercase rounded transition-colors shadow"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
