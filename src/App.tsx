import React, { useState, useEffect } from 'react';
import type { Product, CompanyUpdate, StoreSettings, CartItem, Order, AdminUser, Customer } from './types/index.js';
import { MovingSloganBar } from './components/MovingSloganBar.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { HomePage } from './pages/HomePage.js';
import { OurStoryPage } from './pages/OurStoryPage.js';
import { ShoppingPage } from './pages/ShoppingPage.js';
import { NewLaunchPage } from './pages/NewLaunchPage.js';
import { AboutUsPage } from './pages/AboutUsPage.js';
import { StayConnectedPage } from './pages/StayConnectedPage.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { SellerPortalPage } from './pages/SellerPortalPage.js';
import { CartDrawer } from './components/CartDrawer.js';
import { CheckoutModal } from './components/CheckoutModal.js';
import { SearchModal } from './components/SearchModal.js';
import { SizePromptModal } from './components/SizePromptModal.js';
import { CustomerAuthModal } from './components/CustomerAuthModal.js';
import { TrackOrderModal } from './components/TrackOrderModal.js';
import { ProductDetailsModal } from './components/ProductDetailsModal.js';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/seller')) return 'seller';
      if (path === '/admin') return 'admin';
      if (path === '/shop') return 'shop';
      if (path === '/story') return 'story';
      if (path === '/new-launch') return 'new-launch';
      if (path === '/about') return 'about';
      if (path === '/connect') return 'connect';
    }
    return 'home';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/seller')) {
        setCurrentPage('seller');
      } else if (path === '/admin') {
        setCurrentPage('admin');
      } else if (path === '/shop') {
        setCurrentPage('shop');
      } else if (path === '/story') {
        setCurrentPage('story');
      } else if (path === '/new-launch') {
        setCurrentPage('new-launch');
      } else if (path === '/about') {
        setCurrentPage('about');
      } else if (path === '/connect') {
        setCurrentPage('connect');
      } else {
        setCurrentPage('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [updates, setUpdates] = useState<CompanyUpdate[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    brandName: 'ZIPROO',
    tagline: 'CREATE YOUR IDENTITY',
    secondarySlogan: "DON'T FOLLOW THE RULES. CREATE IT.",
    email: 'ziproo2026@gmail.com',
    adminNotificationEmail: 'ziprooclothing@gmail.com',
    instagram: '@_ziproo',
    facebook: 'ZIPROO Official',
    youtube: 'ZIPROO',
    announcementMessages: [
      'ZIPROO — CREATE YOUR IDENTITY',
      "DON'T FOLLOW THE RULES. CREATE IT.",
      'NEW ERA, NEW IDENTITY · EST. 2026',
      'SHOP THE LATEST DROP',
      'ALL-INDIA EXPRESS SHIPPING · ORDERS DISPATCHED IN 24H',
    ],
    currencySymbol: '₹',
    freeShippingThreshold: 1499,
    onlineReceivingPortal: {
      enabled: true,
      upiId: 'ziproo@upi',
      merchantName: 'ZIPROO APPAREL ATELIER',
      instructions: 'Transfer to official UPI ID: ziproo@upi or scan QR code via Google Pay / PhonePe / Paytm. Customers must enter their 12-digit bank UTR reference for instant verification.',
      bankAccountDetails: 'Bank: HDFC Bank | A/C: 50200084920194 | IFSC: HDFC0001234 | Branch: Indiranagar, Bengaluru',
    },
  });
  const [orders, setOrders] = useState<Order[]>([]);

  // Cart state with localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ziproo_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Customer auth state (address, phone, location)
  const [customer, setCustomer] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem('ziproo_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [customerToken, setCustomerToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ziproo_customer_token') || null;
    } catch {
      return null;
    }
  });
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerModalTab, setCustomerModalTab] = useState<'profile' | 'orders'>('profile');

  // Admin auth state
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('ziproo_admin_token') || null;
  });
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('ziproo_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [sizePromptProduct, setSizePromptProduct] = useState<Product | null>(null);
  const [shopInitialSearch, setShopInitialSearch] = useState('');

  const handleCustomerLogout = () => {
    setCustomer(null);
    setCustomerToken(null);
    try {
      localStorage.removeItem('ziproo_customer');
      localStorage.removeItem('ziproo_customer_token');
    } catch {
      // Storage fallback
    }
  };

  // Persist cart
  useEffect(() => {
    localStorage.setItem('ziproo_cart', JSON.stringify(cart));
  }, [cart]);

  // Initial Data Fetching
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const fetchUpdates = async () => {
    try {
      const res = await fetch('/api/updates');
      if (res.ok) {
        const data = await res.json();
        setUpdates(data);
      }
    } catch (err) {
      console.error('Failed to load updates:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const fetchOrders = async (tokenStr: string) => {
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${tokenStr}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchUpdates();
    fetchSettings();
  }, []);

  // Listen to ?product=<id> query parameter to automatically display imported/shared product link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prodParam = params.get('product');
    if (prodParam && products.length > 0) {
      const target = products.find((p) => p.id === prodParam || p.productLink?.includes(prodParam));
      if (target) {
        setSelectedProductModal(target);
        setCurrentPage('shop');
      }
    }
  }, [products]);

  // Validate admin session
  useEffect(() => {
    if (adminToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else {
            throw new Error('Session invalid');
          }
        })
        .then((data) => {
          setAdminUser(data.user);
          localStorage.setItem('ziproo_admin_user', JSON.stringify(data.user));
          fetchOrders(adminToken);
        })
        .catch(() => {
          handleLogout();
        });
    }
  }, [adminToken]);

  // Navigation handler
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      if (page === 'seller') {
        const hasSellerToken = !!localStorage.getItem('ziproo_seller_token');
        const target = hasSellerToken ? '/seller/dashboard' : '/seller/login';
        if (window.location.pathname !== target) {
          window.history.pushState({}, '', target);
        }
      } else if (page === 'home') {
        if (window.location.pathname !== '/') {
          window.history.pushState({}, '', '/');
        }
      } else {
        const target = `/${page}`;
        if (window.location.pathname !== target) {
          window.history.pushState({}, '', target);
        }
      }
    } catch {
      // Ignored
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product, size: string, quantity: number = 1) => {
    setCart((prev) => {
      const index = prev.findIndex(
        (it) => it.product.id === product.id && it.size === size
      );
      if (index > -1) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          quantity: updated[index].quantity + quantity,
        };
        return updated;
      }
      return [...prev, { product, size, quantity }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, size: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((it) => {
          if (it.product.id === productId && it.size === size) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveCartItem = (productId: string, size: string) => {
    setCart((prev) =>
      prev.filter((it) => !(it.product.id === productId && it.size === size))
    );
  };

  // Admin Auth Handlers
  const handleAdminLogin = (token: string, user: AdminUser) => {
    setAdminToken(token);
    setAdminUser(user);
    localStorage.setItem('ziproo_admin_token', token);
    localStorage.setItem('ziproo_admin_user', JSON.stringify(user));
    fetchOrders(token);
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('ziproo_admin_token');
    localStorage.removeItem('ziproo_admin_user');
  };

  // Product Admin Operations
  const handleAddProduct = async (productData: any) => {
    if (!adminToken) return;
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(productData),
    });
    if (res.ok) {
      fetchProducts();
    }
  };

  const handleEditProduct = async (id: string, updates: any) => {
    if (!adminToken) return;
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    if (res.ok) {
      fetchProducts();
    }
  };

  // Update Admin Operations
  const handleAddUpdate = async (updateData: any) => {
    if (!adminToken) return;
    const res = await fetch('/api/updates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(updateData),
    });
    if (res.ok) {
      fetchUpdates();
    }
  };

  const handleEditUpdate = async (id: string, updates: any) => {
    if (!adminToken) return;
    const res = await fetch(`/api/updates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      fetchUpdates();
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/updates/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    if (res.ok) {
      fetchUpdates();
    }
  };

  // Settings Admin Operations
  const handleUpdateSettings = async (newSettings: Partial<StoreSettings>) => {
    if (!adminToken) return;
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(newSettings),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
    }
  };

  // Orders Admin Operations
  const handleUpdateOrderStatus = async (orderId: string, status: Order['orderStatus']) => {
    if (!adminToken) return;
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ orderStatus: status }),
    });
    if (res.ok) {
      fetchOrders(adminToken);
    }
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 flex flex-col font-sans selection:bg-purple-200 selection:text-purple-900">
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        adminUser={adminUser}
        onOpenAdmin={() => handleNavigate('admin')}
        onOpenSellerPortal={() => handleNavigate('seller')}
        onOpenSearch={() => setIsSearchOpen(true)}
        customer={customer}
        onOpenCustomerAuth={() => {
          setCustomerModalTab('profile');
          setIsCustomerModalOpen(true);
        }}
        onOpenCustomerOrders={() => {
          setCustomerModalTab('orders');
          setIsCustomerModalOpen(true);
        }}
        onCustomerLogout={handleCustomerLogout}
        onOpenTrackOrder={() => setIsTrackingModalOpen(true)}
      />

      {/* 2. BLACK COLOR RUNNING SLOGAN BAR (Placed below top navigation / dashboard header) */}
      <MovingSloganBar messages={settings.announcementMessages} />

      {/* 3. ACTIVE MAIN VIEW */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            products={products}
            settings={settings}
            onSelectProduct={(p) => setSelectedProductModal(p)}
          />
        )}

        {currentPage === 'story' && (
          <OurStoryPage
            updates={updates}
            adminUser={adminUser}
            onAddUpdate={handleAddUpdate}
            onEditUpdate={handleEditUpdate}
            onDeleteUpdate={handleDeleteUpdate}
            onNavigateToShop={() => handleNavigate('shop')}
          />
        )}

        {currentPage === 'shop' && (
          <ShoppingPage
            products={products}
            onAddToCart={handleAddToCart}
            initialSearch={shopInitialSearch}
            selectedProductModal={selectedProductModal}
            onOpenProductModal={(p) => setSelectedProductModal(p)}
            onRequestSizePrompt={(p) => setSizePromptProduct(p)}
            onProductUpdated={(updated) => {
              setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            }}
          />
        )}

        {currentPage === 'new-launch' && (
          <NewLaunchPage
            products={products}
            onAddToCart={handleAddToCart}
            onOpenProductModal={(p) => setSelectedProductModal(p)}
            onNavigateToShop={() => handleNavigate('shop')}
            onRequestSizePrompt={(p) => setSizePromptProduct(p)}
          />
        )}

        {currentPage === 'about' && (
          <AboutUsPage onNavigateToShop={() => handleNavigate('shop')} />
        )}

        {currentPage === 'connect' && (
          <StayConnectedPage settings={settings} />
        )}

        {currentPage === 'admin' && (
          <AdminDashboard
            adminUser={adminUser}
            onLogin={handleAdminLogin}
            onLogout={handleLogout}
            products={products}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            updates={updates}
            onAddUpdate={handleAddUpdate}
            onEditUpdate={handleEditUpdate}
            onDeleteUpdate={handleDeleteUpdate}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            token={adminToken}
            onRefreshOrders={() => adminToken && fetchOrders(adminToken)}
          />
        )}

        {currentPage === 'seller' && (
          <SellerPortalPage
            onNavigateHome={() => handleNavigate('home')}
            onNavigateToShop={() => handleNavigate('shop')}
          />
        )}
      </main>

      {/* 4. FOOTER */}
      <Footer
        onNavigate={handleNavigate}
        settings={settings}
        onOpenTrackOrder={() => setIsTrackingModalOpen(true)}
      />

      {/* 5. SHOPPING CART DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        freeShippingThreshold={settings.freeShippingThreshold}
      />

      {/* 6. CHECKOUT MODAL (ALWAYS ASKS FOR FULL CUSTOMER DETAILS) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        settings={settings}
        currentCustomer={customer}
        customerToken={customerToken}
        onOpenCustomerLogin={() => setIsCustomerModalOpen(true)}
        onOrderCompleted={(_order) => {
          setCart([]);
          if (adminToken) {
            fetchOrders(adminToken);
          }
        }}
      />

      {/* 7. INSTANT SEARCH MODAL */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={(p) => {
          setSelectedProductModal(p);
          setIsSearchOpen(false);
        }}
        onNavigateToShopWithQuery={(q) => {
          setShopInitialSearch(q);
          handleNavigate('shop');
        }}
      />

      {/* 8. SIZE PROMPT MODAL (ASKS CUSTOMER FOR SIZE EVERY TIME) */}
      <SizePromptModal
        product={sizePromptProduct}
        isOpen={Boolean(sizePromptProduct)}
        onClose={() => setSizePromptProduct(null)}
        onConfirmAdd={(prod, size, quantity) => {
          handleAddToCart(prod, size, quantity);
        }}
      />

      {/* 9. CUSTOMER SIGN IN, ADDRESS & MY ORDERS MODAL */}
      <CustomerAuthModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        currentCustomer={customer}
        customerToken={customerToken}
        initialTab={customerModalTab}
        onCustomerLogin={(cust, token) => {
          setCustomer(cust);
          if (token) {
            setCustomerToken(token);
            try {
              localStorage.setItem('ziproo_customer_token', token);
            } catch {
              // Storage fallback
            }
          }
          try {
            localStorage.setItem('ziproo_customer', JSON.stringify(cust));
          } catch {
            // Storage fallback
          }
        }}
        onCustomerLogout={handleCustomerLogout}
        onTrackOrder={(orderNum) => {
          setTrackingOrderNumber(orderNum);
          setIsTrackingModalOpen(true);
        }}
        onNavigateToShop={() => handleNavigate('shop')}
      />

      {/* 10. REAL-TIME CUSTOMER ORDER TRACKING MODAL */}
      <TrackOrderModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        initialOrderNumber={trackingOrderNumber}
      />

      {/* 11. COMPLETE PRODUCT DETAILS & IMAGE GALLERY MODAL */}
      <ProductDetailsModal
        product={selectedProductModal}
        isOpen={Boolean(selectedProductModal)}
        onClose={() => setSelectedProductModal(null)}
        onAddToCart={(prod, size, quantity) => {
          handleAddToCart(prod, size, quantity);
        }}
        onBuyNow={(prod, size) => {
          handleAddToCart(prod, size, 1);
          setSelectedProductModal(null);
          setIsCheckoutOpen(true);
        }}
        onProductUpdated={(updated) => {
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }}
      />
    </div>
  );
}
