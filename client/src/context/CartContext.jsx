import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { RESTAURANT_INFO } from '../data/menuData';
import { createOrderApi } from '../services/orderApi';
import socketService from '../services/socketService';
import { getDishImage } from '../data/dishImages';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('spice_bistro_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tableNumber, setTableNumber] = useState(() => {
    try {
      return localStorage.getItem('spice_bistro_table') || 'Table 04';
    } catch {
      return 'Table 04';
    }
  });

  const [orderType, setOrderType] = useState('Dine-in'); // 'Dine-in' | 'Takeaway'
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Active placed order (persisted so user can track and modify after closing modal)
  const [activeOrder, setActiveOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('spice_bistro_active_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('spice_bistro_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('spice_bistro_table', tableNumber);
    } catch (e) {
      console.error('Failed to save table number', e);
    }
  }, [tableNumber]);

  useEffect(() => {
    try {
      if (activeOrder) {
        localStorage.setItem('spice_bistro_active_order', JSON.stringify(activeOrder));
      } else {
        localStorage.removeItem('spice_bistro_active_order');
      }
    } catch (e) {
      console.error('Failed to save active order', e);
    }
  }, [activeOrder]);

  // Subscribe customer client to live order status updates (Received -> Preparing -> Ready -> Served)
  useEffect(() => {
    if (!activeOrder?.orderId) return;

    const unsubscribe = socketService.subscribeToCustomerOrder({
      orderId: activeOrder.orderId,
      tableNumber: activeOrder.tableNumber || tableNumber,
      onStatusUpdated: (payload) => {
        console.log('[Customer Socket] Live status update received:', payload);

        setActiveOrder((prev) => {
          if (!prev || prev.orderId !== payload.orderId) return prev;
          return {
            ...prev,
            status: payload.status,
            updatedAt: payload.updatedAt || new Date().toISOString(),
          };
        });

        setConfirmedOrder((prev) => {
          if (!prev || prev.orderId !== payload.orderId) return prev;
          return {
            ...prev,
            status: payload.status,
            updatedAt: payload.updatedAt || new Date().toISOString(),
          };
        });

        const statusDescriptions = {
          Received: `Order #${payload.orderId} received by kitchen!`,
          Preparing: `👨‍🍳 Chef is now preparing your food (Order #${payload.orderId})!`,
          Ready: `🔔 Hot & ready! Order #${payload.orderId} is being plated for you!`,
          Served: `🍽️ Order #${payload.orderId} has been served! Enjoy your meal!`,
          Cancelled: `Order #${payload.orderId} was cancelled.`,
        };

        const alertText = statusDescriptions[payload.status] || `Order #${payload.orderId}: Status updated to ${payload.status}`;
        showToast(alertText);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [activeOrder?.orderId, activeOrder?.tableNumber, tableNumber]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  /**
   * Add item with specific variant
   */
  const addToCart = (item, variantKey = 'half', quantity = 1) => {
    if (item.isAvailable === false) return;

    const hasMultiple = item.hasVariants || (Array.isArray(item.variants) && item.variants.length > 1);
    const resolvedVariantKey = hasMultiple ? variantKey : 'standard';

    // Resolve variant details
    let variantData = null;
    if (hasMultiple) {
      if (item.variantsMap && item.variantsMap[variantKey]) {
        variantData = item.variantsMap[variantKey];
      } else if (Array.isArray(item.variants)) {
        variantData = item.variants.find(
          (v) => (v.name || '').toLowerCase() === String(variantKey).toLowerCase()
        ) || item.variants[0];
      } else if (item.variants && typeof item.variants === 'object') {
        variantData = item.variants[variantKey];
      }
    }

    const unitPrice = hasMultiple
      ? (variantData?.price ?? item.price ?? item.basePrice ?? 0)
      : (item.price ?? item.basePrice ?? (item.variants?.[0]?.price) ?? 0);
    const variantLabel = hasMultiple
      ? (variantData?.label || `${variantData?.name || variantKey} Plate`)
      : null;
    const portion = hasMultiple
      ? (variantData?.portion || '')
      : (item.portionNote || item.variants?.[0]?.portion || '');
    const itemId = item.id || item._id;
    const cartKey = `${itemId}_${resolvedVariantKey}`;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((ci) => ci.cartKey === cartKey);
      if (existingIndex > -1) {
        const next = [...prevItems];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }

      return [
        ...prevItems,
        {
          cartKey,
          itemId,
          name: item.name,
          image: item.image || getDishImage(item.name, item.image, item.category, item.isVeg),
          isVeg: item.isVeg,
          category: typeof item.category === 'object' ? item.category.slug : item.category,
          variantKey: resolvedVariantKey,
          variantLabel,
          portion,
          unitPrice,
          quantity,
        },
      ];
    });
  };

  const updateQuantity = (cartKey, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartKey);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartKey === cartKey ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (cartKey) => {
    setCartItems((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getVariantQuantity = (itemId, variantKey) => {
    const cartKey = `${itemId}_${variantKey}`;
    const found = cartItems.find((ci) => ci.cartKey === cartKey);
    return found ? found.quantity : 0;
  };

  const getItemTotalQuantity = (itemId) => {
    return cartItems
      .filter((ci) => ci.itemId === itemId)
      .reduce((sum, ci) => sum + ci.quantity, 0);
  };

  // Calculations for current cart
  const totalItemCount = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.unitPrice * curr.quantity, 0);
  }, [cartItems]);

  const gstRate = RESTAURANT_INFO.gstPercent / 100;
  const taxAmount = useMemo(() => {
    return Math.round(subtotal * gstRate);
  }, [subtotal, gstRate]);

  const grandTotal = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // Place order to backend database
  const placeOrder = async () => {
    if (cartItems.length === 0) {
      setOrderError('Your cart is empty. Please add items to place an order.');
      return null;
    }

    if (orderType === 'Dine-in') {
      const trimmedTable = (tableNumber || '').trim();
      if (!trimmedTable) {
        setOrderError('Please provide a valid table number for Dine-in orders.');
        showToast('Table number is required for Dine-in dining');
        return null;
      }
    }

    setIsPlacingOrder(true);
    setOrderError(null);

    try {
      const orderPayload = {
        orderType,
        tableNumber: orderType === 'Dine-in' ? tableNumber.trim() : 'Takeaway',
        kitchenNotes: kitchenNotes.trim(),
        items: cartItems.map((ci) => ({
          menuItem: ci.itemId,
          variant: ci.variantLabel || ci.variantKey || 'Standard',
          quantity: ci.quantity,
          notes: ci.notes || '',
        })),
      };

      const serverOrder = await createOrderApi(orderPayload);

      // Enhance order with client-friendly formatted time
      const finalOrder = {
        ...serverOrder,
        placedAt: new Date(serverOrder.createdAt || Date.now()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        estimatedTime: RESTAURANT_INFO.estimatedWait,
        canModify: true,
      };

      setActiveOrder(finalOrder);
      setConfirmedOrder(finalOrder);
      setCartItems([]);
      setKitchenNotes('');
      setIsCartOpen(false);
      showToast(`Order #${finalOrder.orderId} sent to kitchen! Ticket created.`);
      return finalOrder;
    } catch (err) {
      console.error('Order placement failed:', err);
      const errMsg = err.message || 'Failed to submit order to kitchen. Please try again.';
      setOrderError(errMsg);
      showToast(errMsg);
      throw err;
    } finally {
      setIsPlacingOrder(false);
    }
  };

  /**
   * Revalidate items in open cart against latest menu availability
   * Automatically drops out-of-stock items and alerts customer
   */
  const revalidateCartAvailability = (latestMenuItems) => {
    if (!Array.isArray(latestMenuItems) || cartItems.length === 0) return;

    const outOfStockNames = [];
    const remaining = cartItems.filter((ci) => {
      const found = latestMenuItems.find((m) => (m._id || m.id) === ci.itemId);
      if (found && found.isAvailable === false) {
        outOfStockNames.push(ci.name);
        return false;
      }
      return true;
    });

    if (outOfStockNames.length > 0) {
      setCartItems(remaining);
      showToast(
        `Sold Out Alert: ${outOfStockNames.join(', ')} is currently unavailable and was removed from your cart.`
      );
    }
  };

  /**
   * Remove or reduce an item from an already-placed order
   * @param {string} cartKey Item identifier in order
   * @param {boolean} removeEntireQuantity Whether to remove all or decrement 1
   * @param {string} reason Optional cancellation reason
   */
  const removeItemFromActiveOrder = (cartKey, removeEntireQuantity = true, reason = '') => {
    if (!activeOrder) return;

    const existingIndex = activeOrder.items.findIndex((it) => it.cartKey === cartKey);
    if (existingIndex === -1) return;

    const targetItem = activeOrder.items[existingIndex];
    let updatedItems = [...activeOrder.items];
    let newlyCancelled = null;

    if (removeEntireQuantity || targetItem.quantity <= 1) {
      // Remove the item completely
      updatedItems.splice(existingIndex, 1);
      newlyCancelled = {
        ...targetItem,
        cancelledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reason: reason || 'Customer requested removal',
      };
    } else {
      // Decrement quantity by 1
      updatedItems[existingIndex] = {
        ...targetItem,
        quantity: targetItem.quantity - 1,
      };
      newlyCancelled = {
        ...targetItem,
        quantity: 1,
        cancelledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reason: reason || 'Customer reduced quantity',
      };
    }

    // Recalculate billing
    const newSubtotal = updatedItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const newTax = Math.round(newSubtotal * gstRate);
    const newGrandTotal = newSubtotal + newTax;

    const updatedCancelledItems = newlyCancelled
      ? [...(activeOrder.cancelledItems || []), newlyCancelled]
      : (activeOrder.cancelledItems || []);

    const updatedOrder = {
      ...activeOrder,
      items: updatedItems,
      cancelledItems: updatedCancelledItems,
      subtotal: newSubtotal,
      taxAmount: newTax,
      grandTotal: newGrandTotal,
      status: updatedItems.length === 0 ? 'Cancelled' : activeOrder.status,
    };

    setActiveOrder(updatedOrder);
    if (confirmedOrder && confirmedOrder.orderId === activeOrder.orderId) {
      setConfirmedOrder(updatedOrder);
    }

    showToast(
      `Removed ${targetItem.name} ${targetItem.variantLabel ? `(${targetItem.variantLabel})` : ''} from order #${activeOrder.orderId}. Kitchen notified!`
    );
  };

  /**
   * Cancel the entire active order
   */
  const cancelActiveOrder = (reason = 'Customer cancelled entire order') => {
    if (!activeOrder) return;

    const allCancelled = activeOrder.items.map((it) => ({
      ...it,
      cancelledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reason,
    }));

    const cancelledOrder = {
      ...activeOrder,
      items: [],
      cancelledItems: [...(activeOrder.cancelledItems || []), ...allCancelled],
      subtotal: 0,
      taxAmount: 0,
      grandTotal: 0,
      status: 'Cancelled',
    };

    setActiveOrder(cancelledOrder);
    if (confirmedOrder && confirmedOrder.orderId === activeOrder.orderId) {
      setConfirmedOrder(cancelledOrder);
    }

    showToast(`Order #${activeOrder.orderId} has been cancelled. Kitchen ticket voided.`);
  };

  const clearActiveOrder = () => {
    setActiveOrder(null);
    setConfirmedOrder(null);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        tableNumber,
        setTableNumber,
        orderType,
        setOrderType,
        kitchenNotes,
        setKitchenNotes,
        isCartOpen,
        setIsCartOpen,
        confirmedOrder,
        setConfirmedOrder,
        activeOrder,
        setActiveOrder,
        isOrderTrackerOpen,
        setIsOrderTrackerOpen,
        toastMessage,
        showToast,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getVariantQuantity,
        getItemTotalQuantity,
        totalItemCount,
        subtotal,
        taxAmount,
        grandTotal,
        placeOrder,
        isPlacingOrder,
        orderError,
        setOrderError,
        revalidateCartAvailability,
        removeItemFromActiveOrder,
        cancelActiveOrder,
        clearActiveOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
