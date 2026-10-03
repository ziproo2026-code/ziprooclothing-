import React from 'react';
import { ZiprooLogo } from '../components/ZiprooLogo.js';
import { Sparkles, Eye, ShieldCheck, HeartHandshake, Compass, Layers } from 'lucide-react';

interface AboutUsPageProps {
  onNavigateToShop: () => void;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({ onNavigateToShop }) => {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* 1. HERO BRAND ANCHOR */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="flex justify-center mb-6">
            <ZiprooLogo size="xl" variant="dark" showTagline />
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-display uppercase tracking-tight text-zinc-950 leading-tight">
            Creativity. Comfort. Self-Expression.
          </h1>

          <p className="text-lg sm:text-xl text-zinc-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Established in 2026, <span className="text-zinc-950 font-bold">ZIPROO</span> is an international streetwear brand created to dismantle conformity through disciplined sartorial architecture.
          </p>
        </div>

        {/* 2. THREE PILLARS: VISION, MISSION, PHILOSOPHY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Vision */}
          <div className="p-8 rounded-2xl bg-white border border-zinc-200 relative overflow-hidden group hover:border-purple-300 shadow-sm transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center mb-6">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950 mb-3">
              Our Vision
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              To ignite a global generation of non-conformists who view clothing not merely as apparel, but as an uncompromising statement of individuality and sovereign identity.
            </p>
          </div>

          {/* Mission */}
          <div className="p-8 rounded-2xl bg-white border border-zinc-200 relative overflow-hidden group hover:border-purple-300 shadow-sm transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center mb-6">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950 mb-3">
              Our Mission
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              To craft luxury-weight streetwear combining heavyweight natural textiles with architectural boxy silhouettes, providing maximum sensory comfort and perpetual durability.
            </p>
          </div>

          {/* Philosophy */}
          <div className="p-8 rounded-2xl bg-white border border-zinc-200 relative overflow-hidden group hover:border-purple-300 shadow-sm transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center mb-6">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950 mb-3">
              Brand Philosophy
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              <span className="text-zinc-950 font-bold">"DON'T FOLLOW THE RULES. CREATE IT."</span> Rules in fashion are designed for followers. At ZIPROO, we architect the garments for those who set the standard.
            </p>
          </div>
        </div>

        {/* 3. ATELIER & CRAFTSMANSHIP SECTION */}
        <div className="p-8 sm:p-14 rounded-3xl bg-white border border-zinc-200 shadow-lg grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs uppercase font-mono text-[#7c3aed] tracking-[0.25em] font-semibold">
              The 2026 Atelier Standard
            </span>
            <h2 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-tight text-zinc-950 leading-tight">
              Weight. Structure. Longevity.
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              Most commercial clothing uses lightweight 160–180 GSM cotton that thins and decays after several washes. ZIPROO establishes a new baseline: 280 GSM combed jersey tees and 480 GSM French Terry outerwear that drape cleanly, resist distortion, and age with character.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-100 font-mono">
              <div>
                <span className="text-3xl font-black text-zinc-950 block">280–480</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Grams per Sq Meter</span>
              </div>
              <div>
                <span className="text-3xl font-black text-zinc-950 block">100%</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Natural Fibers</span>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-zinc-200 shadow-lg">
            <img
              src="/src/assets/images/ziproo_hero_streetwear_1790610627145.jpg"
              alt="ZIPROO Atelier Workshop"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-6">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-200">
                Studio Prototype Fitting · Est. 2026
              </span>
            </div>
          </div>
        </div>

        {/* 4. CALL TO ACTION */}
        <div className="text-center py-10 space-y-6">
          <h3 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-tight text-zinc-950">
            Ready to Create Your Identity?
          </h3>
          <div>
            <button
              onClick={onNavigateToShop}
              className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-zinc-800 rounded-lg transition-all shadow-md"
            >
              Shop Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
