import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ChevronRight, Star, Play } from 'lucide-react';
import { IntroVideoExperience } from '../components/IntroVideoExperience.js';
import heroStreetwearImage from '../assets/images/ziproo_hero_streetwear_1790610627145.jpg';
import type { Product, StoreSettings } from '../types/index.js';

interface HomePageProps {
  onNavigate: (page: string) => void;
  products: Product[];
  settings?: StoreSettings;
  onSelectProduct: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  products,
  settings,
  onSelectProduct,
}) => {
  const headline = 'CREATE YOUR IDENTITY';
  const newLaunches = products.filter((p) => p.isNewLaunch).slice(0, 4);

  // Intro video automatically plays on entry / reload and stays off during normal navigation
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    try {
      const hasViewedInCurrentNav = sessionStorage.getItem('ziproo_intro_viewed_nav');
      if (!hasViewedInCurrentNav) {
        setShowIntro(true);
      }
    } catch {
      setShowIntro(true);
    }
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    try {
      sessionStorage.setItem('ziproo_intro_viewed_nav', 'true');
    } catch {
      // Storage unavailable
    }
  };

  // Video URL resolution: prioritize stored settings, then active intro video, fallback to default
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>(() => {
    return settings?.introVideoUrl || '/intro_video.mp4';
  });

  useEffect(() => {
    if (settings?.introVideoUrl) {
      setActiveVideoUrl(settings.introVideoUrl);
    } else {
      // Query server public active video
      fetch('/api/public/active-intro-video')
        .then((res) => res.json())
        .then((data) => {
          if (data?.videoUrl) {
            setActiveVideoUrl(data.videoUrl);
          }
        })
        .catch(() => {});
    }
  }, [settings?.introVideoUrl]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900">
      {/* 0. Fullscreen Cinematic Brand Intro Video (The Only Website Intro Video) */}
      <IntroVideoExperience
        isOpen={showIntro && settings?.introVideoEnabled !== false}
        onComplete={handleIntroComplete}
        videoUrl={activeVideoUrl}
      />

      {/* 1. HERO SECTION - Clean, Minimal & Prominent "CREATE YOUR IDENTITY" */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 border-b border-zinc-200">
        {/* Fashion Editorial Background with measured light scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroStreetwearImage}
            alt="ZIPROO 2026 Streetwear Editorial Atelier"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-40 scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Multi-stop gradient scrim to guarantee WCAG AA contrast on light theme */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8f9fa] via-[#f8f9fa]/85 to-[#f8f9fa]/65" />
          {/* Subtle electric purple glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#7c3aed]/10 blur-[130px] pointer-events-none rounded-full" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center py-20 sm:py-28">
          {/* User Requirement: ZIPROO name in capital letter in front page */}
          <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[8.5rem] font-black tracking-[0.14em] uppercase font-['Syncopate',sans-serif] text-zinc-950 leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.08)] mb-4 select-none">
            ZIPROO
          </h1>

          {/* User Requirement: Main headline prominently gives "CREATE YOUR IDENTITY" */}
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-[0.25em] uppercase font-display text-[#7c3aed] mb-6 text-balance">
            {headline}
          </h2>

          <p className="text-sm sm:text-base text-zinc-600 max-w-xl mx-auto font-normal leading-relaxed mb-8">
            Modern luxury streetwear engineered with heavyweight Portuguese terry, architectural boxy fits, and uncompromising individuality.
          </p>

          {/* Button to explore the collection & Play Intro Video */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate('shop')}
              className="group relative inline-flex items-center gap-3 px-8 py-4 text-xs font-bold uppercase tracking-widest text-white bg-black rounded-xl hover:bg-zinc-800 transition-all shadow-md active:scale-98 whitespace-nowrap"
            >
              <span>Shop Now</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => onNavigate('story')}
              className="inline-flex items-center gap-2 px-6 py-4 text-xs font-semibold tracking-wider uppercase text-zinc-800 hover:text-black border border-zinc-300 hover:border-zinc-500 rounded-xl bg-white/90 hover:bg-white backdrop-blur-sm transition-all whitespace-nowrap active:scale-98 shadow-xs"
            >
              <span>Our Story</span>
            </button>

            <button
              onClick={() => setShowIntro(true)}
              className="group inline-flex items-center gap-2 px-5 py-4 text-xs font-semibold tracking-wider uppercase text-purple-700 hover:text-purple-900 border border-purple-300 hover:border-purple-500 rounded-xl bg-purple-50 hover:bg-purple-100 backdrop-blur-sm transition-all whitespace-nowrap active:scale-98 shadow-sm"
              title="Watch ZIPROO Intro Video"
            >
              <Play className="w-3.5 h-3.5 fill-current text-purple-600 group-hover:text-purple-700 transition-colors" />
              <span>Watch Intro</span>
            </button>
          </div>

          {/* Subtle Year & Identity Marker */}
          <div className="mt-12 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-zinc-500 font-mono">
            <span>Est. 2026</span>
            <span aria-hidden="true" className="text-[#7c3aed]">·</span>
            <span>All-India Express Delivery</span>
            <span aria-hidden="true" className="text-[#7c3aed]">·</span>
            <span>Capsule 01 Drop</span>
          </div>
        </div>
      </section>

      {/* 2. CURATED NEW LAUNCHES SPOTLIGHT */}
      {newLaunches.length > 0 && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-zinc-200 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#7c3aed] uppercase tracking-widest mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Just Dropped · Capsule 01</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase font-display tracking-tight text-zinc-950">
                New Launch Series
              </h2>
            </div>
            <button
              onClick={() => onNavigate('new-launch')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-600 hover:text-black group"
            >
              <span>View All New Drops</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Responsive Product Grid with Rupees & Ratings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newLaunches.map((product) => (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group cursor-pointer rounded-2xl bg-white border border-zinc-200 overflow-hidden hover:border-purple-300 hover:shadow-xl transition-all flex flex-col justify-between"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  {product.isNewLaunch && (
                    <div className="absolute top-3 left-3 bg-[#7c3aed] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                      New Launch
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-[#7c3aed] uppercase tracking-wider font-semibold">
                        {product.category.replace('-', ' ')}
                      </span>
                      {product.rating && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-amber-500 font-semibold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{product.rating}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 group-hover:text-purple-700 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold tabular-nums text-zinc-950 font-mono">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.originalPrice && (
                        <span className="ml-2 text-xs line-through text-zinc-400 font-mono">
                          ₹{product.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 group-hover:text-zinc-950 font-medium">
                      Select Size →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. MANIFESTO BANNER */}
      <section className="py-20 border-t border-zinc-200 bg-gradient-to-b from-white to-zinc-100 text-center px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="text-xs uppercase tracking-[0.3em] text-[#7c3aed] font-semibold">
            ZIPROO Core Philosophy
          </span>
          <p className="text-3xl sm:text-5xl font-black font-display uppercase tracking-tight text-zinc-950 leading-tight">
            "DON'T FOLLOW THE RULES. CREATE IT."
          </p>
          <p className="text-sm sm:text-base text-zinc-600 max-w-xl mx-auto leading-relaxed">
            Streetwear is not imitation. It is an architecture of self-expression. Every seam, cut, and drop from ZIPROO is created for those who author their own identity.
          </p>
          <div className="pt-4">
            <button
              onClick={() => onNavigate('shop')}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-900 border border-zinc-300 hover:border-black hover:bg-black hover:text-white rounded-xl transition-all shadow-xs bg-white"
            >
              Shop The Drop Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
