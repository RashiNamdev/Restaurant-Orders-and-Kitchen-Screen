import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchPublicMenuApi } from '../services/menuApi';
import { useCart } from '../context/CartContext';
import { RestaurantBanner } from '../components/RestaurantBanner';
import { CategoryNav } from '../components/CategoryNav';
import { SearchBar } from '../components/SearchBar';
import { MenuCard } from '../components/MenuCard';
import { Utensils, RotateCcw, AlertCircle, RefreshCw } from 'lucide-react';

export const MenuPage = () => {
  const { revalidateCartAvailability } = useCart();

  // Remote API State
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({ all: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Sort State
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all' | 'veg' | 'non-veg' | 'bestseller' | 'chef'
  const [sortBy, setSortBy] = useState('recommended');

  // Fetch Menu from Express + Mongoose Backend via Axios
  const loadMenu = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPublicMenuApi();
      const rawCategories = data.categories || [];

      // Ensure "All Dishes" tab exists at the beginning of the list
      const formattedCategories = [
        { id: 'all', name: 'All Dishes', icon: 'UtensilsCrossed', count: data.total || 0 },
        ...rawCategories.map((cat) => ({
          id: cat.slug || cat.id,
          name: cat.name,
          icon: cat.icon || 'UtensilsCrossed',
          count: cat.count || 0,
        })),
      ];

      setCategories(formattedCategories);
      setMenuItems(data.items || []);
      setCategoryCounts(data.categoryCounts || { all: data.items?.length || 0 });

      // Update open customer cart if any items were marked out of stock
      if (revalidateCartAvailability) {
        revalidateCartAvailability(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching menu from backend:', err);
      setError(err.message || 'Unable to load menu. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  }, [revalidateCartAvailability]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Dynamic filter and sort across items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Disappear unavailable / out-of-stock / disabled items from refreshed public customer menu
      if (item.isAvailable === false || item.isActive === false) {
        return false;
      }

      // Category filter
      if (activeCategory !== 'all') {
        const itemCat = typeof item.category === 'object' ? item.category.slug : item.category;
        if (itemCat !== activeCategory) {
          return false;
        }
      }

      // Dietary filter
      if (dietaryFilter === 'veg' && !item.isVeg) return false;
      if (dietaryFilter === 'non-veg' && item.isVeg) return false;
      if (dietaryFilter === 'bestseller' && !item.isBestseller) return false;
      if (dietaryFilter === 'chef' && !item.isChefSpecial) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = (item.name || '').toLowerCase().includes(query);
        const matchesDesc = (item.description || '').toLowerCase().includes(query);
        const itemCat = typeof item.category === 'object' ? item.category.name : item.category;
        const matchesCategory = (itemCat || '').toLowerCase().includes(query);
        return matchesName || matchesDesc || matchesCategory;
      }

      return true;
    }).sort((a, b) => {
      const getMinPrice = (item) => {
        if (item.basePrice !== undefined && item.basePrice > 0) return item.basePrice;
        if (item.price !== undefined && item.price > 0) return item.price;
        if (Array.isArray(item.variants) && item.variants.length > 0) {
          return Math.min(...item.variants.map((v) => v.price));
        }
        return 0;
      };

      if (sortBy === 'price-asc') {
        return getMinPrice(a) - getMinPrice(b);
      }
      if (sortBy === 'price-desc') {
        return getMinPrice(b) - getMinPrice(a);
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      // 'recommended': available items first, then bestsellers & chef specials
      if (sortBy === 'recommended') {
        if (a.isAvailable !== b.isAvailable) {
          return a.isAvailable ? -1 : 1;
        }
        const scoreA = (a.isBestseller ? 2 : 0) + (a.isChefSpecial ? 2 : 0) + (a.rating || 4);
        const scoreB = (b.isBestseller ? 2 : 0) + (b.isChefSpecial ? 2 : 0) + (b.rating || 4);
        return scoreB - scoreA;
      }
      return 0;
    });
  }, [menuItems, activeCategory, searchQuery, dietaryFilter, sortBy]);

  const handleResetFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setDietaryFilter('all');
    setSortBy('recommended');
  };

  // Get current active category label
  const currentCategoryObj = categories.find((c) => c.id === activeCategory);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 pt-2">
      {/* Restaurant Hero Welcome Banner */}
      <RestaurantBanner />

      {/* Sticky Category Tabs */}
      <CategoryNav
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        categoryCounts={categoryCounts}
      />

      {/* Search & Dietary Filters */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dietaryFilter={dietaryFilter}
        setDietaryFilter={setDietaryFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        totalResults={filteredItems.length}
      />

      {/* Current View Title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            {activeCategory === 'all' ? 'All Menu Specials' : currentCategoryObj?.name || 'Category Specials'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {activeCategory === 'all'
              ? 'Browse handcrafted starters, rich curries, clay oven breads, and drinks.'
              : `Showing dishes curated under ${currentCategoryObj?.name || 'this category'}.`}
          </p>
        </div>
      </div>

      {/* 1. LOADING STATE */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-200/70 p-4 space-y-4 animate-pulse shadow-xs"
            >
              <div className="aspect-16/10 w-full bg-gray-200/80 rounded-xl" />
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded-md w-3/4" />
                <div className="h-3.5 bg-gray-100 rounded-md w-full" />
                <div className="h-3.5 bg-gray-100 rounded-md w-5/6" />
              </div>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded-md w-20" />
                <div className="h-9 bg-gray-200 rounded-xl w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. ERROR STATE */}
      {!isLoading && error && (
        <div className="bg-red-50/80 border border-red-200 rounded-2xl p-6 sm:p-8 text-center max-w-lg mx-auto my-8 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-100 mx-auto flex items-center justify-center text-red-600 mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Failed to load menu</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-md mx-auto">
            {error}
          </p>
          <button
            type="button"
            onClick={loadMenu}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* 3. MENU CARDS GRID */}
      {!isLoading && !error && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredItems.map((item) => (
            <MenuCard key={item.id || item._id} item={item} />
          ))}
        </div>
      )}

      {/* 4. EMPTY STATE */}
      {!isLoading && !error && filteredItems.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-8 sm:p-12 text-center my-6 shadow-xs max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-100 mx-auto flex items-center justify-center text-orange-600 mb-3">
            <Utensils className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No dishes found</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            We couldn't find any dishes matching your current search or dietary filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </main>
  );
};
