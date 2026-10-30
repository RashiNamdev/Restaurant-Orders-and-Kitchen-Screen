import React from 'react';
import { Flame, Star, Sparkles } from 'lucide-react';

export const DietaryIcon = ({ isVeg, size = 'sm' }) => {
  const boxSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  if (isVeg) {
    return (
      <span
        title="Pure Vegetarian"
        className={`inline-flex items-center justify-center border-2 border-emerald-600 rounded-xs bg-emerald-50 ${boxSize}`}
      >
        <span className={`bg-emerald-600 rounded-full ${dotSize}`} />
      </span>
    );
  }

  return (
    <span
      title="Non-Vegetarian"
      className={`inline-flex items-center justify-center border-2 border-red-600 rounded-xs bg-red-50 ${boxSize}`}
    >
      <span
        className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[7px] border-b-red-600"
      />
    </span>
  );
};

export const SpiceBadge = ({ level }) => {
  if (!level) return null;

  const count = level === 'hot' ? 3 : level === 'medium' ? 2 : 1;
  const label = level === 'hot' ? 'Extra Spicy' : level === 'medium' ? 'Spicy' : 'Mild Spicy';

  return (
    <span
      title={label}
      className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"
    >
      <Flame className="w-3 h-3 text-red-500 fill-red-500" />
      <span className="capitalize">{label}</span>
    </span>
  );
};

export const BadgeTags = ({ isChefSpecial, isBestseller }) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isBestseller && (
        <span className="inline-flex items-center gap-1 bg-amber-500 text-white font-semibold text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
          <Star className="w-3 h-3 fill-white" />
          Bestseller
        </span>
      )}
      {isChefSpecial && (
        <span className="inline-flex items-center gap-1 bg-purple-600 text-white font-semibold text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
          <Sparkles className="w-3 h-3" />
          Chef's Special
        </span>
      )}
    </div>
  );
};
