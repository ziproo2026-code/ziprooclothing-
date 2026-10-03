import React, { useState } from 'react';
import type { Product, CompanyUpdate, StoreSettings, Order, AdminUser, OnlineReceivingPortal } from '../types/index.js';
import { AdminCustomersTab } from '../components/admin/AdminCustomersTab.js';
import { AdminMessagesTab } from '../components/admin/AdminMessagesTab.js';
import { AdminTeamTab } from '../components/admin/AdminTeamTab.js';
import { AdminOrdersManager } from '../components/admin/AdminOrdersManager.js';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Package,
  FileText,
  Settings as SettingsIcon,
  ShoppingBag,
  KeyRound,
  LogOut,
  Upload,
  Check,
  AlertCircle,
  X,
  QrCode,
  CheckCircle2,
  Mail,
  Smartphone,
  CreditCard,
  Building,
  Lock,
  Users,
  MessageSquare,
  Shield,
  Link,
  Copy,
  ExternalLink,
  Video,
  Image as ImageIcon,
  Search,
  Globe,
  Receipt,
} from 'lucide-react';

interface AdminDashboardProps {
  adminUser: AdminUser | null;
  onLogin: (token: string, user: AdminUser) => void;
  onLogout: () => void;
  products: Product[];
  onAddProduct: (product: any) => Promise<void>;
  onEditProduct: (id: string, updates: any) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  updates: CompanyUpdate[];
  onAddUpdate: (update: any) => Promise<void>;
  onEditUpdate: (id: string, updates: any) => Promise<void>;
  onDeleteUpdate: (id: string) => Promise<void>;
  settings: StoreSettings;
  onUpdateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['orderStatus']) => Promise<void>;
  token: string | null;
  onRefreshOrders?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onLogin,
  onLogout,
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  updates,
  onAddUpdate,
  onEditUpdate,
  onDeleteUpdate,
  settings,
  onUpdateSettings,
  orders,
  onUpdateOrderStatus,
  token,
  onRefreshOrders,
}) => {
  // Login form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'products' | 'updates' | 'orders' | 'customers' | 'messages' | 'team' | 'portal' | 'settings' | 'security'>('products');

  // Product modal & form state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<Product['category']>('oversized-t-shirts');
  const [prodPrice, setProdPrice] = useState<number | string>('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState<number | string>('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodFabric, setProdFabric] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodIsNewLaunch, setProdIsNewLaunch] = useState(false);
  const [prodInStock, setProdInStock] = useState(true);
  const [prodSizes, setProdSizes] = useState<string[]>(['S', 'M', 'L', 'XL', 'XXL']);
  const [prodShippingCharge, setProdShippingCharge] = useState<number | string>(0);
  const [prodPiecesAvailable, setProdPiecesAvailable] = useState<number | string>(150);
  const [prodProductLink, setProdProductLink] = useState('');
  
  // GST Tax & HSN Portal state
  const [prodGstRate, setProdGstRate] = useState<number>(12);
  const [prodHsnCode, setProdHsnCode] = useState<string>('6109');
  const [prodTaxInclusive, setProdTaxInclusive] = useState<boolean>(true);

  const getDefaultHsnForCategory = (cat: Product['category']) => {
    switch (cat) {
      case 'hoodies':
        return '6110';
      case 'pants':
        return '6203';
      case 'shirts':
        return '6205';
      case 't-shirts':
      case 'oversized-t-shirts':
      default:
        return '6109';
    }
  };

  const [copiedLinkProdId, setCopiedLinkProdId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Update modal & form state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [updTitle, setUpdTitle] = useState('');
  const [updContent, setUpdContent] = useState('');
  const [updCategory, setUpdCategory] = useState<CompanyUpdate['category']>('Announcement');
  const [updDate, setUpdDate] = useState(new Date().toISOString().split('T')[0]);
  const [updImageUrl, setUpdImageUrl] = useState('');
  const [updVideoUrl, setUpdVideoUrl] = useState('');

  // Settings form state
  const [editBrandName, setEditBrandName] = useState(settings.brandName || 'ZIPROO FASHION');
  const [editDomain, setEditDomain] = useState(settings.domain || 'ziproofashion.com');
  const [editTagline, setEditTagline] = useState(settings.tagline);
  const [editSlogan, setEditSlogan] = useState(settings.secondarySlogan);
  const [editEmail, setEditEmail] = useState(settings.email);
  const [editAdminEmail, setEditAdminEmail] = useState(settings.adminNotificationEmail || 'ziprooclothing@gmail.com');
  const [editInstagram, setEditInstagram] = useState(settings.instagram);
  const [editFacebook, setEditFacebook] = useState(settings.facebook);
  const [editYoutube, setEditYoutube] = useState(settings.youtube || 'ZIPROO');
  const [editAnnouncements, setEditAnnouncements] = useState(settings.announcementMessages.join('\n'));
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Online Amount Receiving Portal state
  const [portalEnabled, setPortalEnabled] = useState(settings.onlineReceivingPortal?.enabled ?? true);
  const [portalUpiId, setPortalUpiId] = useState(settings.onlineReceivingPortal?.upiId || 'ziproo@upi');
  const [portalMerchantName, setPortalMerchantName] = useState(settings.onlineReceivingPortal?.merchantName || 'ZIPROO APPAREL ATELIER');
  const [portalInstructions, setPortalInstructions] = useState(
    settings.onlineReceivingPortal?.instructions ||
      'Transfer to official UPI ID: ziproo@upi or scan the verified QR code. Customers must enter their 12-digit bank UTR reference for instant verification.'
  );
  const [portalBankDetails, setPortalBankDetails] = useState(
    settings.onlineReceivingPortal?.bankAccountDetails ||
      'Bank: HDFC Bank | A/C: 50200084920194 | IFSC: HDFC0001234 | Branch: Indiranagar, Bengaluru'
  );
  const [isSavingPortal, setIsSavingPortal] = useState(false);

  // Online Receiving Payment Portal & All Payments Ledger State
  const [portalFilter, setPortalFilter] = useState<'all' | 'online_portal' | 'razorpay' | 'cod' | 'paid' | 'pending'>('all');
  const [portalSearch, setPortalSearch] = useState('');
  const [selectedOrderForParticulars, setSelectedOrderForParticulars] = useState<Order | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Security password change form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onLogin(data.token, data.user);
      setPasswordInput('');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid administrator credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Image file upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            dataUrl: base64Data,
            fileName: file.name,
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setProdImage(data.url);
          showSuccess('Image uploaded successfully');
        } else {
          alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error(err);
        alert('Image upload failed');
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Daily update media upload handler (Image or Video)
  const handleUpdateMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch('/api/upload-media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            dataUrl: base64Data,
            filename: file.name,
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          if (type === 'image') {
            setUpdImageUrl(data.url);
            showSuccess('Update image uploaded successfully!');
          } else {
            setUpdVideoUrl(data.url);
            showSuccess('Update video uploaded successfully!');
          }
        } else {
          alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error(err);
        alert('Media upload failed');
      } finally {
        setIsUploadingMedia(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Open Product Modal (New or Edit)
  const openProductForm = (product?: Product) => {
    if (product) {
      setEditingProductId(product.id);
      setProdName(product.name);
      setProdCategory(product.category);
      setProdPrice(product.price);
      setProdOriginalPrice(product.originalPrice || '');
      setProdDescription(product.description);
      setProdFabric(product.fabricDetails || '');
      setProdImage(product.image);
      setProdIsNewLaunch(product.isNewLaunch);
      setProdInStock(product.inStock);
      setProdSizes(product.sizes);
      setProdShippingCharge(product.shippingCharge ?? 0);
      setProdPiecesAvailable(product.piecesAvailable ?? product.stockCount ?? 150);
      setProdProductLink(product.productLink || `${window.location.origin}/?product=${product.id}`);
      setProdGstRate(product.gstRate ?? (product.price >= 1000 ? 12 : 5));
      setProdHsnCode(product.hsnCode ?? getDefaultHsnForCategory(product.category));
      setProdTaxInclusive(product.taxInclusive ?? true);
    } else {
      const tempId = `prod_${Date.now()}`;
      setEditingProductId(null);
      setProdName('');
      setProdCategory('oversized-t-shirts');
      setProdPrice('');
      setProdOriginalPrice('');
      setProdDescription('');
      setProdFabric('');
      setProdImage('/src/assets/images/ziproo_product_tee_1790610656044.jpg');
      setProdIsNewLaunch(false);
      setProdInStock(true);
      setProdSizes(['S', 'M', 'L', 'XL', 'XXL']);
      setProdShippingCharge(0);
      setProdPiecesAvailable(150);
      setProdProductLink(`${window.location.origin}/?product=${tempId}`);
      setProdGstRate(12);
      setProdHsnCode('6109');
      setProdTaxInclusive(true);
    }
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice) return;

    try {
      const numPrice = Number(prodPrice);
      const rate = Number(prodGstRate || 0);
      let calculatedBasePrice = numPrice;
      let calculatedGstAmount = 0;

      if (prodTaxInclusive && rate > 0) {
        calculatedBasePrice = Math.round((numPrice / (1 + rate / 100)) * 100) / 100;
        calculatedGstAmount = Math.round((numPrice - calculatedBasePrice) * 100) / 100;
      } else if (!prodTaxInclusive && rate > 0) {
        calculatedGstAmount = Math.round((numPrice * (rate / 100)) * 100) / 100;
      }

      const payload = {
        name: prodName,
        category: prodCategory,
        price: numPrice,
        originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : undefined,
        description: prodDescription,
        fabricDetails: prodFabric,
        image: prodImage || '/src/assets/images/ziproo_product_tee_1790610656044.jpg',
        isNewLaunch: prodIsNewLaunch,
        inStock: prodInStock,
        sizes: prodSizes,
        shippingCharge: Number(prodShippingCharge || 0),
        piecesAvailable: Number(prodPiecesAvailable || 0),
        productLink: prodProductLink,
        // GST & Tax Portal
        gstRate: rate,
        hsnCode: prodHsnCode.trim() || getDefaultHsnForCategory(prodCategory),
        taxInclusive: prodTaxInclusive,
        basePrice: calculatedBasePrice,
        gstAmount: calculatedGstAmount,
      };

      if (editingProductId) {
        await onEditProduct(editingProductId, payload);
        showSuccess(`Product "${prodName}" updated successfully in catalog`);
      } else {
        await onAddProduct(payload);
        showSuccess(`New apparel "${prodName}" launched successfully`);
      }
      setIsProductModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error saving product');
    }
  };

  // Quick toggle New Launch status
  const handleToggleNewLaunch = async (product: Product) => {
    try {
      await onEditProduct(product.id, { isNewLaunch: !product.isNewLaunch });
      showSuccess(`Updated ${product.name} New Launch status`);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Update Submit
  const openUpdateForm = (update?: CompanyUpdate) => {
    if (update) {
      setEditingUpdateId(update.id);
      setUpdTitle(update.title);
      setUpdContent(update.content);
      setUpdCategory(update.category);
      setUpdDate(update.date);
      setUpdImageUrl(update.imageUrl || '');
      setUpdVideoUrl(update.videoUrl || '');
    } else {
      setEditingUpdateId(null);
      setUpdTitle('');
      setUpdContent('');
      setUpdCategory('Announcement');
      setUpdDate(new Date().toISOString().split('T')[0]);
      setUpdImageUrl('');
      setUpdVideoUrl('');
    }
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updTitle.trim() || !updContent.trim()) return;

    try {
      const payload = {
        title: updTitle,
        content: updContent,
        category: updCategory,
        date: updDate,
        imageUrl: updImageUrl.trim() || undefined,
        videoUrl: updVideoUrl.trim() || undefined,
      };

      if (editingUpdateId) {
        await onEditUpdate(editingUpdateId, payload);
        showSuccess('Daily update modified successfully');
      } else {
        await onAddUpdate(payload);
        showSuccess('Daily update published to Our Story page');
      }
      setIsUpdateModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error saving update');
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const messages = editAnnouncements
        .split('\n')
        .map((m) => m.trim())
        .filter(Boolean);

      await onUpdateSettings({
        brandName: editBrandName,
        domain: editDomain,
        tagline: editTagline,
        secondarySlogan: editSlogan,
        email: editEmail,
        adminNotificationEmail: editAdminEmail,
        instagram: editInstagram,
        facebook: editFacebook,
        youtube: editYoutube,
        announcementMessages: messages.length ? messages : settings.announcementMessages,
      });
      showSuccess('Brand settings & domain updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle Save Online Receiving Portal Configuration
  const handleSavePortal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPortal(true);
    try {
      const portalConfig: OnlineReceivingPortal = {
        enabled: portalEnabled,
        upiId: portalUpiId.trim(),
        merchantName: portalMerchantName.trim(),
        instructions: portalInstructions.trim(),
        bankAccountDetails: portalBankDetails.trim(),
      };

      await onUpdateSettings({
        onlineReceivingPortal: portalConfig,
      });
      showSuccess('Online Amount Receiving Portal configurations updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to save portal settings');
    } finally {
      setIsSavingPortal(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPw !== confirmPw) {
      setPwError('New passwords do not match');
      return;
    }
    if (newPw.length < 8) {
      setPwError('Password must be at least 8 characters long');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPw,
          newPassword: newPw,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPwSuccess('Password changed securely.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: any) {
      setPwError(err.message || 'Error changing password');
    }
  };

  // ----------------- UN-AUTHENTICATED: LOGIN VIEW -----------------
  if (!adminUser) {
    return (
      <div className="min-h-[85vh] bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-8 space-y-6 shadow-xl text-zinc-900">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-purple-50 text-[#7c3aed] border border-purple-100 mb-2">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold font-display uppercase tracking-tight text-zinc-950">
              ZIPROO Admin Portal
            </h1>
            <p className="text-xs text-zinc-500">
              Restricted management gateway for 2 authorized administrators.
            </p>
          </div>

          {/* User Requirement: Keep admin user id and password private (do not show to customers) */}
          <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-800 font-semibold font-mono text-[11px] uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-[#7c3aed]" />
              <span>Private Access Gateway</span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Authorized ZIPROO management portal only. Please provide your secure administrator credentials to proceed.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                Admin User ID
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter administrator ID"
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                Security Password
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 text-sm focus:outline-none focus:bg-white focus:border-[#7c3aed]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-zinc-800 rounded-lg transition-all shadow-md active:scale-98 disabled:opacity-50"
            >
              {isLoggingIn ? 'Authenticating...' : 'Sign In to Admin Console'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter online portal orders for the Receiving Portal Ledger
  const onlinePortalOrders = orders.filter((o) => o.paymentMethod === 'online_portal');

  // ----------------- AUTHENTICATED: DASHBOARD VIEW -----------------
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header Bar with Admin Profile */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm text-zinc-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-[#7c3aed] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono text-[#7c3aed] tracking-wider font-semibold">
                  ZIPROO Control Centre
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h1 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950">
                {adminUser.name}
              </h1>
              <p className="text-xs text-zinc-500 font-mono">
                Admin: @{adminUser.username} · Role: <strong className="text-[#7c3aed] font-semibold">{adminUser.role}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {actionSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-200 scrollbar-none">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('updates')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'updates'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Daily Updates ({updates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer Orders ({orders.length})</span>
          </button>

          {/* User Requirement: Customer particulars registered in one page visible to admin only */}
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'customers'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <Users className="w-4 h-4 text-[#7c3aed]" />
            <span>Registered Customers</span>
          </button>

          {/* User Requirement: Customer messages to atelier in one separate page seen by admin only */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'messages'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#7c3aed]" />
            <span>Atelier Inquiries</span>
          </button>

          {/* User Requirement: Creating new admin for website that can be created by admin1 only */}
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'team'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <Shield className="w-4 h-4 text-[#7c3aed]" />
            <span>Admin Team (Admin 1)</span>
          </button>

          {/* User Requirement: Online Amount Receiving Portal for Admin Only */}
          <button
            onClick={() => setActiveTab('portal')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'portal'
                ? 'bg-[#7c3aed] text-white shadow-md'
                : 'text-[#7c3aed] hover:bg-purple-50 border border-purple-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Online Receiving Portal ({onlinePortalOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Brand & Channels</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Security</span>
          </button>
        </div>

        {/* ================= TAB 1: PRODUCTS MANAGEMENT ================= */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950">
                  Apparel Catalog & Product Management
                </h2>
                <p className="text-xs text-zinc-600">
                  Manage garments, edit shipping charges, update available pieces, launch new items, and copy direct product website links.
                </p>
              </div>
              <button
                onClick={() => openProductForm()}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Products Table with Rupees */}
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase tracking-wider text-[11px] border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4">Garment</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price (₹)</th>
                    <th className="py-3 px-4">Pieces Available</th>
                    <th className="py-3 px-4">Shipping</th>
                    <th className="py-3 px-4">Product Link</th>
                    <th className="py-3 px-4">New Launch</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {products.map((product) => {
                    const productDirectLink = product.productLink || `${window.location.origin}/?product=${product.id}`;
                    return (
                      <tr key={product.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt=""
                              className="w-10 h-10 object-cover rounded-md bg-zinc-100 border border-zinc-200"
                            />
                            <div>
                              <span className="font-bold text-zinc-950 block text-sm">{product.name}</span>
                              <span className="text-[11px] text-zinc-500 line-clamp-1">{product.description}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-700">
                          {product.category}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-zinc-950 tabular-nums">
                          <div>₹{product.price.toLocaleString('en-IN')}</div>
                          <span className="text-[10px] font-mono text-purple-700 font-normal block">
                            GST {product.gstRate ?? (product.price >= 1000 ? 12 : 5)}% · HSN {product.hsnCode || '6109'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-purple-700">
                          {product.piecesAvailable ?? product.stockCount ?? 150} pcs
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-700">
                          {product.shippingCharge === 0 || !product.shippingCharge ? (
                            <span className="text-emerald-700 font-bold">FREE</span>
                          ) : (
                            `₹${product.shippingCharge}`
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(productDirectLink);
                              setCopiedLinkProdId(product.id);
                              showSuccess(`Copied direct website link for ${product.name}!`);
                              setTimeout(() => setCopiedLinkProdId(null), 2500);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-purple-300 text-[10px] font-mono text-zinc-700 hover:text-zinc-950 transition-all whitespace-nowrap"
                            title={productDirectLink}
                          >
                            {copiedLinkProdId === product.id ? (
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
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleNewLaunch(product)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                              product.isNewLaunch
                                ? 'bg-[#7c3aed] text-white shadow'
                                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950 border border-zinc-200'
                            }`}
                            title="Click to toggle New Launch section"
                          >
                            {product.isNewLaunch ? '★ In New Launch' : '+ Add to Launch'}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              product.inStock
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => openProductForm(product)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Permanently delete "${product.name}"?`)) {
                                onDeleteProduct(product.id);
                                showSuccess('Product removed from catalog');
                              }
                            }}
                            className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-zinc-100 rounded transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 2: DAILY UPDATES ================= */}
        {activeTab === 'updates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950">
                  Daily Brand Updates & Announcements
                </h2>
                <p className="text-xs text-zinc-600">
                  Publish, edit, and delete company updates, product launches, design milestones, and announcements shown on the Our Story page.
                </p>
              </div>
              <button
                onClick={() => openUpdateForm()}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Daily Update</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {updates.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white border border-zinc-200 flex flex-col justify-between space-y-4 shadow-sm hover:border-zinc-300 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">{item.date}</span>
                    </div>

                    {/* Media Attachments Preview: Image or Video */}
                    {item.imageUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-zinc-200 aspect-video max-h-48 bg-zinc-100">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-mono text-white flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-purple-400" />
                          <span>Image Attached</span>
                        </span>
                      </div>
                    )}

                    {item.videoUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-zinc-200 bg-black aspect-video max-h-48">
                        <video
                          src={item.videoUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-mono text-white flex items-center gap-1">
                          <Video className="w-3 h-3 text-purple-400" />
                          <span>Video Attached</span>
                        </span>
                      </div>
                    )}

                    <h3 className="text-base font-bold text-zinc-950">{item.title}</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">{item.content}</p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500">By: {item.author}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openUpdateForm(item)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-950 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this daily update?')) {
                            onDeleteUpdate(item.id);
                            showSuccess('Daily update deleted');
                          }
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-600 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: UPGRADED ORDER MANAGEMENT (PAID ORDERS, COD ORDERS, FILTERS & SEARCH) ================= */}
        {activeTab === 'orders' && (
          <AdminOrdersManager
            orders={orders}
            onUpdateOrderStatus={onUpdateOrderStatus}
            token={token}
            onRefreshOrders={onRefreshOrders}
          />
        )}

        {/* ================= TAB: REGISTERED CUSTOMER PARTICULARS (ADMIN ONLY) ================= */}
        {activeTab === 'customers' && (
          <AdminCustomersTab token={token} />
        )}

        {/* ================= TAB: ATELIER INQUIRIES & MESSAGES ================= */}
        {activeTab === 'messages' && (
          <AdminMessagesTab token={token} />
        )}

        {/* ================= TAB: ADMIN TEAM CREATION (ADMIN 1 ONLY) ================= */}
        {activeTab === 'team' && (
          <AdminTeamTab currentAdmin={adminUser} token={token} />
        )}

        {/* ================= TAB 4: ONLINE AMOUNT RECEIVING PORTAL (ADMIN ONLY) ================= */}
        {activeTab === 'portal' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#7c3aed] uppercase tracking-widest mb-1">
                <QrCode className="w-4 h-4" />
                <span>Admin Exclusive Finance Portal</span>
              </div>
              <h2 className="text-2xl font-bold font-display uppercase tracking-tight text-zinc-950">
                Online Amount Receiving Portal
              </h2>
              <p className="text-xs text-zinc-600">
                Manage your official UPI ID, QR code receiving gateway, bank settlement credentials, and verify customer payments and UTR references.
              </p>
            </div>

            {/* Portal Configuration Settings */}
            <form onSubmit={handleSavePortal} className="p-6 sm:p-8 rounded-3xl bg-white border border-zinc-200 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-4">
                <div>
                  <h3 className="text-base font-bold font-mono text-zinc-950 uppercase">
                    UPI & QR Receiving Settings
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Controls whether customers can choose "Online Portal (UPI)" during checkout.
                  </p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="text-xs uppercase font-mono text-zinc-700 font-bold">
                    Receiving Status:
                  </span>
                  <div
                    onClick={() => setPortalEnabled(!portalEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                      portalEnabled ? 'bg-[#7c3aed]' : 'bg-zinc-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        portalEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-bold font-mono ${portalEnabled ? 'text-emerald-700' : 'text-zinc-500'}`}>
                    {portalEnabled ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Official Brand UPI ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={portalUpiId}
                    onChange={(e) => setPortalUpiId(e.target.value)}
                    placeholder="e.g. ziproo@upi or ziproo@okhdfcbank"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 text-sm font-mono focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Payments made to this UPI ID will be credited directly to your bank account.
                  </span>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Merchant / Atelier Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={portalMerchantName}
                    onChange={(e) => setPortalMerchantName(e.target.value)}
                    placeholder="ZIPROO APPAREL ATELIER"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Displayed on customer UPI payment confirmation screen.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Official Bank Account Details (for NEFT / IMPS / RTGS)
                </label>
                <input
                  type="text"
                  value={portalBankDetails}
                  onChange={(e) => setPortalBankDetails(e.target.value)}
                  placeholder="Bank Name, Account Number, IFSC Code, Branch"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 text-sm font-mono focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Customer Payment Instructions
                </label>
                <textarea
                  rows={3}
                  value={portalInstructions}
                  onChange={(e) => setPortalInstructions(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                />
              </div>

              {/* Dynamic QR Code Preview */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-center gap-6">
                {/* Visual SVG QR Code Mock for UPI */}
                <div className="w-28 h-28 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-md border border-zinc-200">
                  <div className="text-center">
                    <QrCode className="w-16 h-16 text-black mx-auto" />
                    <span className="text-[9px] font-mono text-black font-bold uppercase tracking-wider block">
                      ZIPROO UPI
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[#7c3aed] font-mono font-bold uppercase tracking-wider text-[10px] block">
                    Verified Atelier Gateway Preview
                  </span>
                  <p className="text-zinc-950 font-mono font-bold text-sm">
                    UPI: {portalUpiId}
                  </p>
                  <p className="text-zinc-600 text-xs">
                    Receiver: <strong className="text-zinc-950">{portalMerchantName}</strong>
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Customers scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI application.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingPortal}
                className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-white bg-zinc-900 hover:bg-black rounded-xl transition-all disabled:opacity-50 shadow-md"
              >
                {isSavingPortal ? 'Saving Portal Configurations...' : 'Save Portal Configurations'}
              </button>
            </form>

            {/* Online Payment Receiving Ledger & All Buyers Desk */}
            <div className="space-y-6 pt-4 border-t border-zinc-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
                    <span>Real-Time Payment Receiving & Buyer Ledger</span>
                  </div>
                  <h3 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950 flex items-center gap-2">
                    <span>Customer Payments & Buyer Particulars</span>
                    <span className="text-xs font-mono text-zinc-500 font-normal">
                      ({orders.length} total customer orders)
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-600">
                    Comprehensive ledger of all customers who bought our products, their complete delivery particulars, items ordered, and UPI/Razorpay payment verification.
                  </p>
                </div>

                {/* Metric Summary */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-mono shadow-xs">
                    <span className="text-zinc-500 block text-[10px] uppercase">All Payments Volume</span>
                    <span className="text-sm font-bold text-zinc-950">
                      ₹{orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-xs font-mono shadow-xs">
                    <span className="text-purple-700 block text-[10px] uppercase">Online UPI Portal Volume</span>
                    <span className="text-sm font-bold text-purple-900">
                      ₹{onlinePortalOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter Tabs and Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center bg-zinc-100 border border-zinc-200 rounded-xl p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setPortalFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      portalFilter === 'all'
                        ? 'bg-white text-zinc-950 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    All Payments ({orders.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPortalFilter('online_portal')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      portalFilter === 'online_portal'
                        ? 'bg-[#7c3aed] text-white shadow-sm'
                        : 'text-purple-700 hover:text-purple-950'
                    }`}
                  >
                    Online Portal UPI ({onlinePortalOrders.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPortalFilter('razorpay')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      portalFilter === 'razorpay'
                        ? 'bg-white text-zinc-950 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    Razorpay ({orders.filter((o) => o.paymentMethod === 'razorpay').length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPortalFilter('cod')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      portalFilter === 'cod'
                        ? 'bg-white text-zinc-950 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    COD ({orders.filter((o) => o.paymentMethod === 'cod').length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPortalFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      portalFilter === 'pending'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-amber-700 hover:text-amber-950'
                    }`}
                  >
                    Pending UTR ({orders.filter((o) => o.paymentStatus !== 'Paid').length})
                  </button>
                </div>

                {/* Real-time search */}
                <div className="relative min-w-[260px]">
                  <input
                    type="text"
                    placeholder="Search by customer, phone, UTR, product..."
                    value={portalSearch}
                    onChange={(e) => setPortalSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-zinc-300 rounded-xl text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed]"
                  />
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Filtered Payments & Buyers Table */}
              {(() => {
                const filteredOrders = orders.filter((o) => {
                  // Tab filter
                  if (portalFilter === 'online_portal' && o.paymentMethod !== 'online_portal') return false;
                  if (portalFilter === 'razorpay' && o.paymentMethod !== 'razorpay') return false;
                  if (portalFilter === 'cod' && o.paymentMethod !== 'cod') return false;
                  if (portalFilter === 'paid' && o.paymentStatus !== 'Paid') return false;
                  if (portalFilter === 'pending' && o.paymentStatus === 'Paid') return false;

                  // Text search
                  if (portalSearch.trim()) {
                    const q = portalSearch.toLowerCase();
                    const matchName = o.customerName.toLowerCase().includes(q);
                    const matchPhone = o.mobileNumber.toLowerCase().includes(q);
                    const matchEmail = o.email.toLowerCase().includes(q);
                    const matchOrder = o.orderNumber.toLowerCase().includes(q);
                    const matchCity = o.city.toLowerCase().includes(q);
                    const matchUtr = o.transactionReference ? o.transactionReference.toLowerCase().includes(q) : false;
                    const matchProduct = o.items.some((it) => it.productName.toLowerCase().includes(q));
                    return matchName || matchPhone || matchEmail || matchOrder || matchCity || matchUtr || matchProduct;
                  }
                  return true;
                });

                if (filteredOrders.length === 0) {
                  return (
                    <div className="p-12 text-center rounded-2xl bg-white border border-zinc-200 text-zinc-500 space-y-2 shadow-sm">
                      <ShoppingBag className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                      <p className="font-semibold text-zinc-700">No customer payments match this criteria.</p>
                      <p className="text-xs">When customers place orders and complete payments, their full details and particulars appear here instantly.</p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase tracking-wider text-[10px] border-b border-zinc-200">
                        <tr>
                          <th className="py-3 px-4">Order Ref & Date</th>
                          <th className="py-3 px-4">Customer Who Bought (Particulars)</th>
                          <th className="py-3 px-4">Garments Ordered</th>
                          <th className="py-3 px-4">Payment Mode & UTR</th>
                          <th className="py-3 px-4">Amount Paid</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredOrders.map((ord) => {
                          const cleanPhone = ord.mobileNumber.replace(/\D/g, '');
                          const totalPieces = ord.items.reduce((s, it) => s + it.quantity, 0);
                          const isCopied = copiedUtr === ord.transactionReference;

                          return (
                            <tr key={ord.id} className="hover:bg-zinc-50/80 transition-colors">
                              {/* Order Ref & Date */}
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold text-zinc-950 block text-sm">
                                  #{ord.orderNumber}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                                  {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  {new Date(ord.createdAt).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </td>

                              {/* Customer Who Bought Our Product & Their Particulars */}
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="font-bold text-zinc-950 text-sm">{ord.customerName}</div>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono">
                                  <span className="text-purple-700 font-semibold">{ord.mobileNumber}</span>
                                  <span className="text-zinc-400">·</span>
                                  <a
                                    href={`tel:${ord.mobileNumber}`}
                                    className="text-zinc-600 hover:text-zinc-950 underline text-[10px]"
                                    title="Call customer"
                                  >
                                    Call
                                  </a>
                                  <span className="text-zinc-400">·</span>
                                  <a
                                    href={`https://wa.me/${cleanPhone}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-700 hover:text-emerald-800 underline text-[10px]"
                                    title="Message customer on WhatsApp"
                                  >
                                    WhatsApp
                                  </a>
                                </div>
                                <div className="text-[10px] text-zinc-500 font-mono truncate">{ord.email}</div>
                                <div className="mt-1 text-[11px] text-zinc-600 line-clamp-2 leading-tight">
                                  {ord.completeAddress}, {ord.city}, {ord.state} — PIN: {ord.pinCode}
                                </div>
                              </td>

                              {/* Garments Ordered */}
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="space-y-1.5">
                                  {ord.items.map((it, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-[11px]">
                                      <img
                                        src={it.image}
                                        alt={it.productName}
                                        className="w-7 h-8 object-cover rounded bg-zinc-100 border border-zinc-200 shrink-0"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="font-medium text-zinc-950 truncate">{it.productName}</div>
                                        <div className="text-[10px] text-zinc-500 font-mono">
                                          Size: <span className="text-purple-700 font-bold">[{it.size}]</span> · Qty: {it.quantity} · ₹{it.price}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="text-[10px] font-mono text-purple-700 font-bold">
                                    Total: {totalPieces} {totalPieces === 1 ? 'garment' : 'garments'}
                                  </div>
                                </div>
                              </td>

                              {/* Payment Mode & UTR Reference */}
                              <td className="py-3.5 px-4">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase mb-1 ${
                                  ord.paymentMethod === 'online_portal'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : ord.paymentMethod === 'razorpay'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                                }`}>
                                  {ord.paymentMethod === 'online_portal'
                                    ? 'Online Portal (UPI)'
                                    : ord.paymentMethod === 'razorpay'
                                    ? 'Razorpay Gateway'
                                    : 'Cash on Delivery'}
                                </span>

                                {ord.transactionReference ? (
                                  <div className="flex items-center gap-1 mt-1 font-mono text-xs">
                                    <span className="px-2 py-0.5 rounded bg-zinc-50 border border-purple-300 text-purple-800 font-bold">
                                      {ord.transactionReference}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (ord.transactionReference) {
                                          navigator.clipboard.writeText(ord.transactionReference);
                                          setCopiedUtr(ord.transactionReference);
                                          setTimeout(() => setCopiedUtr(null), 2000);
                                        }
                                      }}
                                      title="Copy UTR Reference"
                                      className="p-1 text-zinc-500 hover:text-zinc-950 rounded hover:bg-zinc-100 transition-colors"
                                    >
                                      {isCopied ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-zinc-400 italic block mt-1">
                                    No UTR reference
                                  </span>
                                )}
                              </td>

                              {/* Amount Paid */}
                              <td className="py-3.5 px-4 font-mono">
                                <span className="text-sm font-bold text-zinc-950 block">
                                  ₹{ord.totalAmount.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] text-zinc-500 block">
                                  {ord.shipping === 0 ? 'Free Shipping' : `+₹${ord.shipping} Delivery`}
                                </span>
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                    ord.paymentStatus === 'Paid'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {ord.paymentStatus}
                                </span>
                                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                  Order: {ord.orderStatus}
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {ord.paymentStatus !== 'Paid' && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await onUpdateOrderStatus(ord.id, 'Processing');
                                        showSuccess(`Payment verified for Order #${ord.orderNumber}. Marked Processing.`);
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider transition-all shadow"
                                    >
                                      Verify
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForParticulars(ord)}
                                    className="px-2.5 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-zinc-950 font-medium text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs"
                                    title="View complete customer particulars and ordered items"
                                  >
                                    <ExternalLink className="w-3 h-3 text-[#7c3aed]" />
                                    <span>Particulars</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* CUSTOMER & PAYMENT PARTICULARS MODAL (DOSSIER) */}
        {selectedOrderForParticulars && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto text-zinc-900">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-mono text-[10px] uppercase mb-1">
                    <span>Order Particulars Dossier</span>
                  </div>
                  <h3 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950 flex items-center gap-2">
                    <span>Order #{selectedOrderForParticulars.orderNumber}</span>
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">
                    Placed: {new Date(selectedOrderForParticulars.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForParticulars(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-950 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Particulars Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-purple-700 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Customer Who Bought (Particulars)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                      Customer Full Name
                    </span>
                    <p className="text-zinc-950 font-bold text-sm">
                      {selectedOrderForParticulars.customerName}
                    </p>
                    <div className="text-purple-700 font-mono text-xs flex items-center gap-2 mt-1">
                      <span>{selectedOrderForParticulars.mobileNumber}</span>
                      <a
                        href={`https://wa.me/${selectedOrderForParticulars.mobileNumber.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 underline text-[10px]"
                      >
                        WhatsApp
                      </a>
                    </div>
                    <p className="text-zinc-500 font-mono text-xs truncate">
                      {selectedOrderForParticulars.email}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                      Full Delivery Address
                    </span>
                    <p className="text-zinc-950 font-medium leading-relaxed">
                      {selectedOrderForParticulars.completeAddress}
                    </p>
                    <p className="text-zinc-600 font-mono text-xs">
                      {selectedOrderForParticulars.city}, {selectedOrderForParticulars.state} — PIN: <strong className="text-zinc-950">{selectedOrderForParticulars.pinCode}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Ordered Products Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-purple-700 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Apparel Bought ({selectedOrderForParticulars.items.reduce((s, it) => s + it.quantity, 0)} Items)</span>
                </h4>

                <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-zinc-50 p-3 space-y-2">
                  {selectedOrderForParticulars.items.map((it, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={it.image}
                          alt={it.productName}
                          className="w-10 h-12 object-cover rounded bg-white border border-zinc-200"
                        />
                        <div>
                          <p className="font-bold text-zinc-950">{it.productName}</p>
                          <p className="text-[11px] font-mono text-zinc-600">
                            Size: <span className="text-purple-700 font-bold">[{it.size}]</span> · Qty: {it.quantity} · Category: {it.category}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-zinc-950 text-sm">
                        ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details & Verification */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs font-mono">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500 uppercase text-[10px]">Payment Method:</span>
                  <span className="text-zinc-950 font-bold uppercase">
                    {selectedOrderForParticulars.paymentMethod === 'online_portal'
                      ? 'Online Receiving Portal (UPI)'
                      : selectedOrderForParticulars.paymentMethod === 'razorpay'
                      ? 'Razorpay Gateway'
                      : 'Cash on Delivery'}
                  </span>
                </div>

                {selectedOrderForParticulars.transactionReference && (
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                    <span className="text-zinc-500 uppercase text-[10px]">12-Digit UTR / Transaction Ref:</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-purple-300 text-purple-800 font-bold">
                      {selectedOrderForParticulars.transactionReference}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500 uppercase text-[10px]">Payment Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedOrderForParticulars.paymentStatus === 'Paid'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {selectedOrderForParticulars.paymentStatus}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm font-bold pt-1">
                  <span className="text-zinc-950 uppercase">Grand Total Amount:</span>
                  <span className="text-purple-700 text-base">
                    ₹{selectedOrderForParticulars.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600 font-mono">Order Status:</span>
                  <select
                    value={selectedOrderForParticulars.orderStatus}
                    onChange={async (e) => {
                      const newSt = e.target.value as Order['orderStatus'];
                      await onUpdateOrderStatus(selectedOrderForParticulars.id, newSt);
                      setSelectedOrderForParticulars((prev) => (prev ? { ...prev, orderStatus: newSt } : null));
                      showSuccess(`Order #${selectedOrderForParticulars.orderNumber} status updated to ${newSt}`);
                    }}
                    className="bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrderForParticulars(null)}
                  className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: BRAND & CONTACT SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950">
                Brand Information & Direct Channels
              </h2>
              <p className="text-xs text-zinc-600">
                Update public contact email, admin order dispatch email, Instagram, Facebook, YouTube, and running announcement bar text.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-4 shadow-sm text-zinc-900">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-zinc-100">
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#7c3aed]" />
                    Brand Store Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editBrandName}
                    onChange={(e) => setEditBrandName(e.target.value)}
                    placeholder="ZIPROO FASHION"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#7c3aed]" />
                    Custom Domain
                  </label>
                  <input
                    type="text"
                    required
                    value={editDomain}
                    onChange={(e) => setEditDomain(e.target.value)}
                    placeholder="ziproofashion.com"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-purple-700 font-bold text-sm font-mono focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Primary Brand Tagline
                  </label>
                  <input
                    type="text"
                    required
                    value={editTagline}
                    onChange={(e) => setEditTagline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Secondary Slogan
                  </label>
                  <input
                    type="text"
                    required
                    value={editSlogan}
                    onChange={(e) => setEditSlogan(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Public Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Admin Order Dispatch Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editAdminEmail}
                    onChange={(e) => setEditAdminEmail(e.target.value)}
                    placeholder="ziprooclothing@gmail.com"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm font-mono focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    required
                    value={editInstagram}
                    onChange={(e) => setEditInstagram(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Facebook Page
                  </label>
                  <input
                    type="text"
                    required
                    value={editFacebook}
                    onChange={(e) => setEditFacebook(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    YouTube Page Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editYoutube}
                    onChange={(e) => setEditYoutube(e.target.value)}
                    placeholder="ZIPROO"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Continuous Announcement Bar Messages (1 per line)
                </label>
                <textarea
                  rows={4}
                  required
                  value={editAnnouncements}
                  onChange={(e) => setEditAnnouncements(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-white bg-zinc-900 hover:bg-black rounded-lg transition-all disabled:opacity-50 shadow-sm"
              >
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </form>

            {/* Custom Domain & DNS Management Card */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-4 shadow-sm text-zinc-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-[#7c3aed]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                      Custom Domain: {editDomain || 'ziproofashion.com'}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      DNS records to point your custom domain from GoDaddy, Namecheap, Cloudflare, or Hostinger
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-50 border border-emerald-200 text-emerald-700">
                    Active Target
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase text-[10px] border-b border-zinc-200">
                    <tr>
                      <th className="p-3">Type</th>
                      <th className="p-3">Host / Name</th>
                      <th className="p-3">Points To / Target</th>
                      <th className="p-3">TTL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono text-zinc-700">
                    <tr>
                      <td className="p-3 text-[#7c3aed] font-bold">A Record</td>
                      <td className="p-3 font-semibold text-zinc-900">@</td>
                      <td className="p-3 text-zinc-800">216.239.32.21</td>
                      <td className="p-3 text-zinc-500">Auto / 3600</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-[#7c3aed] font-bold">A Record</td>
                      <td className="p-3 font-semibold text-zinc-900">@</td>
                      <td className="p-3 text-zinc-800">216.239.34.21</td>
                      <td className="p-3 text-zinc-500">Auto / 3600</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-cyan-700 font-bold">CNAME</td>
                      <td className="p-3 font-semibold text-zinc-900">www</td>
                      <td className="p-3 text-zinc-800">ghs.googlehosted.com</td>
                      <td className="p-3 text-zinc-500">Auto / 3600</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-2">
                <div className="flex items-center gap-2 text-zinc-950 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Automatic SSL / HTTPS Certificate</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Traffic to <span className="text-zinc-900 font-mono font-medium">https://{editDomain || 'ziproofashion.com'}</span> and <span className="text-zinc-900 font-mono font-medium">https://www.{editDomain || 'ziproofashion.com'}</span> is secured with automated TLS/SSL.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: SECURITY ================= */}
        {activeTab === 'security' && (
          <div className="max-w-md space-y-6">
            <div>
              <h2 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950">
                Admin Password Security
              </h2>
              <p className="text-xs text-zinc-600">
                Change password for account: <strong>{adminUser.username}</strong> ({adminUser.name})
              </p>
            </div>

            {pwError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                {pwSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-4 shadow-sm text-zinc-900">
              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 text-xs font-bold uppercase tracking-wider text-white bg-zinc-900 hover:bg-black rounded-lg transition-all shadow-sm"
              >
                Update Password
              </button>
            </form>
          </div>
        )}
      </div>

      {/* PRODUCT ADD / EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto text-zinc-900">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <h3 className="text-lg font-bold uppercase font-display text-zinc-950">
                {editingProductId ? 'Edit Product Details' : 'Add New Apparel Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. VORTEX 01 OVERSIZED TEE"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Category
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  >
                    <option value="t-shirts">T-shirts</option>
                    <option value="oversized-t-shirts">Oversized T-shirts</option>
                    <option value="hoodies">Hoodies</option>
                    <option value="pants">Pants</option>
                    <option value="shirts">Shirts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Price in Indian Rupees (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    step="1"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="1899"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Original Price (₹) [Optional]
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={prodOriginalPrice}
                    onChange={(e) => setProdOriginalPrice(e.target.value)}
                    placeholder="2499"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
              </div>

              {/* GST TAX & HSN PORTAL (USER REQUIREMENT) */}
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#7c3aed]" />
                    <span className="text-xs uppercase font-mono text-purple-900 font-bold tracking-wide">
                      GST & HSN Tax Portal (India GST Compliance)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                    Live Calculation
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1">
                      GST Tax Slab Rate
                    </label>
                    <select
                      value={prodGstRate}
                      onChange={(e) => setProdGstRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value={5}>5% (Apparel ≤ ₹1,000)</option>
                      <option value={12}>12% (Standard Streetwear &gt; ₹1,000)</option>
                      <option value={18}>18% (Luxury & Heavy Terry)</option>
                      <option value={0}>0% (Tax Exempt)</option>
                      <option value={28}>28% (Special Category)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1">
                      Apparel HSN Code
                    </label>
                    <input
                      type="text"
                      value={prodHsnCode}
                      onChange={(e) => setProdHsnCode(e.target.value)}
                      placeholder="e.g. 6109"
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1">
                      Tax Pricing Scheme
                    </label>
                    <select
                      value={prodTaxInclusive ? 'inclusive' : 'exclusive'}
                      onChange={(e) => setProdTaxInclusive(e.target.value === 'inclusive')}
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value="inclusive">GST Inclusive (MRP includes tax)</option>
                      <option value="exclusive">GST Exclusive (Add tax to base)</option>
                    </select>
                  </div>
                </div>

                {/* Apparel HSN Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Apparel HSN Presets:</span>
                  {[
                    { code: '6109', label: 'T-Shirts (6109)' },
                    { code: '6110', label: 'Hoodies (6110)' },
                    { code: '6203', label: 'Cargos (6203)' },
                    { code: '6205', label: 'Shirts (6205)' },
                  ].map((preset) => (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => setProdHsnCode(preset.code)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                        prodHsnCode === preset.code
                          ? 'bg-[#7c3aed] border-[#7c3aed] text-white font-bold'
                          : 'bg-white border-zinc-300 text-zinc-700 hover:text-zinc-950'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Live Tax Breakdown Card */}
                {Number(prodPrice) > 0 && (
                  <div className="p-3 rounded-xl bg-white border border-purple-200/80 text-xs font-mono space-y-1.5 shadow-xs">
                    <div className="flex justify-between text-zinc-600">
                      <span>Base / Taxable Value:</span>
                      <span className="text-zinc-950 font-bold">
                        ₹
                        {(prodTaxInclusive
                          ? Math.round((Number(prodPrice) / (1 + prodGstRate / 100)) * 100) / 100
                          : Number(prodPrice)
                        ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between text-zinc-600">
                      <span>Total GST ({prodGstRate}% · HSN {prodHsnCode || '—'}):</span>
                      <span className="text-purple-700 font-bold">
                        ₹
                        {(prodTaxInclusive
                          ? Math.round((Number(prodPrice) - Number(prodPrice) / (1 + prodGstRate / 100)) * 100) / 100
                          : Math.round((Number(prodPrice) * (prodGstRate / 100)) * 100) / 100
                        ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-zinc-500 pl-2 border-l-2 border-purple-400">
                      <span>CGST ({(prodGstRate / 2).toFixed(1)}%) + SGST ({(prodGstRate / 2).toFixed(1)}%):</span>
                      <span>
                        2 × ₹
                        {(
                          (prodTaxInclusive
                            ? Math.round((Number(prodPrice) - Number(prodPrice) / (1 + prodGstRate / 100)) * 100) / 100
                            : Math.round((Number(prodPrice) * (prodGstRate / 100)) * 100) / 100) / 2
                        ).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between pt-1 border-t border-zinc-200 text-zinc-950 font-bold">
                      <span>Customer Retail Price (MRP):</span>
                      <span className="text-emerald-700">
                        ₹
                        {(prodTaxInclusive
                          ? Number(prodPrice)
                          : Number(prodPrice) + Math.round((Number(prodPrice) * (prodGstRate / 100)) * 100) / 100
                        ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Upload & Preview */}
              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Product Image (File Upload or URL)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    placeholder="/src/assets/images/... or image URL"
                    className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                  <label className="cursor-pointer px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Streetwear boxy silhouette engineered with dropped shoulders..."
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Fabric Details & Specs
                </label>
                <input
                  type="text"
                  value={prodFabric}
                  onChange={(e) => setProdFabric(e.target.value)}
                  placeholder="300 GSM 100% Portuguese Terry Cotton · Pre-shrunk"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                />
              </div>

              {/* USER REQUIREMENTS: Shipping Charge Editor, Pieces Available Editor, and Auto-Generated Website Product Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-purple-50/70 border border-purple-200">
                <div>
                  <label className="block text-xs uppercase font-mono text-purple-900 font-bold mb-1">
                    Shipping Charge (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-400 font-mono text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={prodShippingCharge}
                      onChange={(e) => setProdShippingCharge(e.target.value)}
                      placeholder="0 (Free Delivery) or ₹99"
                      className="w-full pl-8 pr-4 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 text-sm font-mono focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Shipping charge editor: enter ₹0 for Free Delivery or custom fee.
                  </span>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono text-purple-900 font-bold mb-1">
                    Pieces Available (Inventory Units) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodPiecesAvailable}
                    onChange={(e) => setProdPiecesAvailable(e.target.value)}
                    placeholder="e.g. 150 pieces"
                    className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 text-sm font-mono focus:outline-none focus:border-[#7c3aed]"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    How many pieces editor: set exact available stock units.
                  </span>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-purple-200">
                  <label className="block text-xs uppercase font-mono text-purple-900 font-bold mb-1 flex items-center justify-between">
                    <span>Direct Website Product Link (Auto-Generated)</span>
                    <span className="text-[10px] font-mono text-zinc-500 font-normal">Auto-created on import</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={prodProductLink}
                      onChange={(e) => setProdProductLink(e.target.value)}
                      placeholder={`${window.location.origin}/?product=${editingProductId || 'prod_id'}`}
                      className="flex-1 px-3 py-2 bg-white border border-zinc-300 rounded-lg text-purple-700 font-mono text-xs focus:outline-none focus:border-[#7c3aed]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(prodProductLink);
                        showSuccess('Direct product link copied to clipboard!');
                      }}
                      className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                      title="Copy product link"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#7c3aed]" />
                      <span>Copy Link</span>
                    </button>
                    {prodProductLink && (
                      <a
                        href={prodProductLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-purple-700 hover:text-purple-950 rounded-lg transition-colors shrink-0"
                        title="Open product on website"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Unique direct URL for customers to access and buy this exact item on our website.
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={prodIsNewLaunch}
                    onChange={(e) => setProdIsNewLaunch(e.target.checked)}
                    className="w-4 h-4 rounded text-[#7c3aed] focus:ring-[#7c3aed] bg-white border-zinc-300"
                  />
                  <span className="text-zinc-900 font-medium">Add to New Launch Section</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={prodInStock}
                    onChange={(e) => setProdInStock(e.target.checked)}
                    className="w-4 h-4 rounded text-[#7c3aed] focus:ring-[#7c3aed] bg-white border-zinc-300"
                  />
                  <span className="text-zinc-900 font-medium">In Stock</span>
                </label>
              </div>

              <div className="pt-4 border-t border-zinc-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-zinc-900 hover:bg-black rounded-lg transition-all shadow-sm"
                >
                  {editingProductId ? 'Save Product Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE ADD / EDIT MODAL */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl text-zinc-900">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <h3 className="text-lg font-bold uppercase font-display text-zinc-950">
                {editingUpdateId ? 'Edit Daily Update' : 'Publish New Daily Update'}
              </h3>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Update Title
                </label>
                <input
                  type="text"
                  required
                  value={updTitle}
                  onChange={(e) => setUpdTitle(e.target.value)}
                  placeholder="e.g. Capsule 02 Runway Testing Complete"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Category
                  </label>
                  <select
                    value={updCategory}
                    onChange={(e) => setUpdCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  >
                    <option value="New Design">New Design</option>
                    <option value="Product Launch">Product Launch</option>
                    <option value="Announcement">Announcement</option>
                    <option value="Progress">Progress</option>
                    <option value="Behind The Scenes">Behind The Scenes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Date of Update
                  </label>
                  <input
                    type="date"
                    required
                    value={updDate}
                    onChange={(e) => setUpdDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Update Content & Progress Notes
                </label>
                <textarea
                  rows={4}
                  required
                  value={updContent}
                  onChange={(e) => setUpdContent(e.target.value)}
                  placeholder="Describe latest samples, fabric tests, production milestones, or drop schedules..."
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                />
              </div>

              {/* USER REQUIREMENTS: Media Attachments (Image and Video file upload for daily updates) */}
              <div className="space-y-4 p-4 rounded-xl bg-purple-50/70 border border-purple-200">
                <span className="text-xs font-mono text-purple-900 font-bold uppercase tracking-wider block">
                  Media Attachments (Image & Video Files)
                </span>

                {/* 1. Image Upload */}
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#7c3aed]" />
                      <span>Attach Image (File Upload or URL)</span>
                    </span>
                    {updImageUrl && (
                      <button
                        type="button"
                        onClick={() => setUpdImageUrl('')}
                        className="text-[10px] text-red-600 hover:text-red-700"
                      >
                        Remove Image
                      </button>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={updImageUrl}
                      onChange={(e) => setUpdImageUrl(e.target.value)}
                      placeholder="/uploads/... or image URL"
                      className="flex-1 px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed]"
                    />
                    <label className="cursor-pointer px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingMedia ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpdateMediaUpload(e, 'image')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {updImageUrl && (
                    <div className="mt-2 relative w-28 h-20 rounded-lg overflow-hidden border border-zinc-300 bg-zinc-100">
                      <img src={updImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* 2. Video Upload */}
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-[#7c3aed]" />
                      <span>Attach Video File (MP4, WebM, MOV)</span>
                    </span>
                    {updVideoUrl && (
                      <button
                        type="button"
                        onClick={() => setUpdVideoUrl('')}
                        className="text-[10px] text-red-600 hover:text-red-700"
                      >
                        Remove Video
                      </button>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={updVideoUrl}
                      onChange={(e) => setUpdVideoUrl(e.target.value)}
                      placeholder="/uploads/... or video URL"
                      className="flex-1 px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed]"
                    />
                    <label className="cursor-pointer px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingMedia ? 'Uploading...' : 'Upload Video'}</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleUpdateMediaUpload(e, 'video')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {updVideoUrl && (
                    <div className="mt-2 relative w-44 rounded-lg overflow-hidden border border-zinc-300 bg-black">
                      <video src={updVideoUrl} controls className="w-full max-h-32 object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-zinc-900 hover:bg-black rounded-lg transition-all shadow-sm"
                >
                  {editingUpdateId ? 'Save Update' : 'Post to Story Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
