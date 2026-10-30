import React from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { DietaryIcon } from './DietaryBadge';

export const SearchBar = ({
  searchQuery,
  setSearchQuery,
  dietaryFilter,
  setDietaryFilter,
  sortBy,
  setSortBy,
  totalResults,
}) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Search Input & Sort Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by dish name, ingredients, or spice..."
            className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-xs text-xs font-semibold text-gray-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500 mr-2 shrink-0" />
            <span className="hidden sm:inline text-gray-400 font-normal mr-1">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-800 focus:outline-hidden cursor-pointer"
            >
              <option value="recommended">Featured / Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dietary & Quick Filter Badges */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {/* All */}
          <button
            type="button"
            onClick={() => setDietaryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              dietaryFilter === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All Items
          </button>

          {/* Pure Veg */}
          <button
            type="button"
            onClick={() => setDietaryFilter('veg')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              dietaryFilter === 'veg'
                ? 'bg-emerald-700 text-white shadow-xs border-emerald-700'
                : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50/50'
            }`}
          >
            <DietaryIcon isVeg={true} size="sm" />
            <span>Pure Veg</span>
          </button>

          {/* Non Veg */}
          <button
            type="button"
            onClick={() => setDietaryFilter('non-veg')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              dietaryFilter === 'non-veg'
                ? 'bg-red-700 text-white shadow-xs border-red-700'
                : 'bg-white text-red-800 border border-red-200 hover:bg-red-50/50'
            }`}
          >
            <DietaryIcon isVeg={false} size="sm" />
            <span>Non-Veg</span>
          </button>

          {/* Bestseller */}
          <button
            type="button"
            onClick={() => setDietaryFilter('bestseller')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              dietaryFilter === 'bestseller'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50/50'
            }`}
          >
            ★ Bestsellers
          </button>

          {/* Chef's Special */}
          <button
            type="button"
            onClick={() => setDietaryFilter('chef')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              dietaryFilter === 'chef'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-50/50'
            }`}
          >
            ✨ Chef's Specials
          </button>
        </div>

        {/* Results Counter */}
        <div className="text-xs text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-800">{totalResults}</span> {totalResults === 1 ? 'dish' : 'dishes'}
        </div>
      </div>
    </div>
  );
};
