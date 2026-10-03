import React from 'react';
import type { CartItem } from '../types/index.js';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, size: string, delta: number) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onCheckout: () => void;
  freeShippingThreshold?: number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  freeShippingThreshold = 1999,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const remainingForFreeShip = Math.max(0, freeShippingThreshold - subtotal);
  const isFreeShipping = subtotal >= freeShippingThreshold;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-zinc-200 text-zinc-900 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#7c3aed]" />
              <h2 className="text-lg font-bold font-display uppercase tracking-tight text-zinc-950">
                Shopping Bag ({items.reduce((s, it) => s + it.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress in Rupees */}
          <div className="p-4 bg-zinc-50 border-b border-zinc-200 text-xs">
            {isFreeShipping ? (
              <p className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <span>✦ Congratulations! You've unlocked FREE All-India Express Shipping.</span>
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-zinc-600">
                  Add <span className="font-bold text-zinc-950 font-mono">₹{remainingForFreeShip.toLocaleString('en-IN')}</span> more to qualify for <strong className="text-[#7c3aed]">FREE Shipping</strong>.
                </p>
                <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7c3aed] transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-zinc-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-zinc-400 py-16">
                <ShoppingBag className="w-12 h-12 opacity-30 text-zinc-400" />
                <p className="text-sm font-semibold text-zinc-600">Your bag is empty</p>
                <p className="text-xs max-w-xs text-zinc-500">
                  Discover our newly released heavyweight apparel and create your identity.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-black rounded-lg hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.product.id}_${item.size}`} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                  {/* Thumbnail */}
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-24 object-cover rounded-lg bg-zinc-100 border border-zinc-200 shrink-0"
                  />

                  {/* Item Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-zinc-900 uppercase line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.product.id, item.size)}
                          className="text-zinc-400 hover:text-red-500 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 block mt-0.5">
                        Size: <strong className="text-[#7c3aed] font-bold">[{item.size}]</strong> · {item.product.category.replace('-', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-zinc-200 rounded-md bg-zinc-50 overflow-hidden">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.size, -1)}
                          className="px-2 py-1 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-mono font-bold text-zinc-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.size, 1)}
                          className="px-2 py-1 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total for this line */}
                      <span className="font-mono font-bold text-sm text-zinc-950 tabular-nums">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal & Action */}
          {items.length > 0 && (
            <div className="p-6 border-t border-zinc-200 bg-zinc-50 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span className="font-mono text-zinc-950 font-bold tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Shipping</span>
                  <span className="font-mono text-zinc-900">
                    {isFreeShipping ? <strong className="text-emerald-700">FREE</strong> : '₹99'}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-zinc-950 pt-2 border-t border-zinc-200">
                  <span>Total</span>
                  <span className="font-mono text-[#7c3aed] tabular-nums">
                    ₹{(subtotal + (isFreeShipping ? 0 : 99)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                onClick={onCheckout}
                className="w-full py-4 text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-zinc-800 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
