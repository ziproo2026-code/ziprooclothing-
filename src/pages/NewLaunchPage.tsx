import React from 'react';
import type { Product } from '../types/index.js';
import { Sparkles, ShoppingBag, ArrowRight, Star } from 'lucide-react';

interface NewLaunchPageProps {
  products: Product[];
  onAddToCart: (product: Product, size: string) => void;
  onOpenProductModal: (product: Product) => void;
  onNavigateToShop: () => void;
  onRequestSizePrompt?: (product: Product) => void;
}

export const NewLaunchPage: React.FC<NewLaunchPageProps> = ({
  products,
  onAddToCart,
  onOpenProductModal,
  onNavigateToShop,
  onRequestSizePrompt,
}) => {
  const newLaunchProducts = products.filter((p) => p.isNewLaunch);

  const handleAddClick = (product: Product) => {
    if (onRequestSizePrompt) {
      onRequestSizePrompt(product);
    } else {
      onAddToCart(product, product.sizes[0] || 'L');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Banner */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono font-semibold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#7c3aed]" />
            <span>Curated Drops · Capsule 01</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-display uppercase tracking-tight text-zinc-950">
            New Launch Showcase
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            Fresh silhouettes engineered for 2026. Hand-selected by the ZIPROO design atelier, each piece reflects our strict architectural tailoring and heavyweight cotton standard.
          </p>

          <div className="pt-2">
            <button
              onClick={onNavigateToShop}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-zinc-800 rounded-lg transition-all shadow-xs"
            >
              <span>Shop Complete Collection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Launch Grid */}
        {newLaunchProducts.length === 0 ? (
          <div className="py-24 text-center rounded-2xl bg-white border border-zinc-200 space-y-4 shadow-sm">
            <p className="text-lg text-zinc-800 font-semibold">No products currently flagged as New Launch</p>
            <p className="text-xs text-zinc-500">
              Administrators can toggle any product into New Launch via the Admin Dashboard.
            </p>
            <button
              onClick={onNavigateToShop}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-black rounded-lg shadow-xs hover:bg-zinc-800"
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newLaunchProducts.map((product) => (
              <div
                key={product.id}
                className="group rounded-2xl bg-white border border-zinc-200 overflow-hidden hover:border-purple-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image */}
                <div
                  onClick={() => onOpenProductModal(product)}
                  className="relative aspect-[4/3] bg-zinc-100 overflow-hidden cursor-pointer"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#7c3aed] text-white text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow-md">
                      New Release
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-[#7c3aed] font-semibold">
                        {product.category.replace('-', ' ')}
                      </span>
                      {product.rating && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-amber-500 font-semibold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{product.rating}</span>
                        </div>
                      )}
                    </div>
                    <h3
                      onClick={() => onOpenProductModal(product)}
                      className="text-lg font-bold text-zinc-900 group-hover:text-purple-700 transition-colors cursor-pointer"
                    >
                      {product.name}
                    </h3>
                    <p className="mt-2 text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold font-mono text-zinc-950">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.originalPrice && (
                        <span className="ml-2 text-xs line-through text-zinc-400 font-mono">
                          ₹{product.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddClick(product)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-zinc-800 transition-all active:scale-95 shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Select Size & Add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
