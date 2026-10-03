import React, { useState, useMemo } from 'react';
import type { Product, ProductCategory } from '../types/index.js';
import { Search, ShoppingBag, Eye, X, Check, SlidersHorizontal, Star, Copy, Link } from 'lucide-react';
import { ProductReviews } from '../components/ProductReviews.js';

interface ShoppingPageProps {
  products: Product[];
  onAddToCart: (product: Product, size: string) => void;
  initialSearch?: string;
  selectedProductModal: Product | null;
  onOpenProductModal: (product: Product | null) => void;
  onRequestSizePrompt?: (product: Product) => void;
  onProductUpdated?: (updatedProduct: Product) => void;
}

export const ShoppingPage: React.FC<ShoppingPageProps> = ({
  products,
  onAddToCart,
  initialSearch = '',
  selectedProductModal,
  onOpenProductModal,
  onRequestSizePrompt,
  onProductUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  const [copiedModalLink, setCopiedModalLink] = useState(false);

  // Category definitions
  const categories: { id: ProductCategory; label: string }[] = [
    { id: 'all', label: 'All Collections' },
    { id: 't-shirts', label: 'T-Shirts' },
    { id: 'oversized-t-shirts', label: 'Oversized T-Shirts' },
    { id: 'hoodies', label: 'Hoodies' },
    { id: 'pants', label: 'Pants' },
    { id: 'shirts', label: 'Shirts' },
  ];

  // Instant reactive filter matching on first letter and beyond!
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // Instant search filter: matches from first letter onwards against name & category
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatches = product.name.toLowerCase().includes(query);
        const categoryMatches = product.category.toLowerCase().includes(query);
        const descMatches = product.description.toLowerCase().includes(query);
        return nameMatches || categoryMatches || descMatches;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.isNewLaunch ? 1 : 0) - (a.isNewLaunch ? 1 : 0);
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handleSizeSelect = (productId: string, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleAddClick = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // If user has not chosen a size yet, trigger size prompt modal
    if (!selectedSizes[product.id] && onRequestSizePrompt) {
      onRequestSizePrompt(product);
      return;
    }
    const size = selectedSizes[product.id] || product.sizes[0] || 'L';
    onAddToCart(product, size);
    setAddedFeedback(product.id);
    setTimeout(() => setAddedFeedback(null), 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] font-mono text-[#7c3aed] block mb-1 font-semibold">
                ZIPROO Store
              </span>
              <h1 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-tight text-zinc-950">
                Catalog & Apparel
              </h1>
            </div>
            <div className="text-xs text-zinc-500 font-mono">
              Showing <span className="text-zinc-950 font-bold">{filteredProducts.length}</span> styles · Prices in Indian Rupees (₹)
            </div>
          </div>
        </div>

        {/* 1. INSTANT SEARCH BAR - Matches on 1st letter! */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by first letter, product name, or category (e.g. 'h' for hoodies, 'oversized')..."
              className="w-full pl-12 pr-10 py-3.5 bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-800"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-xs text-zinc-500">
              Filtering products matching "<span className="text-[#7c3aed] font-semibold">{searchQuery}</span>"
            </p>
          )}
        </div>

        {/* 2. CATEGORY FILTERS & SORT BAR */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg uppercase tracking-wider transition-all whitespace-nowrap shadow-xs ${
                    isSelected
                      ? 'bg-zinc-950 text-white font-bold'
                      : 'bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 border border-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-[#7c3aed] shadow-xs"
            >
              <option value="featured">Featured / Launches</option>
              <option value="newest">Newest Drops</option>
              <option value="price-asc">Price: Low to High (₹)</option>
              <option value="price-desc">Price: High to Low (₹)</option>
            </select>
          </div>
        </div>

        {/* 3. PRODUCT GRID */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-white border border-zinc-200 space-y-4 shadow-sm">
            <p className="text-lg text-zinc-800 font-semibold">No apparel found matching your search</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Try typing a different letter or resetting your category filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-black rounded-lg hover:bg-zinc-800 transition-colors shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const currentSize = selectedSizes[product.id] || product.sizes[0] || 'L';
              const isAdded = addedFeedback === product.id;

              return (
                <div
                  key={product.id}
                  className="group rounded-xl bg-white border border-zinc-200 overflow-hidden hover:border-purple-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Photo with badges and Quick View trigger */}
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

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      {product.isNewLaunch && (
                        <span className="bg-[#7c3aed] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                          New Launch
                        </span>
                      )}
                      {!product.inStock && (
                        <span className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                          Sold Out
                        </span>
                      )}
                    </div>

                    {/* Quick view hover icon */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-xs font-semibold text-zinc-900 border border-zinc-200 shadow-md">
                        <Eye className="w-3.5 h-3.5 text-[#7c3aed]" />
                        <span>Quick View & Reviews</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Category Label & Rating */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#7c3aed] font-semibold">
                          {product.category.replace('-', ' ')}
                        </span>
                        {product.rating && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-500 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{product.rating}</span>
                            <span className="text-zinc-400">({product.reviewsCount || product.reviews?.length || 1})</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => onOpenProductModal(product)}
                        className="text-sm font-bold text-zinc-900 group-hover:text-purple-700 transition-colors cursor-pointer line-clamp-1"
                      >
                        {product.name}
                      </h3>

                      {/* Description Preview */}
                      <p className="mt-1 text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Pieces Available & Shipping Charge Indicators */}
                      <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-purple-700 font-semibold">
                          {product.piecesAvailable !== undefined ? product.piecesAvailable : (product.stockCount ?? 120)} pcs available
                        </span>
                        <span className={product.shippingCharge === 0 || !product.shippingCharge ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}>
                          {product.shippingCharge === 0 || !product.shippingCharge ? 'Free Shipping' : `+ ₹${product.shippingCharge} Shipping`}
                        </span>
                      </div>
                    </div>

                    {/* Size Selector */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1.5 font-mono">
                        <span>Select Size:</span>
                        <span className="font-bold text-zinc-900">{currentSize}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {product.sizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleSizeSelect(product.id, s)}
                            className={`flex-1 py-1 text-[11px] font-mono font-bold rounded border transition-colors ${
                              currentSize === s
                                ? 'bg-black text-white border-black'
                                : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-purple-300'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price and Add to Cart Button (Indian Rupees ₹) */}
                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold tabular-nums text-zinc-950 font-mono">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                          {product.originalPrice && (
                            <span className="text-xs line-through text-zinc-400 font-mono">
                              ₹{product.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleAddClick(product, e)}
                        disabled={!product.inStock}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-xs ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : product.inStock
                            ? 'bg-black text-white hover:bg-zinc-800'
                            : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. PRODUCT DETAILS & CUSTOMER REVIEWS MODAL */}
      {selectedProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => onOpenProductModal(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 border border-zinc-200 text-zinc-600 hover:text-black shadow-xs transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Product Image */}
              <div className="md:col-span-5 relative bg-zinc-100 aspect-[4/3] md:aspect-auto">
                <img
                  src={selectedProductModal.image}
                  alt={selectedProductModal.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                {selectedProductModal.isNewLaunch && (
                  <span className="absolute top-4 left-4 bg-[#7c3aed] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow">
                    New Launch Collection
                  </span>
                )}
              </div>

              {/* Product Info & Purchase Module */}
              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <span className="text-xs uppercase font-mono text-[#7c3aed] tracking-widest font-semibold">
                    {selectedProductModal.category.replace('-', ' ')}
                  </span>
                  <h2 className="text-2xl font-bold font-display uppercase tracking-tight text-zinc-950">
                    {selectedProductModal.name}
                  </h2>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-bold font-mono text-zinc-950">
                      ₹{selectedProductModal.price.toLocaleString('en-IN')}
                    </span>
                    {selectedProductModal.originalPrice && (
                      <span className="text-sm line-through text-zinc-400 font-mono">
                        ₹{selectedProductModal.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-700 font-semibold">
                    In Stock · Ships within 24 Hours
                  </p>

                  {/* Pieces Available & Shipping Charge */}
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                      <span className="text-[10px] uppercase text-zinc-500 block">Inventory:</span>
                      <span className="text-purple-700 font-bold">
                        {selectedProductModal.piecesAvailable !== undefined ? selectedProductModal.piecesAvailable : (selectedProductModal.stockCount ?? 150)} pieces available
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
                      <span className="text-[10px] uppercase text-zinc-500 block">Shipping Fee:</span>
                      <span className={selectedProductModal.shippingCharge === 0 || !selectedProductModal.shippingCharge ? 'text-emerald-700 font-bold' : 'text-zinc-700 font-bold'}>
                        {selectedProductModal.shippingCharge === 0 || !selectedProductModal.shippingCharge ? 'Free Shipping (₹0)' : `₹${selectedProductModal.shippingCharge}`}
                      </span>
                    </div>
                  </div>

                  {/* Direct Website Product Link */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Link className="w-3.5 h-3.5 text-[#7c3aed] shrink-0" />
                      <span className="font-mono text-[11px] text-zinc-700 truncate">
                        {window.location.origin}/?product={selectedProductModal.id}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const link = `${window.location.origin}/?product=${selectedProductModal.id}`;
                        navigator.clipboard.writeText(link);
                        setCopiedModalLink(true);
                        setTimeout(() => setCopiedModalLink(false), 2500);
                      }}
                      className="px-2.5 py-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-[11px] font-mono flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                      title="Copy website link for this product"
                    >
                      {copiedModalLink ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#7c3aed]" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-2 text-sm text-zinc-600 leading-relaxed">
                    {selectedProductModal.description}
                  </div>

                  {selectedProductModal.fabricDetails && (
                    <div className="pt-2 p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 font-mono">
                      <span className="text-zinc-950 block font-semibold mb-1">Fabric & Specs:</span>
                      {selectedProductModal.fabricDetails}
                    </div>
                  )}
                </div>

                {/* Size choice inside modal */}
                <div className="space-y-4 pt-4 border-t border-zinc-200">
                  <div>
                    <span className="block text-xs uppercase font-mono tracking-wider text-zinc-600 mb-2 font-semibold">
                      Select Size:
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedProductModal.sizes.map((s) => {
                        const current = selectedSizes[selectedProductModal.id] || selectedProductModal.sizes[0];
                        return (
                          <button
                            key={s}
                            onClick={() => handleSizeSelect(selectedProductModal.id, s)}
                            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                              current === s
                                ? 'bg-black text-white border-black'
                                : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-purple-300'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const size = selectedSizes[selectedProductModal.id] || selectedProductModal.sizes[0] || 'L';
                      onAddToCart(selectedProductModal, size);
                      onOpenProductModal(null);
                    }}
                    className="w-full py-4 text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-zinc-800 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Shopping Cart (₹{selectedProductModal.price.toLocaleString('en-IN')})</span>
                  </button>
                </div>

                {/* Customer Feedback & Rating Box */}
                <ProductReviews
                  product={selectedProductModal}
                  onReviewSubmitted={(updated) => {
                    if (onProductUpdated) {
                      onProductUpdated(updated);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
