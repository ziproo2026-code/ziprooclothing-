import React, { useState, useEffect } from 'react';
import type { Product, CompanyUpdate, StoreSettings, Order, AdminUser, OnlineReceivingPortal } from '../types/index.js';
import { AdminCustomersTab } from '../components/admin/AdminCustomersTab.js';
import { AdminMessagesTab } from '../components/admin/AdminMessagesTab.js';
import { AdminTeamTab } from '../components/admin/AdminTeamTab.js';
import { AdminOrdersManager } from '../components/admin/AdminOrdersManager.js';
import { AdminSellersTab } from '../components/admin/AdminSellersTab.js';
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
  Film,
  Volume2,
  Store,
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
  const [activeTab, setActiveTab] = useState<'products' | 'updates' | 'orders' | 'customers' | 'messages' | 'team' | 'portal' | 'settings' | 'security' | 'sellers'>('products');

  // Multi-Seller Platform: All products including pending approval from all sellers
  const [adminAllProducts, setAdminAllProducts] = useState<Product[]>([]);
  const [productApprovalFilter, setProductApprovalFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');

  const fetchAdminAllProducts = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminAllProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch admin products:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminAllProducts();
    }
  }, [token, products]);

  const handleApproveProduct = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/products/${id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showSuccess('Product approved and published to storefront!');
        fetchAdminAllProducts();
        onAddProduct({} as any);
      }
    } catch (err) {
      console.error('Failed to approve product:', err);
    }
  };

  const handleRejectProduct = async (id: string) => {
    if (!token) return;
    const reason = prompt('Enter rejection reason for the seller:', 'Does not meet catalog design criteria');
    if (reason === null) return;
    try {
      const res = await fetch(`/api/admin/products/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });
      if (res.ok) {
        showSuccess('Product marked as rejected.');
        fetchAdminAllProducts();
      }
    } catch (err) {
      console.error('Failed to reject product:', err);
    }
  };

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
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodIsNewLaunch, setProdIsNewLaunch] = useState(false);
  const [prodInStock, setProdInStock] = useState(true);
  const [prodSizes, setProdSizes] = useState<string[]>(['S', 'M', 'L', 'XL', 'XXL']);
  const [prodColors, setProdColors] = useState('Deep Onyx Black, Slate Grey, Electric Violet');
  const [prodGsm, setProdGsm] = useState<string | number>('280');
  const [prodFeatures, setProdFeatures] = useState('');
  const [prodCareInstructions, setProdCareInstructions] = useState('');
  const [prodTags, setProdTags] = useState('');
  const [prodShippingCharge, setProdShippingCharge] = useState<number | string>(0);
  const [prodPiecesAvailable, setProdPiecesAvailable] = useState<number | string>(150);
  const [prodProductLink, setProdProductLink] = useState('');
  
  // GST Tax & HSN Portal state
  const [prodGstApplicable, setProdGstApplicable] = useState<boolean>(true);
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

  // Intro Video settings state
  const [editIntroVideoUrl, setEditIntroVideoUrl] = useState(settings.introVideoUrl || '/intro_video.mp4');
  const [editIntroVideoTitle, setEditIntroVideoTitle] = useState(settings.introVideoTitle || 'ZIPROO ATELIER · 2026 BRAND INTRO FILM');
  const [editIntroVideoDescription, setEditIntroVideoDescription] = useState(
    settings.introVideoDescription || "Raw street architecture, heavyweight craftsmanship, and raw urban energy. Official brand intro film with stereo soundtrack."
  );
  const [editIntroVideoEnabled, setEditIntroVideoEnabled] = useState(settings.introVideoEnabled !== false);
  const [isUploadingIntroVideo, setIsUploadingIntroVideo] = useState(false);

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
          setProdImages((prev) => (prev.includes(data.url) ? prev : [data.url, ...prev].slice(0, 4)));
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

  // Gallery slot specific file upload (for 3-4 images)
  const handleGallerySlotUpload = async (slotIndex: number, file: File) => {
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
          setProdImages((prev) => {
            const next = [...prev];
            next[slotIndex] = data.url;
            return next;
          });
          if (slotIndex === 0 || !prodImage) {
            setProdImage(data.url);
          }
          showSuccess(`Gallery image #${slotIndex + 1} uploaded`);
        } else {
          alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error(err);
        alert('Upload failed');
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSetPrimaryImage = (index: number) => {
    if (prodImages[index]) {
      const selected = prodImages[index];
      setProdImage(selected);
      // Reorder so primary is first
      setProdImages((prev) => {
        const remaining = prev.filter((_, i) => i !== index);
        return [selected, ...remaining];
      });
      showSuccess('Set as primary product image');
    }
  };

  const handleDeleteGalleryImage = (index: number) => {
    setProdImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && prodImage === prev[index]) {
        setProdImage(next[0]);
      }
      return next;
    });
    showSuccess('Image removed from gallery');
  };

  const handleMoveGalleryImage = (index: number, direction: 'left' | 'right') => {
    setProdImages((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      if (targetIndex === 0) setProdImage(next[0]);
      return next;
    });
  };

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Intro Video Upload Handler (Direct MP4/WebM with Audio)
  const handleIntroVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingIntroVideo(true);
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
          setEditIntroVideoUrl(data.url);
          showSuccess('Intro video uploaded successfully! Click Save Settings to persist.');
        } else {
          alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error(err);
        alert('Intro video upload failed');
      } finally {
        setIsUploadingIntroVideo(false);
      }
    };
    reader.readAsDataURL(file);
  };

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
      const existingImages = Array.isArray(product.images) && product.images.length > 0 ? [...product.images] : [product.image];
      setProdImages(existingImages);
      setProdImage(product.image || existingImages[0] || '');
      setProdIsNewLaunch(product.isNewLaunch);
      setProdInStock(product.inStock);
      setProdSizes(product.sizes);
      setProdColors(Array.isArray(product.colors) ? product.colors.join(', ') : (product.color || 'Deep Onyx Black'));
      setProdGsm(product.gsm ? String(product.gsm) : '280');
      setProdFeatures(Array.isArray(product.features) ? product.features.join('\n') : '');
      setProdCareInstructions(product.careInstructions || 'Cold machine wash inside out with similar colors. Do not tumble dry. Dry flat. Iron on reverse.');
      setProdTags(Array.isArray(product.tags) ? product.tags.join(', ') : '');
      setProdShippingCharge(product.shippingCharge ?? 0);
      setProdPiecesAvailable(product.piecesAvailable ?? product.stockCount ?? 150);
      setProdProductLink(product.productLink || `${window.location.origin}/?product=${product.id}`);
      setProdGstApplicable(product.gstApplicable ?? true);
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
      setProdImages([
        '/src/assets/images/ziproo_product_tee_1790610656044.jpg',
        '/src/assets/images/ziproo_tee_back_1791053935583.jpg',
        '/src/assets/images/ziproo_tee_macro_1791053949356.jpg',
        '/src/assets/images/ziproo_tee_side_1791053962419.jpg'
      ]);
      setProdImage('/src/assets/images/ziproo_product_tee_1790610656044.jpg');
      setProdIsNewLaunch(false);
      setProdInStock(true);
      setProdSizes(['S', 'M', 'L', 'XL', 'XXL']);
      setProdColors('Deep Onyx Black, Slate Grey, Electric Violet');
      setProdGsm('280');
      setProdFeatures('280 GSM Combed Heavy Cotton\nArchitectural Boxy Cut\nPre-Shrunk Bio-Washed\nReinforced Collar Ribbing');
      setProdCareInstructions('Cold machine wash inside out with similar colors. Do not bleach. Dry flat in shade. Iron on reverse.');
      setProdTags('Oversized, 280 GSM, Streetwear, Limited Drop');
      setProdShippingCharge(0);
      setProdPiecesAvailable(150);
      setProdProductLink(`${window.location.origin}/?product=${tempId}`);
      setProdGstApplicable(true);
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
      const rate = prodGstApplicable ? Number(prodGstRate || 0) : 0;
      let calculatedBasePrice = numPrice;
      let calculatedGstAmount = 0;

      if (prodTaxInclusive && rate > 0) {
        calculatedBasePrice = Math.round((numPrice / (1 + rate / 100)) * 100) / 100;
        calculatedGstAmount = Math.round((numPrice - calculatedBasePrice) * 100) / 100;
      } else if (!prodTaxInclusive && rate > 0) {
        calculatedGstAmount = Math.round((numPrice * (rate / 100)) * 100) / 100;
      }

      const cleanImages = prodImages.filter((img) => typeof img === 'string' && img.trim().length > 0);
      const primaryImg = prodImage || cleanImages[0] || '/src/assets/images/ziproo_product_tee_1790610656044.jpg';

      const colorList = prodColors.split(',').map((c) => c.trim()).filter(Boolean);
      const featureList = prodFeatures.split('\n').map((f) => f.trim()).filter(Boolean);
      const tagList = prodTags.split(',').map((t) => t.trim()).filter(Boolean);

      const payload = {
        name: prodName,
        category: prodCategory,
        price: numPrice,
        originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : undefined,
        description: prodDescription,
        fabricDetails: prodFabric,
        image: primaryImg,
        images: cleanImages.length > 0 ? cleanImages : [primaryImg],
        isNewLaunch: prodIsNewLaunch,
        inStock: prodInStock,
        sizes: prodSizes,
        colors: colorList.length > 0 ? colorList : ['Deep Onyx Black'],
        color: colorList[0] || 'Deep Onyx Black',
        gsm: prodGsm ? String(prodGsm).trim() : undefined,
        features: featureList,
        careInstructions: prodCareInstructions.trim() || 'Cold machine wash inside out. Dry flat. Iron on reverse.',
        tags: tagList,
        shippingCharge: Number(prodShippingCharge || 0),
        piecesAvailable: Number(prodPiecesAvailable || 0),
        stockCount: Number(prodPiecesAvailable || 0),
        productLink: prodProductLink,
        // GST & Tax Details
        gstApplicable: prodGstApplicable,
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
        introVideoUrl: editIntroVideoUrl.trim() || '/intro_video.mp4',
        introVideoTitle: editIntroVideoTitle.trim(),
        introVideoDescription: editIntroVideoDescription.trim(),
        introVideoEnabled: editIntroVideoEnabled,
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

          {/* Multi-Seller Platform: Seller Management (PART 8) */}
          <button
            onClick={() => setActiveTab('sellers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'sellers'
                ? 'bg-[#7c3aed] text-white shadow-md'
                : 'text-[#7c3aed] hover:bg-purple-50 border border-purple-200'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Seller Management</span>
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
        {activeTab === 'products' && (() => {
          const catalogProducts = adminAllProducts.length > 0 ? adminAllProducts : products;
          const approvedCount = catalogProducts.filter((p) => p.approvalStatus === 'APPROVED' || !p.approvalStatus).length;
          const pendingCount = catalogProducts.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length;
          const rejectedCount = catalogProducts.filter((p) => p.approvalStatus === 'REJECTED').length;

          const filteredCatalogProducts = catalogProducts.filter((p) => {
            if (productApprovalFilter === 'APPROVED') return p.approvalStatus === 'APPROVED' || !p.approvalStatus;
            if (productApprovalFilter === 'PENDING') return p.approvalStatus === 'PENDING_APPROVAL';
            if (productApprovalFilter === 'REJECTED') return p.approvalStatus === 'REJECTED';
            return true;
          });

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-display uppercase tracking-tight text-zinc-950">
                    Apparel Catalog & Multi-Seller Product Management
                  </h2>
                  <p className="text-xs text-zinc-600">
                    Manage garments from all sellers, review & approve new seller submissions, edit prices, and manage live stock.
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

              {/* Approval Filter Bar */}
              <div className="flex items-center gap-2 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200 overflow-x-auto">
                <button
                  onClick={() => setProductApprovalFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    productApprovalFilter === 'ALL'
                      ? 'bg-black text-white font-bold shadow-xs'
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  All Products ({catalogProducts.length})
                </button>
                <button
                  onClick={() => setProductApprovalFilter('APPROVED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    productApprovalFilter === 'APPROVED'
                      ? 'bg-emerald-700 text-white font-bold shadow-xs'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  Approved & Live ({approvedCount})
                </button>
                <button
                  onClick={() => setProductApprovalFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    productApprovalFilter === 'PENDING'
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  Pending Approval ({pendingCount})
                </button>
                <button
                  onClick={() => setProductApprovalFilter('REJECTED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    productApprovalFilter === 'REJECTED'
                      ? 'bg-red-700 text-white font-bold shadow-xs'
                      : 'text-red-800 hover:bg-red-50'
                  }`}
                >
                  Rejected ({rejectedCount})
                </button>
              </div>

              {/* Products Table with Rupees */}
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-600 font-mono uppercase tracking-wider text-[11px] border-b border-zinc-200">
                    <tr>
                      <th className="py-3 px-4">Garment</th>
                      <th className="py-3 px-4">Seller / Atelier</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price (₹)</th>
                      <th className="py-3 px-4">Pieces Available</th>
                      <th className="py-3 px-4">Approval Status</th>
                      <th className="py-3 px-4">New Launch</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredCatalogProducts.map((product) => {
                      const productDirectLink = product.productLink || `${window.location.origin}/?product=${product.id}`;
                      const isPending = product.approvalStatus === 'PENDING_APPROVAL';
                      const isApproved = product.approvalStatus === 'APPROVED' || !product.approvalStatus;
                      const isRejected = product.approvalStatus === 'REJECTED';

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
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-200">
                              {product.sellerName || 'ZIPROO Atelier'}
                            </span>
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

                          {/* Approval Status & Review Controls */}
                          <td className="py-3 px-4">
                            {isPending ? (
                              <div className="space-y-1.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 block text-center">
                                  PENDING APPROVAL
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleApproveProduct(product.id)}
                                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-mono font-bold uppercase"
                                    title="Approve product for storefront"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectProduct(product.id)}
                                    className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-mono font-bold uppercase"
                                    title="Reject product"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ) : isApproved ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                                APPROVED · LIVE
                              </span>
                            ) : (
                              <div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-100 text-red-900 border border-red-300">
                                  REJECTED
                                </span>
                                {product.rejectionReason && (
                                  <div className="text-[10px] text-red-600 mt-0.5 max-w-[150px] truncate" title={product.rejectionReason}>
                                    {product.rejectionReason}
                                  </div>
                                )}
                              </div>
                            )}
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
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const newInStock = !product.inStock;
                                  await onEditProduct(product.id, { inStock: newInStock });
                                  fetchAdminAllProducts();
                                  showSuccess(
                                    `"${product.name}" marked as ${newInStock ? 'IN STOCK' : 'OUT OF STOCK'} in atelier database`
                                  );
                                } catch (err) {
                                  console.error('Failed to toggle stock status:', err);
                                }
                              }}
                              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer active:scale-95 ${
                                product.inStock
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-red-50 hover:bg-red-100 text-red-800 border border-red-300'
                              }`}
                              title="Click to toggle stock status (IN STOCK / OUT OF STOCK)"
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  product.inStock ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'
                               }`}
                              />
                              <span>{product.inStock ? 'IN STOCK' : 'OUT OF STOCK'}</span>
                            </button>
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
                                  fetchAdminAllProducts();
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
          );
        })()}

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

        {/* ================= TAB: SELLER MANAGEMENT (PART 8) ================= */}
        {activeTab === 'sellers' && (
          <AdminSellersTab token={token} />
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

            {/* Brand Intro Film & Stereo Audio Controls Card */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-5 shadow-sm text-zinc-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
                    <Film className="w-5 h-5 text-[#7c3aed]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-2">
                      <span>Brand Intro Film & Stereo Audio</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-100 text-purple-700 font-semibold">
                        AUDIO ACTIVE
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Configure the official brand intro video and audio track displayed across the storefront.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
                  <input
                    type="checkbox"
                    checked={editIntroVideoEnabled}
                    onChange={(e) => setEditIntroVideoEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600"
                  />
                  <span className="font-semibold text-zinc-800">
                    {editIntroVideoEnabled ? 'Section Enabled' : 'Section Disabled'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Intro Video Title
                  </label>
                  <input
                    type="text"
                    value={editIntroVideoTitle}
                    onChange={(e) => setEditIntroVideoTitle(e.target.value)}
                    placeholder="ZIPROO ATELIER · 2026 BRAND INTRO FILM"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Intro Video Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={editIntroVideoDescription}
                    onChange={(e) => setEditIntroVideoDescription(e.target.value)}
                    placeholder="DON'T FOLLOW THE RULES. CREATE IT. · HIGH DEFINITION STEREO AUDIO"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-sm focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1 flex items-center justify-between">
                  <span>Intro Video URL or Local MP4 Path (with Audio Track)</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Supports /intro_video.mp4, YouTube, or MP4 URL</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={editIntroVideoUrl}
                    onChange={(e) => setEditIntroVideoUrl(e.target.value)}
                    placeholder="/intro_video.mp4 or https://..."
                    className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingIntroVideo ? 'Uploading...' : 'Upload Video File'}</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleIntroVideoUpload}
                      disabled={isUploadingIntroVideo}
                    />
                  </label>
                </div>
              </div>

              {/* Video Preview with Audio Player */}
              {editIntroVideoUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-600">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                      Live Video & Audio Preview:
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono truncate max-w-xs">
                      {editIntroVideoUrl}
                    </span>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-zinc-200 bg-black aspect-video max-h-64 flex items-center justify-center">
                    {editIntroVideoUrl.includes('youtube.com') || editIntroVideoUrl.includes('youtu.be') ? (
                      <iframe
                        src={editIntroVideoUrl.replace('watch?v=', 'embed/')}
                        title="Intro Video Preview"
                        className="w-full h-full aspect-video"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        controls
                        src={editIntroVideoUrl}
                        className="w-full h-full object-contain"
                        preload="metadata"
                      />
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingSettings ? 'Saving Changes...' : 'Save Intro Video Settings'}</span>
              </button>
            </div>

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

              {/* 1. STOCK MANAGEMENT STATUS CONTROL (USER REQUIREMENT) */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono text-zinc-900 font-bold tracking-wide flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#7c3aed]" />
                    <span>Product Stock Management</span>
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                      prodInStock
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}
                  >
                    ● {prodInStock ? 'IN STOCK' : 'OUT OF STOCK'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProdInStock(true)}
                    className={`py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${
                      prodInStock
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>IN STOCK (Purchasable)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProdInStock(false)}
                    className={`py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${
                      !prodInStock
                        ? 'bg-red-600 text-white border-red-700 shadow-sm'
                        : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>OUT OF STOCK (Sold Out)</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500">
                  When set to OUT OF STOCK, a clear label is displayed, "Add to Cart" and "Buy Now" are disabled, and checkout is blocked while keeping the garment visible in catalog.
                </p>
              </div>

              {/* 2. PRODUCT IMAGE GALLERY (3–4 SEPARATE IMAGES AS REQUIRED) */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase font-mono text-zinc-900 font-bold tracking-wide flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#7c3aed]" />
                      <span>Product Image Gallery (3–4 Separate Images)</span>
                    </span>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      Upload 3–4 angles for customers to view in gallery, switch thumbnails, and zoom.
                    </span>
                  </div>
                  <span className="text-xs font-mono text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                    {prodImages.length}/4 Images
                  </span>
                </div>

                {/* 4 Image Slots Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((slotIdx) => {
                    const slotImg = prodImages[slotIdx];
                    const isPrimary = prodImage === slotImg || (slotIdx === 0 && !prodImage);

                    return (
                      <div
                        key={slotIdx}
                        className={`p-3 rounded-xl border flex flex-col justify-between space-y-2.5 transition-all bg-white ${
                          isPrimary
                            ? 'border-[#7c3aed] ring-2 ring-purple-100 shadow-xs'
                            : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-zinc-700">Slot {slotIdx + 1}</span>
                          {slotImg && isPrimary && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                              ★ Primary
                            </span>
                          )}
                        </div>

                        {/* Image Preview Box */}
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200">
                          {slotImg ? (
                            <img
                              src={slotImg}
                              alt={`Slot ${slotIdx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 text-[11px] p-2 text-center">
                              <ImageIcon className="w-6 h-6 mb-1 text-zinc-300" />
                              <span>Empty Slot</span>
                            </div>
                          )}
                        </div>

                        {/* Slot URL Input */}
                        <input
                          type="text"
                          value={slotImg || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProdImages((prev) => {
                              const next = [...prev];
                              next[slotIdx] = val;
                              return next;
                            });
                            if (slotIdx === 0 && !prodImage) setProdImage(val);
                          }}
                          placeholder="/src/assets/... or URL"
                          className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded text-[11px] font-mono text-zinc-900 focus:outline-none focus:border-[#7c3aed]"
                        />

                        {/* Actions for Slot: Upload, Set Primary, Delete, Reorder */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <label className="cursor-pointer px-2 py-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded text-[10px] font-mono text-zinc-800 flex items-center gap-1 transition-colors">
                            <Upload className="w-3 h-3 text-[#7c3aed]" />
                            <span>Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleGallerySlotUpload(slotIdx, file);
                              }}
                              className="hidden"
                            />
                          </label>

                          {slotImg && (
                            <>
                              {!isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(slotIdx)}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[10px] font-mono font-semibold"
                                  title="Make this the primary catalog card image"
                                >
                                  ★ Primary
                                </button>
                              )}

                              {slotIdx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveGalleryImage(slotIdx, 'left')}
                                  className="p-1 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-600"
                                  title="Move Left"
                                >
                                  ←
                                </button>
                              )}

                              {slotIdx < prodImages.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveGalleryImage(slotIdx, 'right')}
                                  className="p-1 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-600"
                                  title="Move Right"
                                >
                                  →
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteGalleryImage(slotIdx)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded ml-auto"
                                title="Delete image from gallery"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. GST INFORMATION & HSN TAX DETAILS (USER REQUIREMENT) */}
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#7c3aed]" />
                    <span className="text-xs uppercase font-mono text-purple-900 font-bold tracking-wide">
                      GST & HSN Tax Information
                    </span>
                  </div>
                  
                  {/* GST Applicability Switch */}
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
                    <input
                      type="checkbox"
                      checked={prodGstApplicable}
                      onChange={(e) => setProdGstApplicable(e.target.checked)}
                      className="w-4 h-4 rounded text-[#7c3aed] focus:ring-[#7c3aed] bg-white border-zinc-300"
                    />
                    <span className="text-purple-950 font-bold">GST Applicable</span>
                  </label>
                </div>

                {prodGstApplicable && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1 font-semibold">
                          GST Rate (%)
                        </label>
                        <select
                          value={prodGstRate}
                          onChange={(e) => setProdGstRate(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed]"
                        >
                          <option value={5}>5% (Apparel ≤ ₹1,000)</option>
                          <option value={12}>12% (Standard Streetwear &gt; ₹1,000)</option>
                          <option value={18}>18% (Luxury & Heavy Outerwear)</option>
                          <option value={0}>0% (Exempt)</option>
                          <option value={28}>28% (Special)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1 font-semibold">
                          HSN/SAC Code
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
                        <label className="block text-[11px] uppercase font-mono text-zinc-600 mb-1 font-semibold">
                          Tax Pricing Scheme
                        </label>
                        <select
                          value={prodTaxInclusive ? 'inclusive' : 'exclusive'}
                          onChange={(e) => setProdTaxInclusive(e.target.value === 'inclusive')}
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed]"
                        >
                          <option value="inclusive">Tax-Inclusive (Price includes GST)</option>
                          <option value="exclusive">Tax-Exclusive (Add GST to base price)</option>
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
                          <span>Product Price Before Tax (Base):</span>
                          <span className="text-zinc-950 font-bold">
                            ₹
                            {(prodTaxInclusive
                              ? Math.round((Number(prodPrice) / (1 + prodGstRate / 100)) * 100) / 100
                              : Number(prodPrice)
                            ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex justify-between text-zinc-600">
                          <span>Applicable GST Amount ({prodGstRate}% · HSN {prodHsnCode || '—'}):</span>
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
                          <span>Final Customer Retail Price (MRP):</span>
                          <span className="text-emerald-700 font-bold text-sm">
                            ₹
                            {(prodTaxInclusive
                              ? Number(prodPrice)
                              : Number(prodPrice) + Math.round((Number(prodPrice) * (prodGstRate / 100)) * 100) / 100
                            ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 4. DESCRIPTION & MATERIAL/FABRIC */}
              <div>
                <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                  Product Description *
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Material / Fabric Information
                  </label>
                  <input
                    type="text"
                    value={prodFabric}
                    onChange={(e) => setProdFabric(e.target.value)}
                    placeholder="100% Combed Portuguese Terry Cotton"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    GSM (Grams Per Square Meter)
                  </label>
                  <input
                    type="text"
                    value={prodGsm}
                    onChange={(e) => setProdGsm(e.target.value)}
                    placeholder="e.g. 280 or 480"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs font-mono focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
              </div>

              {/* 5. COLOURS & SIZES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Available Colours (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={prodColors}
                    onChange={(e) => setProdColors(e.target.value)}
                    placeholder="Deep Onyx Black, Slate Grey, Electric Violet"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Product Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={prodTags}
                    onChange={(e) => setProdTags(e.target.value)}
                    placeholder="Oversized, Heavyweight, Streetwear, Drop 01"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
              </div>

              {/* 6. FEATURES & CARE INSTRUCTIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Product Features (One per line)
                  </label>
                  <textarea
                    rows={3}
                    value={prodFeatures}
                    onChange={(e) => setProdFeatures(e.target.value)}
                    placeholder="280 GSM Combed Heavy Cotton&#10;Dropped Shoulder Boxy Cut&#10;Pre-Shrunk Bio-Washed&#10;Reinforced Collar Ribbing"
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed] focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono text-zinc-600 mb-1">
                    Care Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={prodCareInstructions}
                    onChange={(e) => setProdCareInstructions(e.target.value)}
                    placeholder="Cold machine wash inside out with similar colors. Do not bleach. Dry flat in shade. Iron on reverse."
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 text-xs focus:outline-none focus:border-[#7c3aed] focus:bg-white"
                  />
                </div>
              </div>

              {/* 7. INVENTORY, SHIPPING CHARGE & WEBSITE PRODUCT LINK */}
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
                    Enter ₹0 for Free Delivery or custom fee.
                  </span>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono text-purple-900 font-bold mb-1">
                    Inventory Quantity (Pieces Available) *
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
                    Total stock units available in atelier warehouse.
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
