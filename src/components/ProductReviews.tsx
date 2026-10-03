import React, { useState } from 'react';
import type { Product, ProductReview } from '../types/index.js';
import { Star, MessageSquarePlus, CheckCircle2, ThumbsUp, Send } from 'lucide-react';

interface ProductReviewsProps {
  product: Product;
  onReviewSubmitted?: (updatedProduct: Product) => void;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ product, onReviewSubmitted }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const reviews = product.reviews || [];
  const avgRating = product.rating || (reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 4.9);
  const reviewCount = product.reviewsCount || reviews.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (res.ok && data.product) {
        setSuccessMessage('Thank you! Your verified feedback has been posted.');
        setName('');
        setComment('');
        setShowAddForm(false);
        if (onReviewSubmitted) {
          onReviewSubmitted(data.product);
        }
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error submitting feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pt-4 border-t border-zinc-200">
      {/* Header with aggregate stars */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(Number(avgRating))
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-zinc-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-bold text-zinc-950 font-mono">{avgRating} / 5</span>
          <span className="text-xs text-zinc-500">({reviewCount} customer reviews)</span>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 hover:text-black border border-zinc-200 transition-colors shadow-xs"
        >
          <MessageSquarePlus className="w-3.5 h-3.5 text-[#7c3aed]" />
          <span>{showAddForm ? 'Cancel Review' : 'Write a Review'}</span>
        </button>
      </div>

      {/* Success feedback alert */}
      {successMessage && (
        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#7c3aed]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Write a review form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-4 animate-in fade-in shadow-xs">
          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {errorMessage}
            </div>
          )}

          <h4 className="text-xs uppercase font-mono tracking-wider text-zinc-900 font-bold">
            Customer Feedback & Rating
          </h4>

          {/* Interactive Star Picker */}
          <div>
            <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1 font-semibold">
              Your Rating (1 to 5 Stars)
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`w-5 h-5 transition-colors ${
                      s <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-zinc-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-mono text-zinc-700 font-bold">{rating} Stars</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1 font-semibold">
              Your Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rohan Sharma"
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed]"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1 font-semibold">
              Feedback on Fit, Fabric & Quality
            </label>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How is the boxy fit, cotton weight, comfort, and silhouette?"
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Posting...' : 'Submit Review'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {reviews.length === 0 ? (
          <p className="text-xs text-zinc-500 py-2">
            Be the first customer to leave feedback on this garment!
          </p>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-950">{rev.customerName}</span>
                  {rev.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-mono font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified Buyer</span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">{rev.date}</span>
              </div>

              {/* Stars */}
              <div className="flex items-center text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'
                    }`}
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="text-zinc-700 leading-relaxed text-[11px] pt-1">{rev.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
