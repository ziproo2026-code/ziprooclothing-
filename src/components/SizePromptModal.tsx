import React, { useState } from 'react';
import type { Product } from '../types/index.js';
import { X, ShoppingBag, Check, Ruler } from 'lucide-react';

interface SizePromptModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmAdd: (product: Product, size: string, quantity: number) => void;
}

export const SizePromptModal: React.FC<SizePromptModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirmAdd,
}) => {
  if (!isOpen || !product) return null;

  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'L');
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const handleConfirm = () => {
    onConfirmAdd(product, selectedSize, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl text-zinc-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product mini header */}
        <div className="flex gap-4 items-center">
          <img
            src={product.image}
            alt={product.name}
            className="w-16 h-20 object-cover rounded-xl bg-zinc-100 border border-zinc-200 shrink-0"
          />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#7c3aed] block font-semibold">
              {product.category.replace('-', ' ')}
            </span>
            <h3 className="text-sm font-bold text-zinc-950 uppercase line-clamp-1">
              {product.name}
            </h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold font-mono text-zinc-950">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <span className="text-xs line-through text-zinc-400 font-mono">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Requirement: Prompt customer to pick size every time */}
        <div className="space-y-3 pt-2 border-t border-zinc-200">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
              <span>Select Your Size:</span>
              <span className="text-[#7c3aed] font-mono font-bold text-sm">[{selectedSize}]</span>
            </label>
            <button
              type="button"
              onClick={() => setShowSizeGuide(!showSizeGuide)}
              className="text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
            >
              <Ruler className="w-3 h-3 text-[#7c3aed]" />
              <span>{showSizeGuide ? 'Hide Guide' : 'Size Chart'}</span>
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSize(s)}
                className={`py-2.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                  selectedSize === s
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-md scale-102 ring-2 ring-purple-300'
                    : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:text-zinc-950'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Mini size guide drawer */}
          {showSizeGuide && (
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] font-mono text-zinc-600 space-y-1 animate-in fade-in">
              <div className="text-zinc-950 font-bold">ZIPROO Boxy Streetwear Measurements (Chest in Inches):</div>
              <div className="grid grid-cols-5 gap-1 pt-1 text-center font-semibold text-zinc-800">
                <div>S: 40"</div>
                <div>M: 42"</div>
                <div>L: 44"</div>
                <div>XL: 46"</div>
                <div>XXL: 48"</div>
              </div>
              <p className="text-[10px] text-zinc-500 pt-1">
                Engineered with an intentional boxy relaxed drop-shoulder cut. True to size for an oversized look.
              </p>
            </div>
          )}
        </div>

        {/* Quantity Selection */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs uppercase font-mono tracking-wider text-zinc-600">
            Quantity:
          </span>
          <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50 overflow-hidden">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 transition-colors"
            >
              -
            </button>
            <span className="px-4 text-xs font-mono font-bold text-zinc-950">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Confirm Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3.5 text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-zinc-800 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Confirm Size [{selectedSize}] & Add to Bag (₹{(product.price * quantity).toLocaleString('en-IN')})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
