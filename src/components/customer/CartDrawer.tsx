import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    setCurrentView
  } = useApp();

  if (!isCartDrawerOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const estimatedShipping = subtotal > 0 ? (subtotal > 10000 ? 0 : 350) : 0;
  const total = subtotal + estimatedShipping;

  const handleCheckoutClick = () => {
    setIsCartDrawerOpen(false);
    setCurrentView('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#24150F]/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF6ED] shadow-2xl border-l border-[#C9A227]/30 flex flex-col">
          {/* Header */}
          <div className="bg-[#3B2418] text-[#F8F3E7] px-6 py-4 flex items-center justify-between border-b border-[#C9A227]/40">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#E5C76B]" />
              <h2 className="font-serif text-lg font-semibold text-[#E5C76B]">Artisan Cart</h2>
              <span className="text-xs bg-[#5A3825] px-2 py-0.5 rounded-full text-[#F8F3E7]">
                {cart.length} items
              </span>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1 text-[#E5C76B]/80 hover:text-[#E5C76B] hover:bg-[#5A3825] rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-[#C9A227]/15">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#3B2418]/5 border border-[#C9A227]/30 flex items-center justify-center text-[#C9A227] mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#3B2418] mb-1">Your cart is empty</h3>
                <p className="text-xs text-[#5A3825]/80 max-w-xs mb-6">
                  Explore our curated Bagobo-Tagabawa handwoven textiles, traditional beadwork, and cultural apparel.
                </p>
                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    setCurrentView('shop');
                  }}
                  className="px-4 py-2 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] font-medium text-xs tracking-wider uppercase rounded transition-colors shadow"
                >
                  Browse Collection
                </button>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="py-4 flex gap-4">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 object-cover rounded-lg border border-[#C9A227]/30 shrink-0 bg-[#3B2418]/5"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-sm font-semibold text-[#3B2418] truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-[#5A3825]/80 mt-0.5">
                      Artisan: <span className="font-medium text-[#3B2418]">{item.product.artisan}</span>
                    </p>
                    {item.selectedPattern && (
                      <p className="text-[10px] text-[#8C6B0F] font-medium">
                        Motif: {item.selectedPattern}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center border border-[#C9A227]/40 rounded bg-white overflow-hidden">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:bg-[#F8F3E7] text-[#3B2418] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-mono font-medium text-[#3B2418]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:bg-[#F8F3E7] text-[#3B2418] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-[#3B2418]">
                          ₱{(item.product.price * item.quantity).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#5A3825]/60 font-mono">
                          ₱{item.product.price.toLocaleString()} ea
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-[#5A3825]/50 hover:text-rose-700 transition-colors self-start"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer & Order Summary */}
          {cart.length > 0 && (
            <div className="p-6 bg-white border-t border-[#C9A227]/30 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#5A3825]">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">₱{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#5A3825]">
                  <span>Courier Delivery (Mindanao/NCR)</span>
                  <span className="font-mono font-medium">
                    {estimatedShipping === 0 ? 'FREE (Orders > ₱10k)' : `₱${estimatedShipping.toLocaleString()}`}
                  </span>
                </div>
                <div className="border-t border-[#C9A227]/20 pt-2 flex justify-between font-serif font-bold text-base text-[#3B2418]">
                  <span>Total Amount</span>
                  <span className="font-mono text-[#C9A227]">₱{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleCheckoutClick}
                  className="w-full py-3 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] font-semibold text-xs tracking-wider uppercase rounded-lg flex items-center justify-center gap-2 transition-all shadow-md group"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="mt-2 text-center">
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-[#5A3825]/70 hover:text-[#3B2418] underline transition-colors"
                  >
                    Empty Cart
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
