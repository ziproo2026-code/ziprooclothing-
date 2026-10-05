import React, { useState, useEffect } from 'react';
import type { Product } from '../types/index.js';
import {
  X,
  ShoppingBag,
  Zap,
  Check,
  Star,
  Copy,
  Link,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  Scissors,
  Droplet,
} from 'lucide-react';
import { ProductReviews } from './ProductReviews.js';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity?: number) => void;
  onBuyNow: (product: Product, size: string) => void;
  onProductUpdated?: (updatedProduct: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
  onProductUpdated,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Initialize selections when product changes
  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      setSelectedSize(product.sizes?.[0] || 'L');
      setSelectedColor(product.colors?.[0] || product.color || 'Deep Onyx Black');
      setQuantity(1);
      setIsAdded(false);
    }
  }, [product]);

  // Handle ESC key to close modal or lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomOpen) {
          setIsZoomOpen(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isZoomOpen, onClose]);

  if (!isOpen || !product) return null;

  // Build gallery image list (support 3-4 images)
  const galleryImages: string[] =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image];

  const currentImage = galleryImages[selectedImageIndex] || product.image;
  const isOutOfStock = !product.inStock || (product.piecesAvailable !== undefined && product.piecesAvailable <= 0);

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const handleAdd = () => {
    if (isOutOfStock) return;
    const sizeToUse = selectedSize || product.sizes[0] || 'L';
    onAddToCart(product, sizeToUse, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleInstantBuy = () => {
    if (isOutOfStock) return;
    const sizeToUse = selectedSize || product.sizes[0] || 'L';
    onBuyNow(product, sizeToUse);
  };

  const productUrl = `${window.location.origin}/?product=${product.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <>
      {/* ================= MAIN PRODUCT DETAILS MODAL ================= */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in overflow-y-auto">
        <div className="relative w-full max-w-5xl bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-2xl my-auto max-h-[94vh] flex flex-col text-zinc-900">
          
          {/* Top Sticky Bar with Breadcrumb and Close */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white/95 backdrop-blur-sm z-20">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
              <span className="uppercase tracking-widest text-[#7c3aed] font-semibold">
                ZIPROO ATELIER
              </span>
              <span>/</span>
              <span className="uppercase text-zinc-700 font-medium">
                {product.category.replace('-', ' ')}
              </span>
              <span>/</span>
              <span className="text-zinc-950 font-bold truncate max-w-[200px] sm:max-w-xs">
                {product.name}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Content */}
          <div className="overflow-y-auto flex-1 p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              
              {/* ================= LEFT COLUMN: 3-4 IMAGE GALLERY ================= */}
              <div className="lg:col-span-6 space-y-4">
                
                {/* Large Main Image Display with Zoom Trigger */}
                <div
                  onClick={() => setIsZoomOpen(true)}
                  className="relative aspect-[4/3] sm:aspect-square bg-zinc-100 rounded-2xl overflow-hidden cursor-zoom-in group border border-zinc-200 shadow-sm"
                >
                  <img
                    src={currentImage}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {/* Stock & Launch Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
                    {product.isNewLaunch && (
                      <span className="bg-[#7c3aed] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>New Launch Drop</span>
                      </span>
                    )}

                    {isOutOfStock ? (
                      <span className="bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                        OUT OF STOCK
                      </span>
                    ) : (
                      <span className="bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>IN STOCK</span>
                      </span>
                    )}
                  </div>

                  {/* Full-screen Zoom Hint Overlay */}
                  <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity shadow-lg">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Click to Zoom</span>
                  </div>

                  {/* Navigation Arrows for switching images if multi-image */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 z-10"
                        title="Previous photo"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 z-10"
                        title="Next photo"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Images Row (3-4 Separate Images) */}
                {galleryImages.length > 1 && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mb-2">
                      <span>Image Gallery ({galleryImages.length} angles):</span>
                      <span className="text-[#7c3aed] font-semibold">Angle {selectedImageIndex + 1} of {galleryImages.length}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {galleryImages.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all bg-zinc-100 ${
                            selectedImageIndex === idx
                              ? 'border-[#7c3aed] ring-2 ring-purple-200 shadow-md scale-102'
                              : 'border-zinc-200 hover:border-zinc-400 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`${product.name} view ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover object-center"
                          />
                          {selectedImageIndex === idx && (
                            <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#7c3aed]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shareable Product Link */}
                <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link className="w-4 h-4 text-[#7c3aed] shrink-0" />
                    <span className="font-mono text-[11px] text-zinc-600 truncate">
                      {productUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-900 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#7c3aed]" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ================= RIGHT COLUMN: PRODUCT DETAILS & ACTIONS ================= */}
              <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
                <div className="space-y-5">
                  
                  {/* Category and Rating */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-mono tracking-widest text-[#7c3aed] font-bold">
                      {product.category.replace('-', ' ')}
                    </span>
                    {product.rating && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{product.rating}</span>
                        <span className="text-zinc-400">({product.reviewsCount || product.reviews?.length || 1})</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-tight text-zinc-950">
                    {product.name}
                  </h1>

                  {/* Pricing Breakdown with MRP & Discounts */}
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black font-mono text-zinc-950">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <>
                          <span className="text-sm line-through text-zinc-400 font-mono">
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                          </span>
                          {discountPercent && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <div className="text-[11px] font-mono text-zinc-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Inclusive of all taxes</span>
                      <span>·</span>
                      <span className="text-purple-700 font-semibold">
                        GST {product.gstRate ?? (product.price >= 1000 ? 12 : 5)}% (HSN {product.hsnCode || '6109'})
                      </span>
                      <span>·</span>
                      <span className={product.shippingCharge === 0 || !product.shippingCharge ? 'text-emerald-700 font-semibold' : 'text-zinc-600'}>
                        {product.shippingCharge === 0 || !product.shippingCharge ? 'FREE EXPRESS SHIPPING' : `+ ₹${product.shippingCharge} Shipping`}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="text-sm text-zinc-600 leading-relaxed">
                    {product.description}
                  </div>

                  {/* Available Colours */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="uppercase text-zinc-500 font-semibold">Available Colours:</span>
                        <span className="text-zinc-950 font-bold">{selectedColor}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {product.colors.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSelectedColor(c)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                              selectedColor === c
                                ? 'bg-black text-white border-black shadow-sm font-bold'
                                : 'bg-white text-zinc-700 border-zinc-300 hover:border-purple-300'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Sizes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="uppercase text-zinc-500 font-semibold">Available Sizes:</span>
                      <span className="text-zinc-950 font-bold">Selected: {selectedSize}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all border ${
                            selectedSize === s
                              ? 'bg-black text-white border-black shadow-md scale-102'
                              : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-purple-300'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stock Status Banner */}
                  <div className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-mono bg-zinc-50 border-zinc-200">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isOutOfStock ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'
                        }`}
                      />
                      <span className="font-bold text-zinc-950">
                        {isOutOfStock ? 'OUT OF STOCK' : 'IN STOCK & READY TO SHIP'}
                      </span>
                    </div>
                    <span className="text-zinc-600">
                      {isOutOfStock
                        ? 'Temporarily Sold Out'
                        : `${product.piecesAvailable !== undefined ? product.piecesAvailable : (product.stockCount ?? 120)} units available`}
                    </span>
                  </div>

                  {/* Material / Fabric, GSM, Features, and Care Grid */}
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-zinc-200/80">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">
                          Fabric & Material
                        </span>
                        <span className="font-semibold text-zinc-900 block">
                          {product.fabricDetails || '100% Combed Heavy Cotton'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">
                          GSM Weight
                        </span>
                        <span className="font-semibold text-purple-700 font-mono block">
                          {product.gsm ? `${product.gsm} GSM` : '280 GSM Heavyweight'}
                        </span>
                      </div>
                    </div>

                    {/* Features list */}
                    {product.features && product.features.length > 0 && (
                      <div className="pb-3 border-b border-zinc-200/80 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                          Apparel Features:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-zinc-700">
                          {product.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px]">
                              <Check className="w-3.5 h-3.5 text-[#7c3aed] shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Care Instructions */}
                    <div>
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">
                        Care Instructions:
                      </span>
                      <p className="text-[11px] text-zinc-600 leading-relaxed">
                        {product.careInstructions ||
                          'Cold machine wash inside out with similar colors. Do not tumble dry. Dry flat in shade. Iron on reverse.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ================= ACTION BUTTONS: ADD TO CART & BUY NOW ================= */}
                <div className="space-y-3 pt-4 border-t border-zinc-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={isOutOfStock}
                      className={`w-full py-4 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 ${
                        isOutOfStock
                          ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed border border-zinc-300'
                          : isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-900 hover:bg-black text-white active:scale-98'
                      }`}
                    >
                      {isOutOfStock ? (
                        <span>OUT OF STOCK</span>
                      ) : isAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Added to Cart!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>

                    {/* Buy Now Button */}
                    <button
                      type="button"
                      onClick={handleInstantBuy}
                      disabled={isOutOfStock}
                      className={`w-full py-4 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 ${
                        isOutOfStock
                          ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                          : 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white active:scale-98'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>{isOutOfStock ? 'UNAVAILABLE' : 'Buy Now'}</span>
                    </button>
                  </div>

                  {/* Reassurance notes */}
                  <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-zinc-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3 text-[#7c3aed]" />
                      <span>Express 24H Dispatch</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>100% Genuine Atelier Drop</span>
                    </span>
                  </div>
                </div>

                {/* Customer Reviews & Feedback Component */}
                <div className="pt-4 border-t border-zinc-200">
                  <ProductReviews
                    product={product}
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
        </div>
      </div>

      {/* ================= FULL-SCREEN IMAGE VIEWER / ZOOM LIGHTBOX ================= */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in">
          {/* Header */}
          <div className="w-full max-w-6xl flex items-center justify-between text-white py-2 z-10">
            <div>
              <span className="text-xs uppercase font-mono text-[#7c3aed] tracking-widest block font-bold">
                FULL RESOLUTION ATELIER VIEWER
              </span>
              <h4 className="text-sm font-bold truncate max-w-md">{product.name}</h4>
            </div>

            <button
              onClick={() => setIsZoomOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Close image viewer (ESC)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Large Image Box without Cropping */}
          <div className="relative flex-1 w-full max-w-6xl flex items-center justify-center p-2 sm:p-6 overflow-hidden">
            <img
              src={currentImage}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform"
            />

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all"
                  title="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all"
                  title="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Footer Thumbnails in Lightbox */}
          <div className="w-full max-w-md py-3 flex items-center justify-center gap-3 overflow-x-auto">
            {galleryImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImageIndex(idx)}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImageIndex === idx
                    ? 'border-[#7c3aed] ring-2 ring-purple-400 scale-105'
                    : 'border-white/30 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
