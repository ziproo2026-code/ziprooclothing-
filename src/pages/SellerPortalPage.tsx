import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  PlusCircle,
  Boxes,
  ShoppingBag,
  User,
  Mail,
  Bell,
  LogOut,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Edit3,
  Trash2,
  Truck,
  DollarSign,
  UploadCloud,
  Image as ImageIcon,
  Layers,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Eye,
  ChevronRight,
  ArrowLeft,
  X,
  Send,
  Building,
  CreditCard,
  Hash,
  Sparkles,
} from 'lucide-react';
import type { Product, Seller, OrderItem, SellerFulfillmentStatus, ProductApprovalStatus } from '../types/index.js';

interface SellerPortalPageProps {
  onNavigateHome: () => void;
  onNavigateToShop: () => void;
}

export const SellerPortalPage: React.FC<SellerPortalPageProps> = ({
  onNavigateHome,
  onNavigateToShop,
}) => {
  // Auth state
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ziproo_seller_token');
    } catch {
      return null;
    }
  });
  const [seller, setSeller] = useState<Seller | null>(() => {
    try {
      const saved = localStorage.getItem('ziproo_seller_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Portal Navigation tabs
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'add-product' | 'my-products' | 'stock' | 'orders' | 'profile' | 'notifications'
  >('dashboard');

  // Auth Form State (Login vs Register)
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('seller@ziproo.com');
  const [loginPassword, setLoginPassword] = useState('seller123');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPinCode, setRegPinCode] = useState('');
  const [regGst, setRegGst] = useState('');
  const [regDescription, setRegDescription] = useState('');

  // Dashboard Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    pendingApproval: 0,
    rejectedProducts: 0,
    totalOrders: 0,
    totalSales: 0,
  });

  // Data collections
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Edit Product Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Status Filter for My Products
  const [productFilterStatus, setProductFilterStatus] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [productSearch, setProductSearch] = useState('');

  // Add Product Form State
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState<'t-shirts' | 'oversized-t-shirts' | 'shirts' | 'pants' | 'hoodies'>('oversized-t-shirts');
  const [pPrice, setPPrice] = useState('1899');
  const [pOriginalPrice, setPOriginalPrice] = useState('2499');
  const [pDescription, setPDescription] = useState('');
  const [pMaterial, setPMaterial] = useState('100% Combed Heavyweight Cotton');
  const [pGsm, setPGsm] = useState('280');
  const [pSizes, setPSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [pColors, setPColors] = useState<string[]>(['Deep Onyx Black', 'Electric Violet']);
  const [pColorInput, setPColorInput] = useState('');
  const [pFeatures, setPFeatures] = useState<string>('Dropped shoulders boxy cut\nPre-shrunk silicone washed\nReinforced rib neckline');
  const [pCare, setPCare] = useState('Cold machine wash inside out. Dry in shade. Do not bleach.');
  const [pTags, setPTags] = useState<string>('Oversized, 280 GSM, Streetwear');
  const [pPiecesAvailable, setPPiecesAvailable] = useState('35');
  const [pInStock, setPInStock] = useState(true);
  const [pGstApplicable, setPGstApplicable] = useState(true);
  const [pGstRate, setPGstRate] = useState('12');
  const [pHsnCode, setPHsnCode] = useState('6109');
  const [pTaxInclusive, setPTaxInclusive] = useState(true);
  const [pImages, setPImages] = useState<string[]>([
    '/src/assets/images/ziproo_product_tee_1790610656044.jpg',
    '/src/assets/images/ziproo_tee_back_1791053935583.jpg',
    '/src/assets/images/ziproo_tee_macro_1791053949356.jpg',
  ]);
  const [primaryImageIdx, setPrimaryImageIdx] = useState(0);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productSubmitSuccess, setProductSubmitSuccess] = useState('');

  // Notifications & Payout Settings
  const [notifEmailEnabled, setNotifEmailEnabled] = useState(true);
  const [bankHolder, setBankHolder] = useState('');
  const [bankAccNumber, setBankAccNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankUpi, setBankUpi] = useState('');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState('');

  // Synchronize browser URL bar to /seller/dashboard or /seller/login
  useEffect(() => {
    try {
      const targetPath = token ? '/seller/dashboard' : '/seller/login';
      if (window.location.pathname !== targetPath) {
        window.history.replaceState({}, '', targetPath);
      }
    } catch {
      // Ignored
    }
  }, [token]);

  // Load seller details on initial token presence
  const fetchSellerData = async (activeToken: string) => {
    setIsLoadingData(true);
    try {
      // 1. Fetch Profile & Stats
      const meRes = await fetch('/api/sellers/auth/me', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        setSeller(meData.seller);
        setStats(meData.stats);
        try {
          localStorage.setItem('ziproo_seller_profile', JSON.stringify(meData.seller));
        } catch {}
        if (meData.seller.bankDetails) {
          setBankHolder(meData.seller.bankDetails.accountHolder || '');
          setBankAccNumber(meData.seller.bankDetails.accountNumber || '');
          setBankIfsc(meData.seller.bankDetails.ifsc || '');
          setBankName(meData.seller.bankDetails.bankName || '');
          setBankUpi(meData.seller.bankDetails.upiId || '');
        }
        setNotifEmailEnabled(meData.seller.emailNotificationsEnabled !== false);
      } else {
        handleLogout();
        return;
      }

      // 2. Fetch Seller Products
      const prodRes = await fetch('/api/seller/products', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (prodRes.ok) {
        const prods = await prodRes.json();
        setSellerProducts(prods);
      }

      // 3. Fetch Seller Orders
      const ordRes = await fetch('/api/seller/orders', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setSellerOrders(ordData.orders || []);
      }
    } catch (err) {
      console.error('Failed to load seller data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSellerData(token);
    }
  }, [token]);

  // Auth: Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/sellers/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setToken(data.token);
      setSeller(data.seller);
      try {
        localStorage.setItem('ziproo_seller_token', data.token);
        localStorage.setItem('ziproo_seller_profile', JSON.stringify(data.seller));
      } catch {}
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/sellers/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          businessName: regBusinessName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          address: regAddress,
          city: regCity,
          state: regState,
          pinCode: regPinCode,
          gstNumber: regGst,
          description: regDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setToken(data.token);
      setSeller(data.seller);
      try {
        localStorage.setItem('ziproo_seller_token', data.token);
        localStorage.setItem('ziproo_seller_profile', JSON.stringify(data.seller));
      } catch {}
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    setToken(null);
    setSeller(null);
    try {
      localStorage.removeItem('ziproo_seller_token');
      localStorage.removeItem('ziproo_seller_profile');
    } catch {}
  };

  // Add Product Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmittingProduct(true);
    setProductSubmitSuccess('');

    try {
      const featuresArray = pFeatures
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);
      const tagsArray = pTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const orderedImages = [...pImages];
      if (primaryImageIdx > 0 && primaryImageIdx < orderedImages.length) {
        const prim = orderedImages.splice(primaryImageIdx, 1)[0];
        orderedImages.unshift(prim);
      }

      const res = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: pName,
          category: pCategory,
          price: Number(pPrice),
          originalPrice: pOriginalPrice ? Number(pOriginalPrice) : undefined,
          description: pDescription,
          material: pMaterial,
          gsm: pGsm,
          sizes: pSizes,
          colors: pColors,
          color: pColors[0] || 'Deep Onyx Black',
          features: featuresArray,
          careInstructions: pCare,
          tags: tagsArray,
          piecesAvailable: Number(pPiecesAvailable) || 0,
          inStock: pInStock,
          gstApplicable: pGstApplicable,
          gstRate: Number(pGstRate),
          hsnCode: pHsnCode,
          taxInclusive: pTaxInclusive,
          images: orderedImages,
          primaryImage: orderedImages[0],
          image: orderedImages[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit product');
      }

      setProductSubmitSuccess(
        `Product "${data.product.name}" created successfully with status "PENDING APPROVAL". It will be reviewed by ZIPROO Atelier administrators.`
      );
      // Reset form
      setPName('');
      setPDescription('');
      fetchSellerData(token);
      setTimeout(() => {
        setActiveTab('my-products');
        setProductSubmitSuccess('');
      }, 2000);
    } catch (err: any) {
      alert(`Error creating product: ${err.message}`);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Toggle Product Stock Status
  const handleToggleStock = async (product: Product) => {
    if (!token) return;
    const nextStock = !product.inStock;
    try {
      const res = await fetch(`/api/seller/products/${product.id}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inStock: nextStock,
          piecesAvailable: nextStock && (product.piecesAvailable || 0) <= 0 ? 25 : product.piecesAvailable,
        }),
      });

      if (res.ok) {
        fetchSellerData(token);
      }
    } catch (err) {
      console.error('Failed to toggle stock:', err);
    }
  };

  // Delete Seller Product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to delete "${productName}" from your seller catalog?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchSellerData(token);
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  // Save Product Quick Edit
  const handleSaveProductEdit = async () => {
    if (!token || !editingProduct) return;
    try {
      const res = await fetch(`/api/seller/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingProduct.name,
          price: Number(editingProduct.price),
          originalPrice: editingProduct.originalPrice ? Number(editingProduct.originalPrice) : undefined,
          description: editingProduct.description,
          inStock: editingProduct.inStock,
          piecesAvailable: Number(editingProduct.piecesAvailable),
          gstRate: Number(editingProduct.gstRate),
          hsnCode: editingProduct.hsnCode,
        }),
      });

      if (res.ok) {
        setEditingProduct(null);
        fetchSellerData(token);
      }
    } catch (err) {
      console.error('Failed to save product edit:', err);
    }
  };

  // Update Order Fulfillment Status
  const handleUpdateFulfillment = async (orderId: string, status: SellerFulfillmentStatus, carrier?: string, trackingNumber?: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/seller/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fulfillmentStatus: status,
          carrier,
          trackingNumber,
        }),
      });

      if (res.ok) {
        fetchSellerData(token);
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev: any) => ({
            ...prev,
            items: prev.items.map((it: any) => ({ ...it, fulfillmentStatus: status, carrier, trackingNumber })),
          }));
        }
      }
    } catch (err) {
      console.error('Failed to update fulfillment:', err);
    }
  };

  // Resend Seller Order Email Notification
  const handleResendEmail = async (orderId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/seller/orders/${orderId}/resend-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(data.message || 'Notification email request dispatched');
    } catch (err) {
      alert('Failed to resend email');
    }
  };

  // Save Seller Profile & Bank details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !seller) return;
    setProfileSaveSuccess('');

    try {
      const res = await fetch('/api/sellers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessName: seller.businessName,
          name: seller.name,
          phone: seller.phone,
          address: seller.address,
          city: seller.city,
          state: seller.state,
          pinCode: seller.pinCode,
          gstNumber: seller.gstNumber,
          description: seller.description,
          emailNotificationsEnabled: notifEmailEnabled,
          bankDetails: {
            accountHolder: bankHolder,
            accountNumber: bankAccNumber,
            ifsc: bankIfsc,
            bankName,
            upiId: bankUpi,
          },
        }),
      });

      if (res.ok) {
        setProfileSaveSuccess('Seller profile and payout bank details saved securely.');
        fetchSellerData(token);
        setTimeout(() => setProfileSaveSuccess(''), 3000);
      }
    } catch (err) {
      alert('Failed to save profile');
    }
  };

  // Add gallery image helper
  const handleAddImage = () => {
    if (!customImageUrl.trim()) return;
    if (pImages.length >= 4) {
      alert('Maximum 4 images allowed per product gallery.');
      return;
    }
    setPImages((prev) => [...prev, customImageUrl.trim()]);
    setCustomImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    if (pImages.length <= 1) {
      alert('A product must have at least 1 image.');
      return;
    }
    setPImages((prev) => prev.filter((_, i) => i !== index));
    if (primaryImageIdx === index) {
      setPrimaryImageIdx(0);
    } else if (primaryImageIdx > index) {
      setPrimaryImageIdx((prev) => prev - 1);
    }
  };

  // Filtered Products
  const displayedProducts = sellerProducts.filter((p) => {
    if (productFilterStatus === 'APPROVED' && p.approvalStatus !== 'APPROVED') return false;
    if (productFilterStatus === 'PENDING' && p.approvalStatus !== 'PENDING_APPROVAL') return false;
    if (productFilterStatus === 'REJECTED' && p.approvalStatus !== 'REJECTED') return false;
    if (productSearch) {
      const s = productSearch.toLowerCase();
      return p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s);
    }
    return true;
  });

  // -------------------------------------------------------------
  // VIEW A: SELLER AUTHENTICATION (LOGIN / REGISTER)
  // -------------------------------------------------------------
  if (!token || !seller) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between selection:bg-purple-900 selection:text-white font-sans">
        {/* Top Minimal Brand Bar */}
        <header className="border-b border-zinc-800 bg-[#0d0d11]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="text-xs font-mono uppercase tracking-[0.25em] text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </button>
            <span className="text-zinc-600">|</span>
            <span className="text-sm font-black tracking-[0.2em] uppercase text-white">
              Z I P R O O <span className="text-purple-400 font-mono text-xs font-normal">SELLER ATELIER</span>
            </span>
          </div>

          <button
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="text-xs font-mono uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors"
          >
            {isRegisterMode ? 'Already registered? Sign In →' : 'New Brand? Apply to Sell →'}
          </button>
        </header>

        {/* Center Auth Card */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-xl bg-[#121217] border border-zinc-800 rounded-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Ambient Purple Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="text-center mb-8">
                <span className="inline-block px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-[11px] font-mono tracking-widest text-purple-300 uppercase mb-3">
                  MULTI-SELLER PLATFORM PORTAL
                </span>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  {isRegisterMode ? 'Register Seller Atelier' : 'Seller Portal Sign In'}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-mono">
                  {isRegisterMode
                    ? 'List your premium streetwear pieces on the national ZIPROO network.'
                    : 'Manage your apparel catalog, inventory, order fulfillments, and payouts.'}
                </p>
              </div>

              {authError && (
                <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/50 text-red-200 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {!isRegisterMode ? (
                // 1. LOGIN FORM
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                      Seller Email Address
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      placeholder="seller@ziproo.com"
                      className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                        Password
                      </label>
                      <span className="text-[11px] font-mono text-zinc-500">Secure Session</span>
                    </div>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Fast Demo Autofill Helper */}
                  <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 text-xs text-zinc-400 space-y-1.5">
                    <div className="font-mono text-[11px] uppercase tracking-wider text-purple-400 flex items-center justify-between">
                      <span>Quick Test Demo Credentials</span>
                      <span className="text-[10px] text-zinc-500">Click to autofill</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail('seller@ziproo.com');
                          setLoginPassword('seller123');
                        }}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-mono transition-colors"
                      >
                        KRONOS Atelier (Active)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginEmail('atelier.seller@ziproo.com');
                          setLoginPassword('seller123');
                        }}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-mono transition-colors"
                      >
                        AURA Lab (Pending)
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider text-xs transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50"
                  >
                    {authLoading ? 'Signing In...' : 'Enter Seller Dashboard →'}
                  </button>
                </form>
              ) : (
                // 2. REGISTER FORM
                <form onSubmit={handleRegister} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                        Brand / Atelier Name *
                      </label>
                      <input
                        type="text"
                        value={regBusinessName}
                        onChange={(e) => setRegBusinessName(e.target.value)}
                        required
                        placeholder="e.g. MONOLITH APPAREL"
                        className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        placeholder="e.g. Vikram Singhania"
                        className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                        Login Email *
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        placeholder="contact@monolith.com"
                        className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        required
                        placeholder="+91 98765 43210"
                        className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      placeholder="Minimum 6 characters"
                      className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        placeholder="Mumbai"
                        className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={regState}
                        onChange={(e) => setRegState(e.target.value)}
                        placeholder="Maharashtra"
                        className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        value={regPinCode}
                        onChange={(e) => setRegPinCode(e.target.value)}
                        placeholder="400013"
                        className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                      Warehouse / Dispatch Address
                    </label>
                    <input
                      type="text"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="Unit 101, Industrial Estate, Lower Parel"
                      className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                        GSTIN Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={regGst}
                        onChange={(e) => setRegGst(e.target.value)}
                        placeholder="27AABCM1234F1Z9"
                        className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                        Brand Aesthetic
                      </label>
                      <input
                        type="text"
                        value={regDescription}
                        onChange={(e) => setRegDescription(e.target.value)}
                        placeholder="e.g. Heavyweight streetwear, boxy cuts"
                        className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider text-xs transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50"
                  >
                    {authLoading ? 'Registering...' : 'Create Seller Account →'}
                  </button>
                </form>
              )}

              <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                >
                  {isRegisterMode ? 'Already have a seller account? Click to sign in' : "Want to sell on ZIPROO? Click here to register"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Minimal Footer */}
        <footer className="border-t border-zinc-800 py-4 px-6 text-center text-xs font-mono text-zinc-600">
          ZIPROO SELLER PORTAL · MULTI-SELLER STREETWEAR ATELIER ECOSYSTEM · EST. 2026
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW B: SELLER DASHBOARD (AUTHENTICATED)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col font-sans selection:bg-purple-900 selection:text-white">
      {/* 1. TOP PORTAL HEADER */}
      <header className="border-b border-zinc-800 bg-[#0d0d12]/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateHome}
            className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
            title="Return to Customer Storefront"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Storefront</span>
          </button>
          <span className="text-zinc-700 hidden sm:inline">|</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black tracking-[0.15em] uppercase text-white">
                {seller.businessName || seller.name}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  seller.status === 'ACTIVE'
                    ? 'bg-emerald-950/70 border border-emerald-700/50 text-emerald-300'
                    : seller.status === 'PENDING'
                    ? 'bg-amber-950/70 border border-amber-700/50 text-amber-300'
                    : 'bg-red-950/70 border border-red-700/50 text-red-300'
                }`}
              >
                {seller.status}
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 block sm:inline">
              Seller ID: <code className="text-purple-300">{seller.id}</code>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToShop()}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-xs font-mono text-zinc-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            <span>Public Catalog</span>
          </button>

          <button
            onClick={() => fetchSellerData(token)}
            className="p-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-red-900/60 bg-zinc-900/80 hover:bg-red-950/30 text-xs font-mono text-zinc-300 hover:text-red-300 transition-colors"
            title="Sign Out of Seller Portal"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* 2. SUB NAVIGATION TABS */}
      <nav className="border-b border-zinc-800/80 bg-[#101015] px-4 sm:px-8 py-2 overflow-x-auto no-scrollbar flex items-center gap-1 sm:gap-2">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'add-product', label: 'Add Product', icon: PlusCircle },
          { id: 'my-products', label: `My Products (${sellerProducts.length})`, icon: Package },
          { id: 'stock', label: 'Product Stock', icon: Boxes },
          { id: 'orders', label: `My Orders (${sellerOrders.length})`, icon: ShoppingBag },
          { id: 'profile', label: 'Seller Profile', icon: User },
          { id: 'notifications', label: 'Email & Alerts', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-zinc-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        {/* ======================================================== */}
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Seller Account Status Alert */}
            {seller.status === 'PENDING' && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold uppercase tracking-wider">Account Pending Administrator Approval</div>
                  <div className="text-zinc-400 text-xs mt-0.5">
                    Your seller profile is under review by ZIPROO leadership. You can already add and configure your products. Once approved, your products will automatically be evaluated for public storefront listing.
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="bg-[#121217] border border-zinc-800 rounded-xl p-4">
                <div className="text-zinc-400 text-[11px] font-mono uppercase tracking-wider">Your Sales</div>
                <div className="text-xl sm:text-2xl font-black text-white mt-1">
                  ₹{stats.totalSales.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Direct to atelier</span>
                </div>
              </div>

              <div className="bg-[#121217] border border-zinc-800 rounded-xl p-4">
                <div className="text-zinc-400 text-[11px] font-mono uppercase tracking-wider">Orders Received</div>
                <div className="text-xl sm:text-2xl font-black text-white mt-1">
                  {stats.totalOrders}
                </div>
                <div className="text-[10px] font-mono text-zinc-500 mt-1">For your items</div>
              </div>

              <div className="bg-[#121217] border border-zinc-800 rounded-xl p-4">
                <div className="text-zinc-400 text-[11px] font-mono uppercase tracking-wider">Total Products</div>
                <div className="text-xl sm:text-2xl font-black text-white mt-1">
                  {stats.totalProducts}
                </div>
                <div className="text-[10px] font-mono text-zinc-500 mt-1">Created by you</div>
              </div>

              <div className="bg-[#121217] border border-zinc-800 rounded-xl p-4">
                <div className="text-zinc-400 text-[11px] font-mono uppercase tracking-wider">Live & Approved</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                  {stats.activeProducts}
                </div>
                <div className="text-[10px] font-mono text-emerald-500/80 mt-1">On Storefront</div>
              </div>

              <div className="bg-[#121217] border border-zinc-800 rounded-xl p-4">
                <div className="text-zinc-400 text-[11px] font-mono uppercase tracking-wider">Pending Approval</div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
                  {stats.pendingApproval}
                </div>
                <div className="text-[10px] font-mono text-amber-500/80 mt-1">Admin review</div>
              </div>

              <div className="bg-[#121217] border border-zinc-800 rounded-xl p-4">
                <div className="text-zinc-400 text-[11px] font-mono uppercase tracking-wider">Rejected</div>
                <div className="text-xl sm:text-2xl font-black text-red-400 mt-1">
                  {stats.rejectedProducts}
                </div>
                <div className="text-[10px] font-mono text-red-500/80 mt-1">Needs fixes</div>
              </div>
            </div>

            {/* Quick Actions & Recent Orders Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions Panel */}
              <div className="bg-[#121217] border border-zinc-800 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('add-product')}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-600/40 text-xs font-mono text-white transition-all text-left group"
                  >
                    <span className="flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-purple-400" />
                      <span>Upload New Streetwear Item</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => setActiveTab('stock')}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-600/40 text-xs font-mono text-white transition-all text-left group"
                  >
                    <span className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-purple-400" />
                      <span>Manage Stock & Inventory</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => setActiveTab('orders')}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-600/40 text-xs font-mono text-white transition-all text-left group"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-purple-400" />
                      <span>Review Customer Orders</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0d0d11] border border-zinc-800/80 text-[11px] font-mono text-zinc-400 space-y-1">
                  <div className="text-white font-bold uppercase tracking-wider">Multi-Seller Rules:</div>
                  <p>• Only products created with your Seller ID are visible to you.</p>
                  <p>• All new apparel additions require Admin Approval before live listing.</p>
                  <p>• Out of stock items automatically prevent customer checkout.</p>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="lg:col-span-2 bg-[#121217] border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                    Recent Customer Orders ({sellerOrders.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                  >
                    View All →
                  </button>
                </div>

                {sellerOrders.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                    No orders received for your products yet. Once a customer purchases your items, you will see them here and receive an automated email notice.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 uppercase">
                          <th className="py-2.5 px-3">Order ID</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Your Items</th>
                          <th className="py-2.5 px-3">Your Subtotal</th>
                          <th className="py-2.5 px-3">Fulfillment</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {sellerOrders.slice(0, 5).map((ord) => (
                          <tr key={ord.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3 px-3 font-bold text-white">#{ord.orderNumber}</td>
                            <td className="py-3 px-3 text-zinc-400">
                              {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </td>
                            <td className="py-3 px-3 text-zinc-300">
                              {ord.items.map((it: any) => `${it.productName} (${it.size}) x${it.quantity}`).join(', ')}
                            </td>
                            <td className="py-3 px-3 font-bold text-purple-400">
                              ₹{ord.sellerSubtotal.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-zinc-800 text-zinc-300">
                                {ord.items[0]?.fulfillmentStatus || ord.orderStatus}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => setSelectedOrder(ord)}
                                className="text-purple-400 hover:text-purple-300 underline font-semibold text-xs"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ADD PRODUCT (PART 4) */}
        {/* ======================================================== */}
        {activeTab === 'add-product' && (
          <div className="max-w-4xl mx-auto bg-[#121217] border border-zinc-800 rounded-xl p-6 sm:p-8">
            <div className="mb-6 pb-4 border-b border-zinc-800">
              <span className="text-[11px] font-mono tracking-widest text-purple-400 uppercase">
                PART 4 · SELLER APPAREL UPLOAD
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white mt-1">
                Add Streetwear Product
              </h2>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Products will be associated automatically with your seller ID (<code className="text-purple-300">{seller.id}</code>) and placed in status <strong className="text-amber-400">PENDING APPROVAL</strong> until reviewed by ZIPROO.
              </p>
            </div>

            {productSubmitSuccess && (
              <div className="mb-6 p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 text-xs sm:text-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>{productSubmitSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-6">
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    required
                    placeholder="e.g. CYBER KANJI OVERSIZED TEE"
                    className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value as any)}
                    className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none font-mono"
                  >
                    <option value="oversized-t-shirts">Oversized T-Shirts</option>
                    <option value="t-shirts">Regular T-Shirts</option>
                    <option value="hoodies">Heavyweight Hoodies</option>
                    <option value="pants">Utilitarian Pants / Cargoes</option>
                    <option value="shirts">Streetwear Shirts</option>
                  </select>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    required
                    min="1"
                    placeholder="1899"
                    className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Original Price / MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={pOriginalPrice}
                    onChange={(e) => setPOriginalPrice(e.target.value)}
                    placeholder="2499"
                    className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Inventory Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={pPiecesAvailable}
                    onChange={(e) => {
                      setPPiecesAvailable(e.target.value);
                      if (Number(e.target.value) <= 0) setPInStock(false);
                      else setPInStock(true);
                    }}
                    required
                    min="0"
                    placeholder="50"
                    className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Stock Status Switch */}
              <div className="flex items-center gap-3 p-3.5 bg-zinc-900 rounded-lg border border-zinc-800">
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={pInStock}
                  onChange={(e) => setPInStock(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
                <label htmlFor="inStockCheck" className="text-xs font-mono cursor-pointer select-none text-zinc-300">
                  Mark as <strong className={pInStock ? 'text-emerald-400' : 'text-red-400'}>{pInStock ? 'IN STOCK' : 'OUT OF STOCK'}</strong> (Out of stock items will show on the storefront with Add to Cart disabled)
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Product Description & Manifesto
                </label>
                <textarea
                  rows={3}
                  value={pDescription}
                  onChange={(e) => setPDescription(e.target.value)}
                  placeholder="Describe the silhouette, aesthetic inspiration, and streetwear styling recommendations..."
                  className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none"
                />
              </div>

              {/* Material & GSM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Material / Fabric Composition
                  </label>
                  <input
                    type="text"
                    value={pMaterial}
                    onChange={(e) => setPMaterial(e.target.value)}
                    placeholder="e.g. 100% Combed Heavyweight Cotton"
                    className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Fabric GSM (Grams per Square Metre)
                  </label>
                  <input
                    type="text"
                    value={pGsm}
                    onChange={(e) => setPGsm(e.target.value)}
                    placeholder="e.g. 280 or 480"
                    className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Sizes Available */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((s) => {
                    const isSelected = pSizes.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => {
                          if (isSelected) {
                            if (pSizes.length > 1) {
                              setPSizes(pSizes.filter((sz) => sz !== s));
                            }
                          } else {
                            setPSizes([...pSizes, s]);
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white border border-purple-400'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors Available */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Available Colorways
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {pColors.map((col, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200"
                    >
                      <span>{col}</span>
                      {pColors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPColors(pColors.filter((_, i) => i !== idx))}
                          className="text-zinc-500 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pColorInput}
                    onChange={(e) => setPColorInput(e.target.value)}
                    placeholder="Add colorway (e.g. Vintage Wash Violet)"
                    className="bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (pColorInput.trim()) {
                        setPColors([...pColors, pColorInput.trim()]);
                        setPColorInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200"
                  >
                    Add Color
                  </button>
                </div>
              </div>

              {/* 3-4 PRODUCT IMAGES GALLERY (REQUIREMENT PART 4) */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                      Product Image Gallery (3–4 Images)
                    </label>
                    <span className="text-[11px] font-mono text-zinc-400">
                      High resolution streetwear images. Select the star to mark as Primary Image.
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">{pImages.length} of 4 images</span>
                </div>

                {/* Image Previews Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {pImages.map((imgUrl, idx) => {
                    const isPrimary = primaryImageIdx === idx;
                    return (
                      <div
                        key={idx}
                        className={`relative group rounded-lg overflow-hidden border-2 aspect-square bg-black ${
                          isPrimary ? 'border-purple-500 shadow-md shadow-purple-900/40' : 'border-zinc-700'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Product view ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src = '/src/assets/images/ziproo_product_tee_1790610656044.jpg';
                          }}
                        />

                        {/* Primary Badge */}
                        {isPrimary && (
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-purple-600 text-white font-mono text-[9px] font-bold uppercase shadow">
                            PRIMARY
                          </span>
                        )}

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1 rounded bg-red-600 hover:bg-red-500 text-white"
                              title="Delete Image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryImageIdx(idx)}
                              className="w-full py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-mono uppercase font-bold"
                            >
                              Set As Primary
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Image by URL / Preset */}
                {pImages.length < 4 && (
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="Paste Image URL (/src/assets/images/... or https://...)"
                      className="bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none flex-1 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-white transition-colors"
                    >
                      Add Image
                    </button>
                  </div>
                )}
              </div>

              {/* GST & HSN Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    GST Rate
                  </label>
                  <select
                    value={pGstRate}
                    onChange={(e) => setPGstRate(e.target.value)}
                    className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-xs font-mono"
                  >
                    <option value="5">5% GST (Apparel &lt; ₹1,000)</option>
                    <option value="12">12% GST (Apparel &gt;= ₹1,000)</option>
                    <option value="18">18% GST (Accessories & Spec)</option>
                    <option value="0">0% Exempt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    HSN / SAC Code
                  </label>
                  <input
                    type="text"
                    value={pHsnCode}
                    onChange={(e) => setPHsnCode(e.target.value)}
                    placeholder="6109"
                    className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="taxInclusiveCheck"
                    checked={pTaxInclusive}
                    onChange={(e) => setPTaxInclusive(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                  <label htmlFor="taxInclusiveCheck" className="text-xs font-mono text-zinc-300 cursor-pointer select-none">
                    Price is GST-inclusive (Recommended)
                  </label>
                </div>
              </div>

              {/* Features & Care */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Key Garment Features (One per line)
                  </label>
                  <textarea
                    rows={3}
                    value={pFeatures}
                    onChange={(e) => setPFeatures(e.target.value)}
                    className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Care Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={pCare}
                    onChange={(e) => setPCare(e.target.value)}
                    className="w-full bg-[#18181f] border border-zinc-700 focus:border-purple-500 rounded-lg px-3 py-2 text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 px-8 rounded-lg uppercase tracking-wider text-xs transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50"
                >
                  {isSubmittingProduct ? 'Submitting Apparel...' : 'Submit Product for Approval →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: MY PRODUCTS (PART 5) */}
        {/* ======================================================== */}
        {activeTab === 'my-products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono tracking-widest text-purple-400 uppercase">
                  PART 5 · MY PRODUCTS
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
                  Your Apparel Catalog ({sellerProducts.length})
                </h2>
              </div>

              <button
                onClick={() => setActiveTab('add-product')}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1.5 shadow"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search your products by name or category..."
                  className="w-full bg-[#121217] border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#121217] p-1 rounded-lg border border-zinc-800 w-full sm:w-auto">
                {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setProductFilterStatus(st)}
                    className={`px-3 py-1.5 rounded text-[11px] font-mono uppercase transition-colors ${
                      productFilterStatus === st
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {displayedProducts.length === 0 ? (
              <div className="py-16 text-center border border-zinc-800/80 rounded-xl bg-[#121217] p-8">
                <Package className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <div className="text-zinc-300 font-bold uppercase tracking-wider text-sm">No products found</div>
                <div className="text-zinc-500 font-mono text-xs mt-1">
                  {sellerProducts.length === 0
                    ? "You haven't uploaded any products yet. Click 'Add Product' to get started."
                    : 'No products match the selected status filter.'}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedProducts.map((prod) => {
                  const isApproved = prod.approvalStatus === 'APPROVED';
                  const isPending = prod.approvalStatus === 'PENDING_APPROVAL';
                  const isRejected = prod.approvalStatus === 'REJECTED';

                  return (
                    <div
                      key={prod.id}
                      className="bg-[#121217] border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition-colors"
                    >
                      <div className="relative aspect-video bg-black overflow-hidden">
                        <img
                          src={prod.image || prod.images?.[0] || '/assets/placeholder.jpg'}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src = '/src/assets/images/ziproo_product_tee_1790610656044.jpg';
                          }}
                        />

                        {/* Approval Status Badge */}
                        <div className="absolute top-2 left-2">
                          {isApproved && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 backdrop-blur-md">
                              APPROVED · LIVE
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-950/80 border border-amber-500/60 text-amber-300 backdrop-blur-md">
                              PENDING APPROVAL
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-red-950/80 border border-red-500/60 text-red-300 backdrop-blur-md">
                              REJECTED
                            </span>
                          )}
                        </div>

                        {/* Stock status indicator */}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              prod.inStock
                                ? 'bg-black/70 text-zinc-200 border border-zinc-700'
                                : 'bg-red-950/90 text-red-300 border border-red-800'
                            }`}
                          >
                            {prod.inStock ? `${prod.piecesAvailable ?? prod.stockCount ?? 0} In Stock` : 'OUT OF STOCK'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">
                            {prod.category} {prod.gsm ? `· ${prod.gsm} GSM` : ''}
                          </div>
                          <h3 className="font-bold text-white text-sm uppercase tracking-tight mt-0.5">
                            {prod.name}
                          </h3>

                          <div className="mt-2 flex items-baseline gap-2 font-mono">
                            <span className="text-base font-black text-white">
                              ₹{prod.price.toLocaleString('en-IN')}
                            </span>
                            {prod.originalPrice && (
                              <span className="text-xs text-zinc-500 line-through">
                                ₹{prod.originalPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>

                          {isRejected && prod.rejectionReason && (
                            <div className="mt-2 p-2 rounded bg-red-950/30 border border-red-900/50 text-[11px] font-mono text-red-300">
                              Rejection Note: {prod.rejectionReason}
                            </div>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleToggleStock(prod)}
                            className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-colors ${
                              prod.inStock
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                                : 'bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-800 text-emerald-300'
                            }`}
                          >
                            {prod.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingProduct(prod)}
                              className="p-1.5 rounded border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                              title="Edit Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-1.5 rounded border border-zinc-800 hover:bg-red-950/40 text-zinc-400 hover:text-red-400"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: PRODUCT STOCK (BULK INVENTORY) */}
        {/* ======================================================== */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-mono tracking-widest text-purple-400 uppercase">
                PART 5 · PRODUCT STOCK & INVENTORY
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
                Live Inventory Management
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Quickly adjust stock quantities or mark products IN STOCK / OUT OF STOCK. Out-of-stock items remain in the catalog with Add to Cart disabled.
              </p>
            </div>

            <div className="bg-[#121217] border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase bg-[#0f0f14]">
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Approval Status</th>
                    <th className="py-3 px-4">Pieces Available</th>
                    <th className="py-3 px-4">Stock State</th>
                    <th className="py-3 px-4 text-right">Quick Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {sellerProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image || prod.images?.[0] || '/assets/placeholder.jpg'}
                            alt={prod.name}
                            className="w-10 h-10 rounded object-cover border border-zinc-800 bg-black flex-shrink-0"
                            onError={(e) => {
                              (e.target as any).src = '/src/assets/images/ziproo_product_tee_1790610656044.jpg';
                            }}
                          />
                          <div>
                            <div className="font-bold text-white uppercase">{prod.name}</div>
                            <div className="text-zinc-500 text-[10px]">{prod.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">₹{prod.price.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            prod.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-950/70 text-emerald-300'
                              : prod.approvalStatus === 'PENDING_APPROVAL'
                              ? 'bg-amber-950/70 text-amber-300'
                              : 'bg-red-950/70 text-red-300'
                          }`}
                        >
                          {prod.approvalStatus || 'APPROVED'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${((prod.piecesAvailable ?? 0) < 10) ? 'text-amber-400' : 'text-zinc-300'}`}>
                          {prod.piecesAvailable ?? prod.stockCount ?? 0} units
                        </span>
                        {((prod.piecesAvailable ?? 0) < 10 && (prod.piecesAvailable ?? 0) > 0) && (
                          <span className="block text-[9px] text-amber-500 uppercase tracking-wider font-bold">LOW STOCK</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                            prod.inStock
                              ? 'bg-emerald-950/60 border border-emerald-700/50 text-emerald-300'
                              : 'bg-red-950/60 border border-red-700/50 text-red-300'
                          }`}
                        >
                          {prod.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStock(prod)}
                          className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-colors ${
                            prod.inStock
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {prod.inStock ? 'Set Sold Out' : 'Set In Stock'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: MY ORDERS (PART 6) */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-mono tracking-widest text-purple-400 uppercase">
                PART 6 · SELLER ORDERS
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
                Orders Containing Your Products ({sellerOrders.length})
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Multi-Seller Isolation: You see only items, values, and customer fulfillment data pertaining to your products.
              </p>
            </div>

            {sellerOrders.length === 0 ? (
              <div className="py-16 text-center border border-zinc-800/80 rounded-xl bg-[#121217] p-8 font-mono">
                <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <div className="text-zinc-300 font-bold uppercase tracking-wider text-sm">No Orders Yet</div>
                <div className="text-zinc-500 text-xs mt-1">
                  When a customer purchases your apparel, fulfillment information will appear here automatically.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {sellerOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-[#121217] border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors space-y-4"
                  >
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white uppercase">
                            Order #{ord.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                              ord.paymentStatus === 'Paid'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            Payment: {ord.paymentStatus} ({ord.paymentMethod?.toUpperCase()})
                          </span>
                        </div>
                        <div className="text-xs font-mono text-zinc-500 mt-0.5">
                          Placed on: {new Date(ord.createdAt).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResendEmail(ord.id)}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1"
                          title="Resend email notice for this order"
                        >
                          <Send className="w-3 h-3 text-purple-400" />
                          <span>Resend Email</span>
                        </button>
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold uppercase"
                        >
                          View Details & Shipping
                        </button>
                      </div>
                    </div>

                    {/* Order Items belonging to THIS seller only */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-bold">
                          Your Items in This Order:
                        </div>
                        {ord.items.map((it: OrderItem, iIdx: number) => (
                          <div
                            key={iIdx}
                            className="flex items-center justify-between p-2.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono"
                          >
                            <div className="flex items-center gap-2.5">
                              {it.image && (
                                <img
                                  src={it.image}
                                  alt={it.productName}
                                  className="w-9 h-9 rounded object-cover border border-zinc-700 bg-black flex-shrink-0"
                                />
                              )}
                              <div>
                                <div className="font-bold text-white uppercase">{it.productName}</div>
                                <div className="text-zinc-400 text-[11px]">
                                  Size: <strong className="text-zinc-200">{it.size}</strong> · Qty: {it.quantity}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-purple-400">
                                ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                ₹{it.price} each
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="text-right text-xs font-mono font-bold text-white pt-1">
                          Total for Your Items: <span className="text-purple-400 text-sm">₹{ord.sellerSubtotal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Customer Delivery Info for Shipping */}
                      <div className="bg-zinc-900/70 p-3.5 rounded-lg border border-zinc-800 space-y-2 text-xs font-mono">
                        <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-purple-400" />
                          <span>Delivery Destination (For Packaging):</span>
                        </div>
                        <div className="text-white font-bold">{ord.customerName}</div>
                        <div className="text-zinc-400 text-[11px] leading-relaxed">
                          {ord.completeAddress}<br />
                          {ord.city}, {ord.state} - {ord.pinCode}<br />
                          Contact: <strong className="text-zinc-200">{ord.mobileNumber}</strong>
                        </div>

                        {/* Quick Fulfillment Status Dropdown */}
                        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-zinc-400">Fulfillment Status:</span>
                          <select
                            value={ord.items[0]?.fulfillmentStatus || 'PENDING'}
                            onChange={(e) =>
                              handleUpdateFulfillment(ord.id, e.target.value as SellerFulfillmentStatus)
                            }
                            className="bg-[#18181f] border border-zinc-700 text-white rounded px-2.5 py-1 text-xs font-mono font-bold"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="PROCESSING">PROCESSING</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: SELLER PROFILE */}
        {/* ======================================================== */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto bg-[#121217] border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-[11px] font-mono tracking-widest text-purple-400 uppercase">
                PART 2 · SELLER PROFILE
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
                Seller Profile & Payout Settings
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Update your atelier identity, warehouse dispatch location, and bank account for automated sales disbursements.
              </p>
            </div>

            {profileSaveSuccess && (
              <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{profileSaveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Atelier / Store Name
                  </label>
                  <input
                    type="text"
                    value={seller.businessName}
                    onChange={(e) => setSeller({ ...seller, businessName: e.target.value })}
                    required
                    className="w-full bg-[#18181f] border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Primary Contact Person
                  </label>
                  <input
                    type="text"
                    value={seller.name}
                    onChange={(e) => setSeller({ ...seller, name: e.target.value })}
                    required
                    className="w-full bg-[#18181f] border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={seller.email}
                    disabled
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-zinc-400 text-sm cursor-not-allowed font-mono"
                  />
                  <span className="text-[10px] font-mono text-zinc-600">Contact admin to change login email</span>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={seller.phone}
                    onChange={(e) => setSeller({ ...seller, phone: e.target.value })}
                    required
                    className="w-full bg-[#18181f] border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Warehouse Dispatch Location */}
              <div className="space-y-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                  Warehouse & Fulfillment Location
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Address</label>
                  <input
                    type="text"
                    value={seller.address || ''}
                    onChange={(e) => setSeller({ ...seller, address: e.target.value })}
                    placeholder="Unit / Building / Street"
                    className="w-full bg-[#18181f] border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">City</label>
                    <input
                      type="text"
                      value={seller.city || ''}
                      onChange={(e) => setSeller({ ...seller, city: e.target.value })}
                      className="w-full bg-[#18181f] border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">State</label>
                    <input
                      type="text"
                      value={seller.state || ''}
                      onChange={(e) => setSeller({ ...seller, state: e.target.value })}
                      className="w-full bg-[#18181f] border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={seller.pinCode || ''}
                      onChange={(e) => setSeller({ ...seller, pinCode: e.target.value })}
                      className="w-full bg-[#18181f] border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Payout Bank Details */}
              <div className="space-y-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <span>Bank & UPI Details for Sales Payouts</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                      placeholder="e.g. KRONOS Streetwear Co."
                      className="w-full bg-[#18181f] border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className="w-full bg-[#18181f] border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={bankAccNumber}
                      onChange={(e) => setBankAccNumber(e.target.value)}
                      placeholder="918237492819"
                      className="w-full bg-[#18181f] border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value)}
                      placeholder="HDFC0000123"
                      className="w-full bg-[#18181f] border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">UPI ID (Optional for Instant Payouts)</label>
                  <input
                    type="text"
                    value={bankUpi}
                    onChange={(e) => setBankUpi(e.target.value)}
                    placeholder="kronos@upi"
                    className="w-full bg-[#18181f] border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-lg uppercase tracking-wider text-xs transition-all shadow-md"
                >
                  Save Profile & Payout Details
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: NOTIFICATIONS & EMAIL SETTINGS (PART 7) */}
        {/* ======================================================== */}
        {activeTab === 'notifications' && (
          <div className="max-w-3xl mx-auto bg-[#121217] border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-[11px] font-mono tracking-widest text-purple-400 uppercase">
                PART 7 · SELLER ORDER EMAIL NOTIFICATIONS
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
                Email & Alert Preferences
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Every time a customer places an order containing your products, the ZIPROO server automatically triggers a dedicated notification email to your registered email address (<strong className="text-purple-300">{seller.email}</strong>).
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Order Notification Emails
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Receive immediate email alerts when your garments are purchased.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifEmailEnabled}
                    onChange={(e) => setNotifEmailEnabled(e.target.checked)}
                    className="w-5 h-5 accent-purple-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0f0f14] border border-zinc-800/80 space-y-2 text-xs font-mono text-zinc-400">
                <div className="text-purple-400 font-bold uppercase tracking-wider text-[11px]">
                  ZIPROO Seller Email Specifications (Server-Authoritative):
                </div>
                <p>• Subject: <code className="text-zinc-200">New ZIPROO Order – Order #[ORDER_ID]</code></p>
                <p>• Contains only your items (names, quantities, prices) and fulfillment destination.</p>
                <p>• Does NOT disclose other sellers' items if part of a multi-brand cart.</p>
                <p>• If email dispatch fails, order remains saved securely on the server with full retry controls.</p>
              </div>

              <button
                onClick={handleSaveProfile}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-6 rounded-lg uppercase tracking-wider text-xs transition-all shadow"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: ORDER DETAILS & SHIPPING SLIP MODAL */}
      {/* ======================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-zinc-800 rounded-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">
                  SELLER FULFILLMENT SLIP
                </span>
                <h3 className="text-lg font-black uppercase text-white">
                  Order #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery address */}
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono space-y-1">
              <div className="text-purple-400 font-bold uppercase text-[11px] mb-1">
                Fulfillment Address
              </div>
              <div className="text-white font-bold">{selectedOrder.customerName}</div>
              <div className="text-zinc-300">
                {selectedOrder.completeAddress}<br />
                {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pinCode}
              </div>
              <div className="text-zinc-400 pt-1">
                Customer Phone: <strong className="text-white">{selectedOrder.mobileNumber}</strong>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Your Products ({selectedOrder.items?.length})
              </div>
              <div className="space-y-2">
                {selectedOrder.items?.map((it: OrderItem, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-white uppercase">{it.productName}</div>
                      <div className="text-zinc-400 text-[11px]">
                        Size: <strong className="text-zinc-200">{it.size}</strong> · Quantity: {it.quantity}
                      </div>
                    </div>
                    <div className="text-right font-bold text-purple-400">
                      ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right text-xs font-mono text-zinc-300 pt-1">
                Subtotal Payable to You: <strong className="text-white text-sm">₹{selectedOrder.sellerSubtotal?.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Status Update Form */}
            <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                Update Shipping & Tracking Information
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Courier Carrier</label>
                  <input
                    type="text"
                    defaultValue={selectedOrder.trackingInfo?.carrier || 'Delhivery Express'}
                    id="modalCarrierInput"
                    placeholder="e.g. BlueDart / Delhivery"
                    className="w-full bg-[#18181f] border border-zinc-700 rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Tracking Number / AWB</label>
                  <input
                    type="text"
                    defaultValue={selectedOrder.trackingInfo?.trackingNumber || ''}
                    id="modalTrackingInput"
                    placeholder="e.g. 19284918239"
                    className="w-full bg-[#18181f] border border-zinc-700 rounded px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-mono text-zinc-400">Status:</span>
                <select
                  id="modalStatusSelect"
                  defaultValue={selectedOrder.items?.[0]?.fulfillmentStatus || 'PENDING'}
                  className="bg-[#18181f] border border-zinc-700 text-white rounded px-3 py-1.5 text-xs font-mono font-bold"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  const st = (document.getElementById('modalStatusSelect') as HTMLSelectElement)?.value as SellerFulfillmentStatus;
                  const cr = (document.getElementById('modalCarrierInput') as HTMLInputElement)?.value;
                  const tr = (document.getElementById('modalTrackingInput') as HTMLInputElement)?.value;
                  handleUpdateFulfillment(selectedOrder.id, st, cr, tr);
                  alert('Order tracking and fulfillment status updated successfully.');
                }}
                className="w-full mt-2 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase transition-colors"
              >
                Save Shipping Details & Notify System
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: QUICK EDIT PRODUCT MODAL */}
      {/* ======================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-zinc-800 rounded-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">
                  EDIT PRODUCT
                </span>
                <h3 className="text-base font-black uppercase text-white">
                  {editingProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 mb-1">Product Title</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-[#18181f] border border-zinc-700 rounded px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-[#18181f] border border-zinc-700 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Stock Count</label>
                  <input
                    type="number"
                    value={editingProduct.piecesAvailable ?? editingProduct.stockCount ?? 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        piecesAvailable: Number(e.target.value),
                        stockCount: Number(e.target.value),
                        inStock: Number(e.target.value) > 0,
                      })
                    }
                    className="w-full bg-[#18181f] border border-zinc-700 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Stock Availability</label>
                <select
                  value={editingProduct.inStock ? 'true' : 'false'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.value === 'true' })}
                  className="w-full bg-[#18181f] border border-zinc-700 rounded px-3 py-2 text-white font-mono"
                >
                  <option value="true">IN STOCK</option>
                  <option value="false">OUT OF STOCK</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-[#18181f] border border-zinc-700 rounded px-3 py-2 text-white font-sans text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded bg-zinc-800 text-zinc-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProductEdit}
                  className="px-5 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold uppercase"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
