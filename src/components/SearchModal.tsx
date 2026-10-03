import React, { useState, useMemo } from 'react';
import type { Product } from '../types/index.js';
import { Search, X, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigateToShopWithQuery: (query: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onNavigateToShopWithQuery,
}) => {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [products, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xl space-y-4 text-zinc-900">
        {/* Search Input Bar */}
        <div className="relative p-4 border-b border-zinc-200 flex items-center">
          <Search className="w-5 h-5 text-zinc-400 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type first letter or product name (e.g. 'v', 'hoodie', 'cargo')..."
            className="w-full bg-transparent text-zinc-950 text-base focus:outline-none placeholder-zinc-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-zinc-400 hover:text-zinc-900 mr-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto px-4 pb-4 space-y-2">
          {query.trim().length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 space-y-2">
              <p>Type any letter to see instant apparel matches.</p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {['T-shirts', 'Oversized T-shirts', 'Hoodies', 'Pants', 'Shirts'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setQuery(cat)}
                    className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-[11px] font-mono border border-zinc-200 transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          ) : matches.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching streetwear apparel found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-[11px] font-mono text-zinc-500 uppercase px-2 pb-1">
                Found {matches.length} matching products
              </div>
              {matches.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors group border border-transparent hover:border-zinc-200"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg bg-zinc-100 border border-zinc-200"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 group-hover:text-[#7c3aed] transition-colors">
                        {product.name}
                      </h4>
                      <span className="text-[11px] font-mono text-zinc-500 uppercase">
                        {product.category.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-zinc-950 tabular-nums text-sm">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {query.trim().length > 0 && (
          <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-center">
            <button
              onClick={() => {
                onNavigateToShopWithQuery(query);
                onClose();
              }}
              className="text-xs font-semibold text-[#7c3aed] hover:text-purple-800 transition-colors uppercase tracking-wider"
            >
              View all results in Shop catalog →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
