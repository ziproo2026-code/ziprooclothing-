import React from 'react';
import { ZiprooLogo } from './ZiprooLogo.js';
import { Mail, Instagram, Facebook, Youtube, ArrowUpRight } from 'lucide-react';
import type { StoreSettings } from '../types/index.js';

interface FooterProps {
  onNavigate: (page: string) => void;
  settings?: StoreSettings;
  onOpenTrackOrder?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, settings, onOpenTrackOrder }) => {
  const email = settings?.email || 'ziproo2026@gmail.com';
  const instagram = settings?.instagram || '@_ziproo';
  const facebook = settings?.facebook || 'ZIPROO Official';
  const youtube = settings?.youtube || 'ZIPROO';
  const slogan = settings?.secondarySlogan || "DON'T FOLLOW THE RULES. CREATE IT.";

  return (
    <footer className="bg-zinc-100 border-t border-zinc-200 text-zinc-600 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-14 border-b border-zinc-200">
          {/* Brand Info & Logo */}
          <div className="md:col-span-5 space-y-6">
            <ZiprooLogo size="lg" variant="dark" />
            <p className="text-xl md:text-2xl font-bold tracking-tight text-zinc-950 font-display uppercase max-w-sm">
              {slogan}
            </p>
            <p className="text-sm text-zinc-600 max-w-md leading-relaxed">
              Established in 2026. Architectural silhouettes, heavyweight natural textiles, and uncompromising individuality. Born in the atelier, engineered for the streets.
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-950">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-zinc-950 transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('story')}
                  className="hover:text-zinc-950 transition-colors"
                >
                  Our Story
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="hover:text-zinc-950 transition-colors"
                >
                  Shopping
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('new-launch')}
                  className="hover:text-zinc-950 transition-colors"
                >
                  New Launch
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-zinc-950 transition-colors"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('connect')}
                  className="hover:text-zinc-950 transition-colors"
                >
                  Stay Connected
                </button>
              </li>
              {onOpenTrackOrder && (
                <li>
                  <button
                    onClick={onOpenTrackOrder}
                    className="text-[#7c3aed] hover:text-purple-900 font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <span>Track Order</span>
                    <span className="text-[10px] font-mono uppercase bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded text-purple-700">
                      Live
                    </span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Connect & Social Channels */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-950">
              Direct Channels
            </h4>
            <div className="space-y-3 text-sm">
              {/* Email */}
              <a
                href={`mailto:${email}`}
                className="group flex items-center justify-between p-3 rounded-lg bg-white border border-zinc-200 hover:border-purple-300 hover:bg-zinc-50 transition-all text-zinc-700 hover:text-zinc-950 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-zinc-100 text-[#7c3aed] group-hover:bg-[#7c3aed] group-hover:text-white transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Email Us</span>
                    <span className="font-mono text-xs">{email}</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              {/* Instagram */}
              <a
                href={`https://instagram.com/${instagram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between p-3 rounded-lg bg-white border border-zinc-200 hover:border-purple-300 hover:bg-zinc-50 transition-all text-zinc-700 hover:text-zinc-950 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-zinc-100 text-[#7c3aed] group-hover:bg-[#7c3aed] group-hover:text-white transition-colors">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Instagram</span>
                    <span className="font-semibold text-xs text-zinc-900">{instagram}</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between p-3 rounded-lg bg-white border border-zinc-200 hover:border-purple-300 hover:bg-zinc-50 transition-all text-zinc-700 hover:text-zinc-950 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-zinc-100 text-[#7c3aed] group-hover:bg-[#7c3aed] group-hover:text-white transition-colors">
                    <Facebook className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Facebook</span>
                    <span className="font-semibold text-xs text-zinc-900">{facebook}</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com/@ziproo"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between p-3 rounded-lg bg-white border border-zinc-200 hover:border-red-300 hover:bg-zinc-50 transition-all text-zinc-700 hover:text-zinc-950 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-zinc-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">YouTube Page</span>
                    <span className="font-semibold text-xs text-zinc-900">{youtube}</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>Copyright © 2026 {settings?.brandName || 'ZIPROO FASHION'}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-zinc-500 font-mono text-[11px]">
              {settings?.domain || 'ziproofashion.com'}
            </span>
            <span className="text-[#7c3aed] font-semibold tracking-wider uppercase text-[10px]">
              Est. 2026 · Worldwide Shipping
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
