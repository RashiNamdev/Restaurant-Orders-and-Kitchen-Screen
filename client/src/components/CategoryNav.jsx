import React from 'react';
import { 
  UtensilsCrossed, 
  Flame, 
  Soup, 
  Sparkles, 
  ChefHat, 
  Cake, 
  Coffee,
  Utensils
} from 'lucide-react';

// Map string icon names to Lucide icon components
const ICON_MAP = {
  UtensilsCrossed,
  Flame,
  Soup,
  Sparkles,
  ChefHat,
  Cake,
  Coffee,
  Utensils,
};

export const CategoryNav = ({
  categories = [],
  activeCategory = 'all',
  onSelectCategory,
  categoryCounts = {},
}) => {
  // If no dynamic categories passed yet, provide fallback
  const displayCategories = categories.length > 0 ? categories : [
    { id: 'all', name: 'All Dishes', icon: 'UtensilsCrossed' },
  ];

  return (
    <div className="sticky top-[61px] sm:top-[69px] z-30 bg-slate-50/95 backdrop-blur-md py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-6 border-b border-gray-200/70">
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {displayCategories.map((cat) => {
          const IconComp = ICON_MAP[cat.icon] || UtensilsCrossed;
          const isActive = activeCategory === cat.id;
          const count = categoryCounts?.[cat.id] ?? cat.count ?? 0;

          return (
            <button
              key={cat.id || cat.slug || cat._id}
              type="button"
              onClick={() => onSelectCategory(cat.id || cat.slug)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                  : 'bg-white text-gray-700 hover:text-orange-600 hover:bg-orange-50/50 border border-gray-200/80 shadow-2xs'
              }`}
            >
              <IconComp className={`w-4 h-4 ${isActive ? 'text-white' : 'text-orange-500'}`} />
              <span className="whitespace-nowrap">{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-orange-100'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
