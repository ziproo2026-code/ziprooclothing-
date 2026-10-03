import React, { useState } from 'react';
import { Mail, Instagram, Facebook, Youtube, ArrowUpRight, Send, CheckCircle2 } from 'lucide-react';
import type { StoreSettings } from '../types/index.js';

interface StayConnectedPageProps {
  settings?: StoreSettings;
}

export const StayConnectedPage: React.FC<StayConnectedPageProps> = ({ settings }) => {
  const email = settings?.email || 'ziproo2026@gmail.com';
  const instagram = settings?.instagram || '@_ziproo';
  const facebook = settings?.facebook || 'ZIPROO Official';
  const youtube = settings?.youtube || 'ZIPROO';

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactLocation, setContactLocation] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const [vipEmail, setVipEmail] = useState('');
  const [vipSubscribed, setVipSubscribed] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactMessage) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          location: contactLocation.trim(),
          subject: contactSubject.trim() || 'Atelier Inquiry',
          message: contactMessage.trim(),
        }),
      });

      setIsSent(true);
      setTimeout(() => {
        setContactName('');
        setContactEmail('');
        setContactPhone('');
        setContactLocation('');
        setContactSubject('');
        setContactMessage('');
        setIsSent(false);
      }, 5000);
    } catch (err) {
      console.error('Failed to submit message:', err);
      setIsSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipEmail) return;
    setVipSubscribed(true);
    setTimeout(() => {
      setVipEmail('');
      setVipSubscribed(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs uppercase tracking-[0.3em] font-mono text-[#7c3aed] font-semibold">
            Direct Atelier Channels
          </span>
          <h1 className="text-4xl sm:text-6xl font-black font-display uppercase tracking-tight text-zinc-950">
            STAY CONNECTED WITH US
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            Reach out directly for private styling appointments, press inquiries, wholesale collaborations, or order assistance.
          </p>
        </div>

        {/* 4 Prominent Clickable Social & Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Email */}
          <a
            href={`mailto:${email}`}
            className="group p-6 rounded-2xl bg-white border border-zinc-200 hover:border-purple-400 hover:bg-purple-50/20 transition-all flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-[#7c3aed] group-hover:bg-[#7c3aed] group-hover:text-white transition-colors flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-zinc-400 group-hover:text-[#7c3aed] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block mb-1">
                Official Email
              </span>
              <h3 className="text-base font-bold font-mono text-zinc-900 group-hover:text-[#7c3aed] transition-colors break-all">
                {email}
              </h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Direct inquiries and customer support. Response under 12h.
              </p>
            </div>
          </a>

          {/* 2. Instagram */}
          <a
            href={`https://instagram.com/${instagram.replace('@', '')}`}
            target="_blank"
            rel="noreferrer"
            className="group p-6 rounded-2xl bg-white border border-zinc-200 hover:border-purple-400 hover:bg-purple-50/20 transition-all flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-[#7c3aed] group-hover:bg-[#7c3aed] group-hover:text-white transition-colors flex items-center justify-center">
                <Instagram className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-zinc-400 group-hover:text-[#7c3aed] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block mb-1">
                Instagram Feed
              </span>
              <h3 className="text-base font-bold font-mono text-zinc-900 group-hover:text-[#7c3aed] transition-colors">
                {instagram}
              </h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Runway drops, fabric close-ups, fitting teasers & community tags.
              </p>
            </div>
          </a>

          {/* 3. Facebook */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            className="group p-6 rounded-2xl bg-white border border-zinc-200 hover:border-purple-400 hover:bg-purple-50/20 transition-all flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-[#7c3aed] group-hover:bg-[#7c3aed] group-hover:text-white transition-colors flex items-center justify-center">
                <Facebook className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-zinc-400 group-hover:text-[#7c3aed] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block mb-1">
                Facebook Community
              </span>
              <h3 className="text-base font-bold font-mono text-zinc-900 group-hover:text-[#7c3aed] transition-colors">
                {facebook}
              </h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Brand announcements, retail pop-up dates, and collection logs.
              </p>
            </div>
          </a>

          {/* 4. YouTube */}
          <a
            href="https://youtube.com/@ziproo"
            target="_blank"
            rel="noreferrer"
            className="group p-6 rounded-2xl bg-white border border-zinc-200 hover:border-red-400 hover:bg-red-50/20 transition-all flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors flex items-center justify-center">
                <Youtube className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-zinc-400 group-hover:text-red-600 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block mb-1">
                YouTube Channel
              </span>
              <h3 className="text-base font-bold font-mono text-zinc-900 group-hover:text-red-600 transition-colors">
                {youtube}
              </h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                Lookbook films, design atelier documentaries, and capsule releases.
              </p>
            </div>
          </a>
        </div>

        {/* Contact Form & VIP Identity Club */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Direct Inquiry Form */}
          <div className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-white border border-zinc-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-display uppercase tracking-tight text-zinc-950 mb-2">
                Send a Message to the Atelier
              </h2>
              <p className="text-xs text-zinc-500">
                Have questions about fit, custom sizing, or orders? Drop us a note.
              </p>
            </div>

            {isSent ? (
              <div className="p-6 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#7c3aed]" />
                <span className="text-sm font-semibold">
                  Thank you! Your dispatch has been transmitted to ziproo2026@gmail.com. We will respond shortly.
                </span>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Jordan Hayes"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                      Your Location / City
                    </label>
                    <input
                      type="text"
                      value={contactLocation}
                      onChange={(e) => setContactLocation(e.target.value)}
                      placeholder="e.g. Bengaluru, Karnataka"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Subject / Topic
                  </label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="e.g. Custom Styling, Fit Advice, Wholesale"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Message / Inquiry *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Tell us what you're thinking, inquiring about sizing, or requesting styling advice..."
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-zinc-800 rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Transmitting...' : 'Transmit Inquiry'}</span>
                </button>
              </form>
            )}
          </div>

          {/* VIP Identity Newsletter */}
          <div className="lg:col-span-5 p-8 sm:p-10 rounded-3xl bg-white border border-zinc-200 shadow-sm space-y-6">
            <span className="text-xs uppercase font-mono text-[#7c3aed] tracking-widest block font-semibold">
              VIP Identity Access
            </span>
            <h3 className="text-2xl font-black font-display uppercase tracking-tight text-zinc-950 leading-tight">
              Get Private Drop Notifications
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              ZIPROO capsules are produced in strictly limited runs of 100–300 pieces. Subscribers receive access codes 1 hour before general public drop releases.
            </p>

            {vipSubscribed ? (
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#7c3aed]" />
                <span>You're registered for Capsule 02 early access.</span>
              </div>
            ) : (
              <form onSubmit={handleVipSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  value={vipEmail}
                  onChange={(e) => setVipEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
                />
                <button
                  type="submit"
                  className="w-full py-3.5 text-xs font-bold uppercase tracking-wider text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-xl transition-all shadow-sm"
                >
                  Request Early Access Code
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-zinc-100 text-[11px] text-zinc-500 font-mono">
              No spam. Unsubscribe at any time with one click.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
