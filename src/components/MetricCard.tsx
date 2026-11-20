import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'emerald' | 'amber' | 'rose' | 'neutral' | 'blue';
  };
  onClick?: () => void;
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  badge,
  onClick,
}) => {
  const getBadgeStyle = (variant: MetricCardProps['badge']['variant']) => {
    switch (variant) {
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between transition-all select-none ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 active:scale-95' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-[#f4f5f7] text-gray-800">
            <Icon className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
            {subtitle && <p className="text-[11px] font-semibold text-gray-500">{subtitle}</p>}
          </div>
        </div>

        {badge && (
          <span
            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${getBadgeStyle(
              badge.variant
            )}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mt-2">
        <span className="text-3xl font-extrabold tracking-tight text-gray-900">{value}</span>
        {unit && <span className="text-sm font-bold text-gray-400">{unit}</span>}
      </div>
    </div>
  );
};
