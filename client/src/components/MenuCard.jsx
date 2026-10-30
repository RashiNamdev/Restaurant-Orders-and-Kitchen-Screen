import React, { useState, useMemo } from 'react';
import { Plus, Minus, ShoppingBag, Star, Clock, AlertCircle, Check } from 'lucide-react';
import { DietaryIcon, SpiceBadge, BadgeTags } from './DietaryBadge';
import { useCart } from '../context/CartContext';
import { getDishImage } from '../data/dishImages';

export const MenuCard = ({ item }) => {
  const { addToCart, updateQuantity, getVariantQuantity } = useCart();
  const [hasError, setHasError] = useState(false);
  const [showAddedFlash, setShowAddedFlash] = useState(false);

  const resolvedImage = useMemo(() => {
    return getDishImage(item.name, item.image, item.category?.name || item.category, item.isVeg);
  }, [item.name, item.image, item.category, item.isVeg]);

  // Normalize variants list across both Mongoose arrays and legacy object maps
  const variantList = useMemo(() => {
    if (Array.isArray(item.variants) && item.variants.length > 0) {
      return item.variants.map((v) => ({
        key: (v.name || '').toLowerCase().trim(),
        name: v.name || 'Standard',
        label: `${v.name} Plate`,
        portion: v.portion || '',
        price: v.price,
      }));
    }
    if (item.variants && typeof item.variants === 'object') {
      return Object.entries(item.variants).map(([k, v]) => ({
        key: k,
        name: v.label || k,
        label: v.label || `${k} Plate`,
        portion: v.portion || '',
        price: v.price,
      }));
    }
    return [];
  }, [item.variants]);

  const hasVariants = variantList.length > 1;

  // Selected variant state
  const [selectedVariant, setSelectedVariant] = useState(() => {
    return variantList[0]?.key || 'half';
  });

  const isAvailable = item.isAvailable !== false;

  // Active pricing and variant details
  const activeVariantKey = hasVariants ? selectedVariant : (variantList[0]?.key || 'standard');
  const activeVariantData = variantList.find((v) => v.key === activeVariantKey) || variantList[0] || null;
  const activePrice = activeVariantData?.price ?? item.price ?? item.basePrice ?? 0;
  const activePortion = activeVariantData?.portion ?? item.portionNote ?? '';

  // Quantity of current selected variant in cart
  const itemId = item.id || item._id;
  const currentQuantityInCart = getVariantQuantity(itemId, activeVariantKey);
  const cartKey = `${itemId}_${activeVariantKey}`;

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart({ ...item, image: resolvedImage }, activeVariantKey, 1);
    setShowAddedFlash(true);
    setTimeout(() => setShowAddedFlash(false), 900);
  };

  const handleIncrement = () => {
    if (!isAvailable) return;
    updateQuantity(cartKey, currentQuantityInCart + 1);
  };

  const handleDecrement = () => {
    updateQuantity(cartKey, currentQuantityInCart - 1);
  };

  const fallbackUrl = getDishImage(item.name, '', item.category?.name || item.category, item.isVeg);

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
        isAvailable
          ? 'border-gray-200/80 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/5'
          : 'border-gray-200 bg-gray-50/70 opacity-80'
      }`}
    >
      <div>
        {/* Image & Badges Container */}
        <div className="relative aspect-16/10 w-full overflow-hidden bg-gray-100">
          <img
            src={hasError ? fallbackUrl : (resolvedImage || fallbackUrl)}
            alt={item.name}
            loading="lazy"
            onError={() => {
              setHasError(true);
            }}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              !isAvailable ? 'grayscale-75 contrast-75' : ''
            }`}
          />

          {/* Top Overlays: Veg/Non-Veg + Badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <div className="bg-white/95 backdrop-blur-xs p-1 rounded-md shadow-xs flex items-center">
              <DietaryIcon isVeg={item.isVeg} size="sm" />
            </div>
            <BadgeTags
              isChefSpecial={item.isChefSpecial}
              isBestseller={item.isBestseller}
            />
          </div>

          {/* Sold Out Overlay if unavailable */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/95 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                <AlertCircle className="w-3.5 h-3.5" />
                Sold Out
              </span>
            </div>
          )}

          {/* Bottom Bar on Image: Rating & Prep Time */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white">
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md font-bold">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {item.rating || 4.5}
            </span>
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md font-medium text-gray-200">
              <Clock className="w-3 h-3 text-amber-300" />
              {item.prepTime || '15 min'}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Header & Spice Tag */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-orange-600 transition-colors leading-snug">
                {item.name}
              </h3>
            </div>
            {item.spiceLevel && <SpiceBadge level={item.spiceLevel} />}
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          {/* Variant Selector (Half Plate vs Full Plate / Dynamic Variants) */}
          {hasVariants && (
            <div className="pt-1">
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Select Portion</span>
                <span className="text-orange-600 font-bold capitalize">
                  {activeVariantData?.name} Plate {activePortion ? `(${activePortion})` : ''}
                </span>
              </div>
              <div className={`grid gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200/70 ${variantList.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {variantList.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => setSelectedVariant(v.key)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                      selectedVariant === v.key
                        ? 'bg-white text-orange-600 shadow-xs border border-orange-200/60'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <span className="leading-tight">{v.name} Plate</span>
                    <span className="text-[11px] text-gray-800 font-extrabold">
                      ₹{v.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Single portion detail if no multiple variants */}
          {!hasVariants && activePortion && (
            <div className="text-[11px] text-gray-500 font-medium">
              Portion: <span className="text-gray-700 font-semibold">{activePortion}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Price & Add To Cart Button */}
      <div className="p-4 sm:p-5 pt-0 border-t border-gray-100 mt-2 flex items-center justify-between gap-3">
        {/* Dynamic Display Price */}
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold leading-none mb-0.5">
            {hasVariants ? `${activeVariantData?.name} Plate` : 'Price'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-gray-900">
              ₹{activePrice}
            </span>
            {hasVariants && activePortion && (
              <span className="text-[11px] text-gray-500 font-medium">
                ({activePortion})
              </span>
            )}
          </div>
        </div>

        {/* Action Button: Stepper or Add to Cart */}
        <div>
          {!isAvailable ? (
            <button
              disabled
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-400 font-semibold text-xs cursor-not-allowed border border-gray-200"
            >
              Unavailable
            </button>
          ) : currentQuantityInCart > 0 ? (
            /* Quantity Stepper when variant already in cart */
            <div className="inline-flex items-center bg-orange-50 border border-orange-300 rounded-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={handleDecrement}
                className="p-2 text-orange-700 hover:bg-orange-100 active:bg-orange-200 transition-colors"
                title="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2.5 py-1 text-xs sm:text-sm font-extrabold text-orange-950 min-w-[24px] text-center">
                {currentQuantityInCart}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                className="p-2 text-orange-700 hover:bg-orange-100 active:bg-orange-200 transition-colors"
                title="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Add to Cart button */
            <button
              type="button"
              onClick={handleAddToCart}
              className={`relative inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer ${
                showAddedFlash
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-orange-500/25'
              }`}
            >
              {showAddedFlash ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
