import React, { useState } from 'react';
import { ZiprooLogo } from './ZiprooLogo.js';
import { ZMonogramLogo } from './ZMonogramLogo.js';
import { ShoppingBag, Search, ShieldCheck, Menu, X, ArrowRight, User, LogOut, PackageCheck, Package, Store } from 'lucide-react';
import type { AdminUser, Customer } from '../types/index.js';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  adminUser: AdminUser | null;
  onOpenAdmin: () => void;
  onOpenSearch: () => void;
  customer?: Customer | null;
  onOpenCustomerAuth?: () => void;
  onCustomerLogout?: () => void;
  onOpenTrackOrder?: () => void;
  onOpenCustomerOrders?: () => void;
  onOpenSellerPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  cartCount,
  onOpenCart,
  adminUser,
  onOpenAdmin,
  onOpenSearch,
  customer,
  onOpenCustomerAuth,
  onCustomerLogout,
  onOpenTrackOrder,
  onOpenCustomerOrders,
  onOpenSellerPortal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'story', label: 'Our Story' },
    { id: 'shop', label: 'Shopping' },
    { id: 'new-launch', label: 'New Launch' },
    { id: 'about', label: 'About Us' },
    { id: 'connect', label: 'Stay Connected' },
  ];

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/90 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Zone 1: Single Brand Lockup with exact ZIPROO logo */}
          <div className="flex-shrink-0">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] rounded-sm group transition-transform active:scale-98"
              aria-label="ZIPROO Home"
            >
              <ZiprooLogo size="md" variant="dark" />
            </button>
          </div>

          {/* Zone 2: 6 Clean Text Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium tracking-wide">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`relative py-1 transition-colors whitespace-nowrap uppercase tracking-wider text-xs font-semibold ${
                    isActive
                      ? 'text-zinc-950 font-bold'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#7c3aed] transition-all" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions (Search, Cart, Admin) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Instant Search Button */}
            <button
              onClick={onOpenSearch}
              aria-label="Search clothing catalog"
              className="p-2.5 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#7c3aed]"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              aria-label={`Shopping bag with ${cartCount} items`}
              className="relative p-2.5 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#7c3aed]"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#7c3aed] text-[11px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Track Order Button */}
            {onOpenTrackOrder && (
              <button
                onClick={onOpenTrackOrder}
                aria-label="Track your order"
                title="Track Customer Order Status"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 text-xs font-mono transition-all shadow-xs"
              >
                <PackageCheck className="w-3.5 h-3.5 text-[#7c3aed]" />
                <span className="hidden md:inline">Track Order</span>
              </button>
            )}

            {/* Customer Account & Sign In */}
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenCustomerAuth}
                aria-label="Customer Account & Login"
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-mono transition-all shadow-xs ${
                  customer
                    ? 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:border-zinc-300'
                }`}
                title={customer ? `Signed in as ${customer.name} (${customer.location || customer.city})` : 'Customer Sign In / Register Address'}
              >
                <User className={`w-3.5 h-3.5 ${customer ? 'text-[#7c3aed]' : 'text-zinc-500'}`} />
                <span className="hidden sm:inline">
                  {customer ? customer.name.split(' ')[0] : 'Sign In'}
                </span>
              </button>

              {/* Dedicated My Orders Portal Button - Always Visible */}
              {onOpenCustomerOrders && (
                <button
                  type="button"
                  onClick={onOpenCustomerOrders}
                  title="My Orders Portal - View Purchased Products & Order History"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-mono font-semibold transition-all shadow-xs"
                >
                  <Package className="w-3.5 h-3.5 text-[#7c3aed]" />
                  <span className="hidden sm:inline">My Orders</span>
                </button>
              )}

              {/* Direct Quick Logout Button for Customer */}
              {customer && onCustomerLogout && (
                <button
                  type="button"
                  onClick={onCustomerLogout}
                  title="Sign out of customer account"
                  aria-label="Log Out"
                  className="p-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-all shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Seller Portal Entrance */}
            {onOpenSellerPortal && (
              <button
                onClick={onOpenSellerPortal}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all shadow-xs ${
                  currentPage === 'seller'
                    ? 'bg-[#7c3aed] border-[#7c3aed] text-white shadow-xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:border-zinc-300'
                }`}
                title="ZIPROO Seller Portal (/seller/dashboard)"
              >
                <Store className={`w-3.5 h-3.5 ${currentPage === 'seller' ? 'text-white' : 'text-[#7c3aed]'}`} />
                <span className="hidden md:inline font-mono">Seller Portal</span>
              </button>
            )}

            {/* Admin Entrance */}
            <button
              onClick={onOpenAdmin}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all shadow-xs ${
                adminUser
                  ? 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:border-zinc-300'
              }`}
              title={adminUser ? `Signed in as ${adminUser.username}` : 'Admin Portal'}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${adminUser ? 'text-[#7c3aed]' : 'text-zinc-500'}`} />
              <span className="hidden md:inline font-mono">
                {adminUser ? 'Admin Portal' : 'Admin'}
              </span>
            </button>

            {/* Monogram Logo in Top Right Corner */}
            <ZMonogramLogo
              size="sm"
              onClick={() => handleNavClick('home')}
              className="cursor-pointer ml-1"
            />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-700 hover:text-zinc-950 rounded-lg focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-zinc-200 bg-white px-4 pt-2 pb-6 space-y-2 shadow-md">
          {/* Mobile Customer Sign In & Logout */}
          <div className="pb-2 border-b border-zinc-100 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenCustomerAuth) onOpenCustomerAuth();
                }}
                className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#7c3aed]" />
                  <span className="truncate">{customer ? `Signed in: ${customer.name}` : 'Customer Sign In & Address'}</span>
                </div>
                <span className="text-[10px] text-purple-700 font-bold uppercase shrink-0">
                  {customer ? 'Profile' : 'Login'}
                </span>
              </button>

              {customer && onCustomerLogout && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onCustomerLogout();
                  }}
                  title="Sign out of customer account"
                  className="px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-mono font-bold flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              )}
            </div>

            {onOpenCustomerOrders && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCustomerOrders();
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs font-mono font-bold"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#7c3aed]" />
                  <span>My Orders & Purchased Products</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-50" />
              </button>
            )}

            {onOpenTrackOrder && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTrackOrder();
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-700 hover:text-zinc-950 text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-[#7c3aed]" />
                  <span>Track Your Order</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-50" />
              </button>
            )}

            {onOpenSellerPortal && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSellerPortal();
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-mono font-bold ${
                  currentPage === 'seller'
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Store className={`w-4 h-4 ${currentPage === 'seller' ? 'text-white' : 'text-[#7c3aed]'}`} />
                  <span>Seller Portal (/seller/dashboard)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-50" />
              </button>
            )}
          </div>

          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`flex items-center justify-between w-full px-4 py-3 text-sm font-semibold rounded-lg tracking-wider uppercase transition-colors ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 border-l-4 border-[#7c3aed]'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                }`}
              >
                <span>{link.label}</span>
                <ArrowRight className="w-4 h-4 opacity-50" />
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
