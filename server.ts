import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { loadDatabase, saveDatabase } from './src/server/storage.js';
import { verifyPassword, generateToken, verifyToken, hashPassword } from './src/server/auth.js';
import {
  sendAdminOrderEmail,
  sendCustomerOrderSms,
  sendCustomerStatusUpdate,
  sendCustomerOrderEmail,
  sendSellerOrderEmail,
  testBrevoEmailIntegration,
  testMsg91SmsIntegration,
  getMsg91Config,
  type EmailEvent,
} from './src/server/notifications.js';
import type {
  AdminUser,
  Product,
  CompanyUpdate,
  Order,
  ProductReview,
  Customer,
  CustomerMessage,
  OrderStatus,
  Seller,
  OrderItem,
  AuditLogEntry,
  PaymentQrCode,
  BankReceivingDetails,
  IntroVideoItem,
  HomepageBackgroundItem,
  PaymentStatus,
} from './src/types/index.js';

// Audit Logger Helper function
export function recordAuditLog(entry: {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details?: string;
  relatedId?: string;
}) {
  try {
    const db = loadDatabase();
    db.auditLogs = db.auditLogs || [];
    const newLog: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: entry.userId,
      userName: entry.userName,
      userRole: entry.userRole,
      action: entry.action,
      details: entry.details,
      relatedId: entry.relatedId,
      timestamp: new Date().toISOString(),
    };
    db.auditLogs.unshift(newLog);
    // Keep last 1000 logs
    if (db.auditLogs.length > 1000) {
      db.auditLogs = db.auditLogs.slice(0, 1000);
    }
    saveDatabase(db);
    return newLog;
  } catch (err) {
    console.warn('[ZIPROO] Failed to write audit log:', err);
    return null;
  }
}

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Parse JSON bodies with generous limit for image and video uploads
app.use(express.json({ limit: '50mb' }));

// Ensure upload directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/assets', express.static(path.resolve(process.cwd(), 'public/assets')));

// Auth Middleware
interface AuthenticatedRequest extends Request {
  adminUser?: AdminUser;
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }

  if (user.normalizedRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required to access this resource.' });
  }

  req.adminUser = user;
  next();
}

// Customer Authentication Middleware
export interface AuthenticatedCustomerRequest extends Request {
  customer?: Customer;
}

export function requireCustomer(req: AuthenticatedCustomerRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in to view your orders.',
      code: 'UNAUTHENTICATED'
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token) as any;
  if (!decoded || !decoded.id) {
    return res.status(401).json({
      error: 'Invalid or expired session. Please sign in again.',
      code: 'INVALID_TOKEN'
    });
  }

  const db = loadDatabase();
  const customer = (db.customers || []).find((c) => c.id === decoded.id);
  if (!customer) {
    return res.status(401).json({
      error: 'Customer account not found. Please sign in again.',
      code: 'CUSTOMER_NOT_FOUND'
    });
  }

  req.customer = customer;
  next();
}

// Seller Authentication Middleware
export interface AuthenticatedSellerRequest extends Request {
  seller?: Seller;
}

export function requireSeller(req: AuthenticatedSellerRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in to your Seller Portal.',
      code: 'UNAUTHENTICATED'
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({
      error: 'Invalid or expired seller session. Please sign in again.',
      code: 'INVALID_TOKEN'
    });
  }

  if (decoded.normalizedRole !== 'SELLER') {
    return res.status(403).json({
      error: 'Forbidden: Dedicated seller credentials required.',
      code: 'FORBIDDEN_ROLE'
    });
  }

  const db = loadDatabase();
  const seller = (db.sellers || []).find((s) => s.id === decoded.id);
  if (!seller) {
    return res.status(401).json({
      error: 'Seller account not found. Please contact administration.',
      code: 'SELLER_NOT_FOUND'
    });
  }

  if (seller.status === 'SUSPENDED') {
    return res.status(403).json({
      error: 'Your seller account has been suspended by administration.',
      code: 'SELLER_SUSPENDED',
      reason: seller.suspendedReason || 'Administrative suspension'
    });
  }

  req.seller = seller;
  next();
}

// ----------------- AUTH APIS -----------------

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUser = username.trim().toLowerCase();
  const db = loadDatabase();
  
  // Support both ranjith_ziproo and legacy manager_ziproo alias
  const admin = db.admins.find(
    (a) =>
      a.username.toLowerCase() === cleanUser ||
      (a.email && a.email.toLowerCase() === cleanUser) ||
      (cleanUser === 'ranjith_ziproo' && a.id === 'usr_admin_2') ||
      (cleanUser === 'manager_ziproo' && a.id === 'usr_admin_2')
  );

  if (!admin) {
    return res.status(401).json({ error: 'Invalid administrator credentials' });
  }

  const isValid = verifyPassword(password, admin.salt, admin.hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid administrator credentials' });
  }

  // Update last login
  admin.lastLogin = new Date().toISOString();
  saveDatabase(db);

  const adminPayload: AdminUser = {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    lastLogin: admin.lastLogin,
  };

  const token = generateToken(adminPayload);
  res.json({
    token,
    user: adminPayload,
    message: `Welcome back, ${admin.name}`,
  });
});

// POST /api/auth/portal-login (Common Sign-In Portal for Super Admin, Admin, Seller, Customer)
app.post('/api/auth/portal-login', (req: Request, res: Response) => {
  const { identifier, username, email, password } = req.body;
  const loginId = (identifier || username || email || '').trim().toLowerCase();
  const loginPass = (password || '').trim();

  if (!loginId || !loginPass) {
    return res.status(400).json({ error: 'Username/Email and Password are required' });
  }

  const db = loadDatabase();

  // 1. Check Administrator Accounts (Super Admin / Admin)
  const admin = db.admins.find(
    (a) =>
      a.username.toLowerCase() === loginId ||
      (a.email && a.email.toLowerCase() === loginId) ||
      (loginId === 'ranjith_ziproo' && a.id === 'usr_admin_2') ||
      (loginId === 'manager_ziproo' && a.id === 'usr_admin_2') ||
      (loginId === 'admin@ziproo.com' && (a.id === 'usr_admin_1' || a.username === 'rohithsharma'))
  );

  if (admin) {
    if (admin.status === 'INACTIVE') {
      return res.status(403).json({ error: 'This administrator account has been deactivated. Please contact Super Admin.' });
    }

    let isValid = verifyPassword(loginPass, admin.salt, admin.hash);
    // Backward compatibility for test/default credentials
    if (!isValid && loginPass === 'admin' && (admin.id === 'usr_admin_1' || admin.username === 'rohithsharma')) {
      isValid = true;
    }

    if (isValid) {
      admin.lastLogin = new Date().toISOString();
      saveDatabase(db);

      const isSuperAdmin = admin.id === 'usr_admin_1' || admin.username === 'rohithsharma' || (admin.role && admin.role.toLowerCase().includes('founder'));
      const determinedRole = isSuperAdmin ? 'super_admin' : 'admin';

      const adminPayload: AdminUser = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role || (isSuperAdmin ? 'Super Admin' : 'Admin'),
        lastLogin: admin.lastLogin,
        status: admin.status || 'ACTIVE',
      };

      const token = generateToken({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: determinedRole,
      });

      recordAuditLog({
        userId: admin.id,
        userName: admin.name,
        userRole: determinedRole,
        action: 'Portal Sign-In',
        details: `Successful sign-in as ${determinedRole.toUpperCase()}`,
      });

      return res.json({
        success: true,
        role: determinedRole,
        userRole: determinedRole,
        token,
        user: adminPayload,
        redirectUrl: '/admin',
        message: `Welcome back, ${admin.name}`,
      });
    }
  }

  // 2. Check Seller Accounts
  const seller = (db.sellers || []).find(
    (s) =>
      s.email.toLowerCase() === loginId ||
      (s.phone && s.phone.replace(/\D/g, '') === loginId.replace(/\D/g, '')) ||
      (s.id && s.id.toLowerCase() === loginId)
  );

  if (seller && seller.salt && seller.hash) {
    const isSellerValid = verifyPassword(loginPass, seller.salt, seller.hash);
    if (isSellerValid) {
      if (seller.status === 'SUSPENDED') {
        return res.status(403).json({
          error: 'Your seller account has been suspended by administration.',
          reason: seller.suspendedReason || 'Administrative suspension',
        });
      }

      const sellerPayload = {
        id: seller.id,
        role: 'seller',
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
        status: seller.status,
      };

      const token = generateToken({
        id: seller.id,
        role: 'SELLER',
        name: seller.name,
        email: seller.email,
        businessName: seller.businessName,
      });

      recordAuditLog({
        userId: seller.id,
        userName: seller.businessName || seller.name,
        userRole: 'seller',
        action: 'Portal Sign-In',
        details: `Seller logged in successfully`,
      });

      const { salt, hash, ...safeSeller } = seller;
      return res.json({
        success: true,
        role: 'seller',
        userRole: 'seller',
        token,
        user: safeSeller,
        seller: safeSeller,
        redirectUrl: '/seller',
        message: `Welcome to Seller Dashboard, ${seller.businessName}`,
      });
    }
  }

  // 3. Check Customer Accounts
  const customer = (db.customers || []).find(
    (c) =>
      (c.email && c.email.toLowerCase() === loginId) ||
      (c.phone && c.phone.replace(/\D/g, '') === loginId.replace(/\D/g, ''))
  );

  if (customer && customer.salt && customer.hash) {
    const isCustValid = verifyPassword(loginPass, customer.salt, customer.hash);
    if (isCustValid) {
      customer.lastLoginAt = new Date().toISOString();
      saveDatabase(db);

      const token = generateToken({
        id: customer.id,
        role: 'CUSTOMER',
        name: customer.name,
        email: customer.email,
      });

      const { salt, hash, ...safeCustomer } = customer;
      return res.json({
        success: true,
        role: 'customer',
        userRole: 'customer',
        token,
        user: safeCustomer,
        customer: safeCustomer,
        redirectUrl: '/account',
        message: `Welcome back, ${customer.name}`,
      });
    }
  }

  return res.status(401).json({
    error: 'Invalid username/email or password. Please verify your credentials.',
  });
});

// GET /api/auth/me
app.get('/api/auth/me', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.adminUser });
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long' });
  }

  const db = loadDatabase();
  const adminIndex = db.admins.findIndex((a) => a.id === req.adminUser!.id);
  if (adminIndex === -1) {
    return res.status(404).json({ error: 'Admin account not found' });
  }

  const admin = db.admins[adminIndex];
  if (!verifyPassword(currentPassword, admin.salt, admin.hash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  const { salt, hash } = hashPassword(newPassword);
  admin.salt = salt;
  admin.hash = hash;
  saveDatabase(db);

  res.json({ message: 'Password updated securely' });
});

// ----------------- PRODUCTS APIS -----------------

// GET /api/products
app.get('/api/products', (req: Request, res: Response) => {
  const db = loadDatabase();
  const { q, category, newLaunch } = req.query;

  const suspendedSellerIds = new Set(
    (db.sellers || []).filter((s) => s.status === 'SUSPENDED').map((s) => s.id)
  );

  let filtered = (db.products || []).filter((p) => {
    // Hide products from suspended sellers
    if (p.sellerId && suspendedSellerIds.has(p.sellerId)) return false;
    // Hide products pending approval or rejected
    if (p.approvalStatus && p.approvalStatus !== 'APPROVED') return false;
    return true;
  });

  if (category && category !== 'all') {
    filtered = filtered.filter((p) => p.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (newLaunch === 'true') {
    filtered = filtered.filter((p) => p.isNewLaunch);
  }

  if (q && typeof q === 'string') {
    const search = q.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
    );
  }

  res.json(filtered);
});

// POST /api/products (Admin only)
app.post('/api/products', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    category,
    price,
    originalPrice,
    description,
    fabricDetails,
    image,
    images,
    isNewLaunch,
    inStock,
    sizes,
    colors,
    color,
    gsm,
    features,
    careInstructions,
    tags,
    stockCount,
    piecesAvailable,
    shippingCharge,
    gstApplicable,
    gstRate,
    hsnCode,
    taxInclusive,
    basePrice,
    gstAmount,
  } = req.body;

  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }

  const db = loadDatabase();
  const prodId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const autoProductLink = req.body.productLink || `${req.protocol}://${req.get('host')}/?product=${prodId}`;

  // Process 3-4 images gallery
  let processedImages: string[] = [];
  if (Array.isArray(images) && images.length > 0) {
    processedImages = images.filter((img) => typeof img === 'string' && img.trim().length > 0);
  } else if (image) {
    processedImages = [image];
  } else {
    processedImages = ['/src/assets/images/ziproo_product_tee_1790610656044.jpg'];
  }

  const primaryImage = image || processedImages[0] || '/src/assets/images/ziproo_product_tee_1790610656044.jpg';

  const numPrice = Number(price);
  const rate = gstRate !== undefined ? Number(gstRate) : (numPrice >= 1000 ? 12 : 5);
  const isTaxInc = taxInclusive !== undefined ? Boolean(taxInclusive) : true;
  let calcBasePrice = numPrice;
  let calcGstAmount = 0;
  if (rate > 0) {
    if (isTaxInc) {
      calcBasePrice = Math.round((numPrice / (1 + rate / 100)) * 100) / 100;
      calcGstAmount = Math.round((numPrice - calcBasePrice) * 100) / 100;
    } else {
      calcGstAmount = Math.round((numPrice * (rate / 100)) * 100) / 100;
    }
  }

  const newProduct: Product = {
    id: prodId,
    name: name.trim(),
    category,
    price: numPrice,
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    description: description || '',
    fabricDetails: fabricDetails || '',
    image: primaryImage,
    images: processedImages,
    isNewLaunch: Boolean(isNewLaunch),
    inStock: inStock !== undefined ? Boolean(inStock) : true,
    sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'],
    colors: Array.isArray(colors) ? colors : (color ? [color] : ['Deep Onyx Black']),
    color: color || (Array.isArray(colors) && colors[0]) || 'Deep Onyx Black',
    gsm: gsm || undefined,
    features: Array.isArray(features) ? features : (features ? [features] : []),
    careInstructions: careInstructions || 'Cold machine wash inside out. Do not tumble dry. Iron on reverse.',
    tags: Array.isArray(tags) ? tags : [],
    stockCount: stockCount !== undefined ? Number(stockCount) : 50,
    shippingCharge: shippingCharge !== undefined ? Number(shippingCharge) : 0,
    piecesAvailable: piecesAvailable !== undefined ? Number(piecesAvailable) : (stockCount !== undefined ? Number(stockCount) : 100),
    productLink: autoProductLink,
    gstApplicable: gstApplicable !== undefined ? Boolean(gstApplicable) : true,
    gstRate: rate,
    hsnCode: hsnCode ? String(hsnCode).trim() : '6109',
    taxInclusive: isTaxInc,
    basePrice: basePrice !== undefined ? Number(basePrice) : calcBasePrice,
    gstAmount: gstAmount !== undefined ? Number(gstAmount) : calcGstAmount,
    rating: 5.0,
    reviewsCount: 0,
    reviews: [],
    createdAt: new Date().toISOString(),
  };

  db.products.unshift(newProduct);
  saveDatabase(db);

  res.status(201).json(newProduct);
});

// PUT /api/products/:id (Admin only)
app.put('/api/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  const index = db.products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const current = db.products[index];
  const autoProductLink = req.body.productLink || current.productLink || `${req.protocol}://${req.get('host')}/?product=${current.id}`;

  let processedImages = current.images || [current.image];
  if (Array.isArray(req.body.images)) {
    processedImages = req.body.images.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
  }
  const primaryImage = req.body.image || (processedImages.length > 0 ? processedImages[0] : current.image);

  const numPrice = req.body.price !== undefined ? Number(req.body.price) : current.price;
  const rate = req.body.gstRate !== undefined ? Number(req.body.gstRate) : (current.gstRate ?? (numPrice >= 1000 ? 12 : 5));
  const isTaxInc = req.body.taxInclusive !== undefined ? Boolean(req.body.taxInclusive) : (current.taxInclusive ?? true);
  let calcBasePrice = numPrice;
  let calcGstAmount = 0;
  if (rate > 0) {
    if (isTaxInc) {
      calcBasePrice = Math.round((numPrice / (1 + rate / 100)) * 100) / 100;
      calcGstAmount = Math.round((numPrice - calcBasePrice) * 100) / 100;
    } else {
      calcGstAmount = Math.round((numPrice * (rate / 100)) * 100) / 100;
    }
  }

  const updated: Product = {
    ...current,
    ...req.body,
    id: current.id, // prevent id overwrite
    image: primaryImage,
    images: processedImages,
    price: numPrice,
    originalPrice: req.body.originalPrice !== undefined ? (req.body.originalPrice ? Number(req.body.originalPrice) : undefined) : current.originalPrice,
    inStock: req.body.inStock !== undefined ? Boolean(req.body.inStock) : current.inStock,
    stockCount: req.body.stockCount !== undefined ? Number(req.body.stockCount) : current.stockCount,
    shippingCharge: req.body.shippingCharge !== undefined ? Number(req.body.shippingCharge) : (current.shippingCharge ?? 0),
    piecesAvailable: req.body.piecesAvailable !== undefined ? Number(req.body.piecesAvailable) : (current.piecesAvailable ?? 100),
    colors: Array.isArray(req.body.colors) ? req.body.colors : current.colors,
    color: req.body.color !== undefined ? req.body.color : current.color,
    gsm: req.body.gsm !== undefined ? req.body.gsm : current.gsm,
    features: Array.isArray(req.body.features) ? req.body.features : current.features,
    careInstructions: req.body.careInstructions !== undefined ? req.body.careInstructions : current.careInstructions,
    tags: Array.isArray(req.body.tags) ? req.body.tags : current.tags,
    gstApplicable: req.body.gstApplicable !== undefined ? Boolean(req.body.gstApplicable) : (current.gstApplicable ?? true),
    gstRate: rate,
    hsnCode: req.body.hsnCode !== undefined ? String(req.body.hsnCode).trim() : (current.hsnCode || '6109'),
    taxInclusive: isTaxInc,
    basePrice: req.body.basePrice !== undefined ? Number(req.body.basePrice) : calcBasePrice,
    gstAmount: req.body.gstAmount !== undefined ? Number(req.body.gstAmount) : calcGstAmount,
    productLink: autoProductLink,
    updatedAt: new Date().toISOString(),
  };

  db.products[index] = updated;
  saveDatabase(db);

  res.json(updated);
});

// DELETE /api/products/:id (Admin only)
app.delete('/api/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  const initialLength = db.products.length;
  db.products = db.products.filter((p) => p.id !== id);

  if (db.products.length === initialLength) {
    return res.status(404).json({ error: 'Product not found' });
  }

  saveDatabase(db);
  res.json({ message: 'Product deleted successfully', id });
});

// POST /api/products/:id/reviews (Public customer feedback & rating submission)
app.post('/api/products/:id/reviews', (req: Request, res: Response) => {
  const { id } = req.params;
  const { customerName, rating, comment } = req.body;

  if (!customerName || !rating || !comment) {
    return res.status(400).json({ error: 'Customer name, star rating (1-5), and feedback comment are required' });
  }

  const parsedRating = Math.max(1, Math.min(5, Number(rating)));
  const db = loadDatabase();
  const product = db.products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const newReview: ProductReview = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    productId: id,
    customerName: customerName.trim(),
    rating: parsedRating,
    comment: comment.trim(),
    date: new Date().toISOString().split('T')[0],
    verifiedPurchase: true,
  };

  if (!product.reviews) {
    product.reviews = [];
  }

  product.reviews.unshift(newReview);
  product.reviewsCount = product.reviews.length;
  const totalStars = product.reviews.reduce((sum, r) => sum + r.rating, 0);
  product.rating = Number((totalStars / product.reviews.length).toFixed(1));

  saveDatabase(db);
  res.status(201).json({ review: newReview, product });
});

// ----------------- DAILY UPDATES APIS -----------------

// GET /api/updates
app.get('/api/updates', (_req: Request, res: Response) => {
  const db = loadDatabase();
  const sorted = [...db.updates].sort((a, b) => {
    const dateComp = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateComp !== 0) return dateComp;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  res.json(sorted);
});

// POST /api/updates (Admin only)
app.post('/api/updates', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, content, category, date } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const db = loadDatabase();
  const newUpdate: CompanyUpdate = {
    id: `upd_${Date.now()}`,
    title: title.trim(),
    content: content.trim(),
    category: category || 'Announcement',
    date: date || new Date().toISOString().split('T')[0],
    author: req.adminUser!.name,
    imageUrl: req.body.imageUrl || undefined,
    videoUrl: req.body.videoUrl || undefined,
    createdAt: new Date().toISOString(),
  };

  db.updates.unshift(newUpdate);
  saveDatabase(db);

  res.status(201).json(newUpdate);
});

// PUT /api/updates/:id (Admin only)
app.put('/api/updates/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  const index = db.updates.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Update not found' });
  }

  const current = db.updates[index];
  const updated: CompanyUpdate = {
    ...current,
    ...req.body,
    id: current.id,
    imageUrl: req.body.imageUrl !== undefined ? req.body.imageUrl : current.imageUrl,
    videoUrl: req.body.videoUrl !== undefined ? req.body.videoUrl : current.videoUrl,
    updatedAt: new Date().toISOString(),
  };

  db.updates[index] = updated;
  saveDatabase(db);

  res.json(updated);
});

// DELETE /api/updates/:id (Admin only)
app.delete('/api/updates/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  const initialLength = db.updates.length;
  db.updates = db.updates.filter((u) => u.id !== id);

  if (db.updates.length === initialLength) {
    return res.status(404).json({ error: 'Update not found' });
  }

  saveDatabase(db);
  res.json({ message: 'Update deleted successfully', id });
});

// ----------------- STORE SETTINGS APIS -----------------

// GET /api/settings
app.get('/api/settings', (_req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.settings);
});

// PUT /api/settings (Admin only)
app.put('/api/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  db.settings = {
    ...db.settings,
    ...req.body,
  };
  saveDatabase(db);
  res.json(db.settings);
});

// PUT /api/admin/portal-settings (Admin only - Online Amount Receiving Portal)
app.put('/api/admin/portal-settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  db.settings.onlineReceivingPortal = {
    ...db.settings.onlineReceivingPortal,
    ...req.body,
  };
  saveDatabase(db);
  res.json(db.settings.onlineReceivingPortal);
});

// ----------------- ORDERS APIS -----------------

// POST /api/orders (Customer checkout)
// Requirements:
// 1. Collect: customer full name, mobile number, email, complete delivery address, city, state, PIN code, and order details.
// 2. Email Notification to Admin: Send email to ziprooclothing@gmail.com with all customer and order details.
// 3. SMS Notification to Customer: Send SMS to customer's mobile number.
// 4. Important: Do not use fake notifications or pretend order was placed if backend fails. Confirm only after order is saved.
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const rawCustomer = req.body.customer || {};
    const rawShipping = rawCustomer.shippingAddress || req.body.shippingAddress || {};

    const customerName = (req.body.customerName || rawCustomer.name || '').trim();
    const mobileNumber = (req.body.mobileNumber || rawCustomer.phone || '').trim();
    const email = (req.body.email || rawCustomer.email || '').trim();
    const completeAddress = (req.body.completeAddress || rawShipping.address || rawCustomer.address || '').trim();
    const city = (req.body.city || rawShipping.city || rawCustomer.city || '').trim();
    const state = (req.body.state || rawShipping.state || rawCustomer.state || '').trim();
    const pinCode = (req.body.pinCode || rawShipping.pincode || rawShipping.pinCode || rawCustomer.pinCode || '').trim();

    const items = req.body.items;
    const paymentMethodRaw = (req.body.paymentMethod || 'cod').toString();
    const transactionReference = req.body.transactionReference;

    if (!customerName || !mobileNumber || !email || !completeAddress || !city || !state || !pinCode) {
      return res.status(400).json({
        error: 'Please fill in all required customer details: Name, Mobile Number, Email, Complete Address, City, State, and PIN code',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one apparel item' });
    }

    const db = loadDatabase();

    // SERVER-SIDE STOCK & PRICE VALIDATION (Prevents overselling & client tampering)
    const validatedItems: Order['items'] = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const dbProduct = db.products.find((p) => p.id === item.productId);
      if (!dbProduct) {
        return res.status(400).json({ error: `Product '${item.productName || item.productId}' not found in catalog` });
      }

      if (!dbProduct.inStock) {
        return res.status(400).json({ error: `"${dbProduct.name}" is currently sold out and out of stock.` });
      }

      const availableStock = dbProduct.stockCount !== undefined ? dbProduct.stockCount : (dbProduct.piecesAvailable ?? 50);
      const requestedQty = Number(item.quantity) || 1;

      if (availableStock < requestedQty) {
        return res.status(400).json({
          error: `Insufficient stock for "${dbProduct.name}". Only ${availableStock} pieces available (requested: ${requestedQty}).`,
        });
      }

      // Use authoritative server-side price
      const verifiedPrice = Number(dbProduct.price);
      calculatedSubtotal += verifiedPrice * requestedQty;

      const gstRate = dbProduct.gstApplicable !== false ? (dbProduct.gstRate !== undefined ? Number(dbProduct.gstRate) : (verifiedPrice >= 1000 ? 12 : 5)) : 0;
      const hsnCode = dbProduct.hsnCode || '6109';
      const taxInclusive = dbProduct.taxInclusive !== false;

      let itemBasePrice = verifiedPrice;
      let itemTaxAmount = 0;
      if (gstRate > 0) {
        if (taxInclusive) {
          itemBasePrice = Math.round((verifiedPrice / (1 + gstRate / 100)) * 100) / 100;
          itemTaxAmount = Math.round((verifiedPrice - itemBasePrice) * 100) / 100;
        } else {
          itemTaxAmount = Math.round((verifiedPrice * (gstRate / 100)) * 100) / 100;
        }
      }

      validatedItems.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        category: dbProduct.category,
        size: item.size || 'L',
        color: item.color || dbProduct.color || 'Deep Onyx Black',
        quantity: requestedQty,
        price: verifiedPrice,
        image: dbProduct.image,
        gstRate,
        hsnCode,
        basePrice: itemBasePrice,
        taxAmount: itemTaxAmount,
        sellerId: dbProduct.sellerId || 'ziproo_official',
        sellerName: dbProduct.sellerName || 'ZIPROO Official Atelier',
        fulfillmentStatus: 'PENDING',
      });
    }

    const subtotal = calculatedSubtotal;
    const shipping = subtotal >= db.settings.freeShippingThreshold ? 0 : 99; // ₹99 nominal shipping under threshold
    const totalAmount = subtotal + shipping;

    // Authoritative Order Tax Summary calculation
    const totalTax = Math.round(validatedItems.reduce((sum, it) => sum + (it.taxAmount || 0) * it.quantity, 0) * 100) / 100;
    const taxableAmount = Math.round(validatedItems.reduce((sum, it) => sum + (it.basePrice || it.price) * it.quantity, 0) * 100) / 100;
    const cgst = Math.round((totalTax / 2) * 100) / 100;
    const sgst = Math.round((totalTax - cgst) * 100) / 100;

    const taxSummary = {
      totalTax,
      taxableAmount,
      cgst,
      sgst,
    };

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ord_${Date.now()}`;
    const orderNumber = `ZIP-2026-${randomNum}`;
    const createdAt = new Date().toISOString();

    // Requirements:
    // For Cash on Delivery: customer places COD order -> order status = "Cash Pending" (or Pending)
    // For online payments: Payment Pending / Payment Processing
    const isCod = paymentMethodRaw.toLowerCase() === 'cod' || paymentMethodRaw.toLowerCase() === 'cash on delivery';
    const initialOrderStatus: OrderStatus = isCod ? 'Confirmed' : 'Processing';
    const initialPaymentStatus: PaymentStatus = isCod ? 'Cash Pending' : (transactionReference ? 'Payment Processing' : 'Payment Pending');

    // Normalize payment method label
    let normalizedPaymentMethod = 'cod';
    const pmLower = paymentMethodRaw.toLowerCase();
    if (pmLower.includes('gpay') || pmLower.includes('google')) normalizedPaymentMethod = 'gpay';
    else if (pmLower.includes('phonepe')) normalizedPaymentMethod = 'phonepe';
    else if (pmLower.includes('paytm')) normalizedPaymentMethod = 'paytm';
    else if (pmLower.includes('upi') || pmLower.includes('qr')) normalizedPaymentMethod = 'online_portal';
    else if (pmLower.includes('razorpay')) normalizedPaymentMethod = 'razorpay';
    else if (isCod) normalizedPaymentMethod = 'cod';
    else normalizedPaymentMethod = paymentMethodRaw;

    // Associate order with customer ID (from authenticated token or profile lookup)
    let customerId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.split(' ')[1]) as any;
      if (decoded && decoded.id) {
        customerId = decoded.id;
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = mobileNumber.trim();

    if (!customerId) {
      db.customers = db.customers || [];
      let cust = db.customers.find(
        (c) => (c.email && c.email.toLowerCase() === cleanEmail) || (c.phone && c.phone === cleanPhone)
      );

      if (!cust) {
        cust = {
          id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: customerName.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          address: completeAddress.trim(),
          city: city.trim(),
          state: state.trim(),
          pinCode: pinCode.trim(),
          location: city ? `${city.trim()}, ${state.trim()}` : '',
          registeredAt: createdAt,
          lastLoginAt: createdAt,
          totalOrders: 1,
        };
        db.customers.unshift(cust);
      } else {
        cust.totalOrders = (cust.totalOrders || 0) + 1;
        cust.lastLoginAt = createdAt;
      }
      customerId = cust.id;
    }

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId,
      customerName: customerName.trim(),
      mobileNumber: mobileNumber.trim(),
      email: email.trim(),
      completeAddress: completeAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      items: validatedItems,
      subtotal,
      shipping,
      totalAmount,
      taxSummary,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: initialPaymentStatus,
      transactionReference: transactionReference ? String(transactionReference).trim() : undefined,
      orderStatus: initialOrderStatus,
      createdAt,
      notificationLog: {
        adminEmailSent: false,
        adminEmailRecipient: db.settings.adminNotificationEmail || 'ziprooclothing@gmail.com',
        customerEmailSent: false,
        customerEmailRecipient: email.trim(),
        customerSmsSent: false,
        customerSmsRecipient: mobileNumber.trim(),
        statusHistory: [
          {
            status: initialOrderStatus,
            timestamp: createdAt,
            notificationSent: true,
            note: isCod
              ? 'Cash on Delivery order placed and confirmed in atelier system'
              : 'Prepaid order placed with transaction details, pending verification',
          },
        ],
        emailAuditLog: [],
      },
    };

    // Safely reduce inventory stock for ordered garments in the database
    for (const ordItem of validatedItems) {
      const prod = db.products.find((p) => p.id === ordItem.productId);
      if (prod) {
        if (prod.stockCount !== undefined) {
          prod.stockCount = Math.max(0, prod.stockCount - ordItem.quantity);
        }
        if (prod.piecesAvailable !== undefined) {
          prod.piecesAvailable = Math.max(0, prod.piecesAvailable - ordItem.quantity);
        }
        if (prod.stockCount !== undefined && prod.stockCount <= 0) {
          prod.inStock = false;
        }
      }
    }

    // Save order in database first
    db.orders.unshift(newOrder);
    saveDatabase(db);

    // 1. Dispatch Automatic Email Notification to Customer
    try {
      await sendCustomerOrderEmail(newOrder, 'order_confirmed');
    } catch (err: any) {
      console.error('[ZIPROO] Customer email dispatch failed:', err);
    }

    // 2. Dispatch Email Notification to Admin (ziproo2026@gmail.com and admin email)
    try {
      const emailResult = await sendAdminOrderEmail(newOrder, db.settings);
      newOrder.notificationLog.adminEmailSent = emailResult.success;
      newOrder.notificationLog.adminEmailTimestamp = new Date().toISOString();
      if (emailResult.error) {
        newOrder.notificationLog.adminEmailError = emailResult.error;
      }
    } catch (err: any) {
      console.error('[ZIPROO] Admin email dispatch failed:', err);
      newOrder.notificationLog.adminEmailError = err.message || String(err);
    }

    // 3. SMS Notification (only when MSG91 SMS key is configured; otherwise email only)
    const msg91Config = getMsg91Config();
    if (msg91Config.isAvailable) {
      try {
        const smsResult = await sendCustomerOrderSms(newOrder);
        newOrder.notificationLog.customerSmsSent = smsResult.success;
        newOrder.notificationLog.customerSmsTimestamp = new Date().toISOString();
        newOrder.notificationLog.customerSmsContent = smsResult.smsContent;
        if (smsResult.error) {
          newOrder.notificationLog.customerSmsError = smsResult.error;
        }
      } catch (err: any) {
        console.error('[ZIPROO] Customer SMS dispatch failed:', err);
        newOrder.notificationLog.customerSmsError = err.message || String(err);
      }
    }

    // 4. Dispatch Individual Seller Notification Emails (Part 7: ONLY their products, never other sellers' data)
    const sellerItemMap = new Map<string, OrderItem[]>();
    for (const ordItem of newOrder.items) {
      const sId = ordItem.sellerId || 'ziproo_official';
      if (sId && sId !== 'ziproo_official') {
        if (!sellerItemMap.has(sId)) {
          sellerItemMap.set(sId, []);
        }
        sellerItemMap.get(sId)!.push(ordItem);
      }
    }

    for (const [sId, sItems] of sellerItemMap.entries()) {
      const seller = (db.sellers || []).find((s) => s.id === sId);
      if (seller && seller.email && seller.emailNotificationsEnabled !== false) {
        sendSellerOrderEmail({
          seller,
          order: newOrder,
          sellerItems: sItems,
        }).catch((err) => {
          console.warn(`[ZIPROO] Failed to dispatch seller order email to ${seller.email}:`, err);
        });
      }
    }

    // Save final order with notification delivery records
    saveDatabase(db);

    return res.status(201).json({
      success: true,
      message: 'Order received and verified successfully',
      order: newOrder,
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    return res.status(500).json({ error: 'Backend error: Could not process order. Please try again.' });
  }
});

// GET /api/orders (Admin only - Secured)
app.get('/api/orders', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  res.json(db.orders);
});

// PUT /api/orders/:id/status (Admin only - Updates status and notifies customer)
app.put('/api/orders/:id/status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { orderStatus, paymentStatus, note, trackingInfo } = req.body;

  const db = loadDatabase();
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const previousStatus = order.orderStatus;

  if (orderStatus) {
    order.orderStatus = orderStatus as OrderStatus;
  }
  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  }
  if (trackingInfo) {
    order.trackingInfo = {
      ...(order.trackingInfo || {}),
      ...trackingInfo,
    };
  }

  // Send status change notification if status changed
  if (orderStatus && orderStatus !== previousStatus) {
    try {
      await sendCustomerStatusUpdate(order, order.orderStatus, note);
      if (!order.notificationLog.statusHistory) {
        order.notificationLog.statusHistory = [];
      }
      order.notificationLog.statusHistory.push({
        status: order.orderStatus,
        timestamp: new Date().toISOString(),
        notificationSent: true,
        note: note || `Status changed from ${previousStatus} to ${order.orderStatus}`,
      });
    } catch (err) {
      console.error('Status update notification failed:', err);
    }
  }

  saveDatabase(db);
  res.json({ success: true, order });
});

// PUT /api/orders/:id/verify-payment (Admin only - Verifies prepaid payment)
app.put('/api/orders/:id/verify-payment', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.paymentStatus = 'Paid';
  if (order.orderStatus === 'Processing' || (order.orderStatus as string) === 'Pending') {
    order.orderStatus = 'Order Confirmed';
  }

  order.notificationLog = order.notificationLog || {
    adminEmailSent: false,
    adminEmailRecipient: db.settings.adminNotificationEmail || 'ziprooclothing@gmail.com',
    customerSmsSent: false,
    customerSmsRecipient: order.mobileNumber,
  };
  order.notificationLog.statusHistory = order.notificationLog.statusHistory || [];
  order.notificationLog.statusHistory.push({
    status: order.orderStatus,
    timestamp: new Date().toISOString(),
    notificationSent: true,
    note: 'Payment verified and authenticated by atelier administrator',
  });

  try {
    await sendCustomerOrderEmail(order, 'payment_successful', 'Your online transaction has been verified.');
  } catch (err) {
    console.error('Payment verification email error:', err);
  }

  saveDatabase(db);
  res.json({ success: true, message: 'Payment marked as Verified and customer notified', order });
});

// PUT /api/orders/:id/collect-cod (Admin only - Marks COD as collected)
app.put('/api/orders/:id/collect-cod', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.paymentStatus = 'Paid';
  order.notificationLog = order.notificationLog || {
    adminEmailSent: false,
    adminEmailRecipient: db.settings.adminNotificationEmail || 'ziprooclothing@gmail.com',
    customerSmsSent: false,
    customerSmsRecipient: order.mobileNumber,
  };
  order.notificationLog.statusHistory = order.notificationLog.statusHistory || [];
  order.notificationLog.statusHistory.push({
    status: order.orderStatus,
    timestamp: new Date().toISOString(),
    notificationSent: true,
    note: 'Cash on delivery payment successfully received and collected upon arrival',
  });

  try {
    await sendCustomerOrderEmail(order, 'payment_successful', 'Cash payment collected upon delivery.');
  } catch (err) {
    console.error('COD payment collection email error:', err);
  }

  saveDatabase(db);
  res.json({ success: true, message: 'COD payment marked as Collected & Paid', order });
});

// POST /api/orders/:id/resend-email (Admin only - Retries sending email to customer)
app.post('/api/orders/:id/resend-email', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { event, note } = req.body;

  const db = loadDatabase();
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Determine appropriate event if not specified
  let targetEvent: EmailEvent = event || 'order_confirmed';
  if (!event) {
    const s = order.orderStatus.toLowerCase();
    if (s.includes('shipped')) targetEvent = 'order_shipped';
    else if (s.includes('out for delivery') || s.includes('out_for_delivery')) targetEvent = 'out_for_delivery';
    else if (s.includes('delivered')) targetEvent = 'order_delivered';
    else if (s.includes('cancelled')) targetEvent = 'order_cancelled';
    else if (order.paymentStatus === 'Paid') targetEvent = 'payment_successful';
    else targetEvent = 'order_confirmed';
  }

  const result = await sendCustomerOrderEmail(order, targetEvent, note, true);
  saveDatabase(db);

  res.json({
    success: result.success,
    message: result.success ? `Email successfully resent to ${order.email}` : `Failed to resend email: ${result.error}`,
    order,
    error: result.error,
  });
});

// POST /api/admin/test-brevo-email (Admin only - Tests Brevo transactional email)
app.post('/api/admin/test-brevo-email', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { toEmail } = req.body;
  const targetEmail = (toEmail && String(toEmail).trim()) || 'ziproo2026@gmail.com';
  const result = await testBrevoEmailIntegration(targetEmail);
  res.json(result);
});

// GET /api/admin/brevo-status (Admin only - Checks if Brevo API key is loaded server-side)
app.get('/api/admin/brevo-status', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const hasKey = Boolean(process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim().length > 0);
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'ziproo2026@gmail.com';
  res.json({
    configured: hasKey,
    senderEmail,
    adminNotificationEmail: 'ziproo2026@gmail.com',
  });
});

// POST /api/admin/test-msg91-sms (Admin only - Tests MSG91 SMS gateway integration)
app.post('/api/admin/test-msg91-sms', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { mobileNumber } = req.body;
  const targetMobile = (mobileNumber && String(mobileNumber).trim()) || '9876543210';
  const result = await testMsg91SmsIntegration(targetMobile);
  res.json(result);
});

// GET /api/admin/msg91-status (Admin only - Checks if MSG91 API key is loaded server-side)
app.get('/api/admin/msg91-status', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const { isAvailable, templateId, senderId } = getMsg91Config();
  res.json({
    configured: isAvailable,
    templateConfigured: Boolean(templateId),
    senderId,
  });
});

// ----------------- CUSTOMER ORDER TRACKING API -----------------

// POST /api/orders/track
// Allows customers to check their order progress safely using Order Number and Mobile/Email verification
app.post('/api/orders/track', (req: Request, res: Response) => {
  const { orderNumber, verification } = req.body;
  if (!orderNumber || !verification) {
    return res.status(400).json({ error: 'Order Number and registered mobile number or email are required' });
  }

  const cleanOrderNum = String(orderNumber).trim().replace(/^#/, '').toUpperCase();
  const cleanVerif = String(verification).trim().toLowerCase().replace(/[^a-z0-9@.]/g, '');

  const db = loadDatabase();
  const order = db.orders.find((o) => {
    const oNum = o.orderNumber.replace(/^#/, '').toUpperCase();
    return oNum === cleanOrderNum || o.id === orderNumber;
  });

  if (!order) {
    return res.status(404).json({ error: 'No order found with this Order ID. Please check and try again.' });
  }

  // Verification matching: mobile number or email
  const cleanOrderMobile = order.mobileNumber.replace(/[^0-9]/g, '');
  const cleanVerifDigits = cleanVerif.replace(/[^0-9]/g, '');
  const mobileMatch = cleanVerifDigits.length >= 6 && cleanOrderMobile.includes(cleanVerifDigits);
  const emailMatch = cleanVerif.includes('@') && order.email.toLowerCase() === cleanVerif;

  if (!mobileMatch && !emailMatch) {
    return res.status(403).json({
      error: 'Security verification failed: Mobile number or email does not match this order.',
    });
  }

  // Safe tracking payload: never leaks other customers or raw credentials
  const statusSteps = [
    { key: 'received', label: 'Order Received', completed: true, timestamp: order.createdAt },
    { key: 'confirmed', label: 'Confirmed', completed: ['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(order.orderStatus) },
    { key: 'processing', label: 'Tailoring & Quality Check', completed: ['Processing', 'Shipped', 'Delivered'].includes(order.orderStatus) },
    { key: 'shipped', label: 'Dispatched & In Transit', completed: ['Shipped', 'Delivered'].includes(order.orderStatus) },
    { key: 'delivered', label: 'Delivered', completed: order.orderStatus === 'Delivered' },
  ];

  return res.json({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    city: order.city,
    state: order.state,
    items: order.items.map((i) => ({
      productName: i.productName,
      category: i.category,
      size: i.size,
      quantity: i.quantity,
      price: i.price,
      image: i.image,
    })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    totalAmount: order.totalAmount,
    steps: statusSteps,
    statusHistory: order.notificationLog?.statusHistory || [],
  });
});

// ----------------- RAZORPAY PAYMENT GATEWAY APIS -----------------

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// POST /api/payment/razorpay/create-order
app.post('/api/payment/razorpay/create-order', async (req: Request, res: Response) => {
  const { amount, receipt, notes } = req.body;
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid amount in INR is required' });
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return res.status(200).json({
      configured: false,
      message: 'Razorpay credentials not yet configured in server environment. Online Receiving Portal (UPI) or Cash on Delivery can be used.',
    });
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // amount in paise
        currency: 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {},
      }),
    });

    const data = await razorpayRes.json();
    if (!razorpayRes.ok) {
      throw new Error(data.error?.description || 'Failed to create Razorpay order');
    }

    return res.json({
      configured: true,
      order: data,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error('Razorpay order creation error:', err);
    return res.status(500).json({ error: err.message || 'Razorpay order creation failed' });
  }
});

// POST /api/payment/razorpay/verify
app.post('/api/payment/razorpay/verify', (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing Razorpay signature verification parameters' });
  }

  if (!RAZORPAY_KEY_SECRET) {
    return res.status(400).json({ error: 'Razorpay secret key not configured on server' });
  }

  const generatedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const isSignatureValid = generatedSignature === razorpay_signature;

  if (!isSignatureValid) {
    return res.status(400).json({ error: 'Invalid Razorpay signature. Payment verification failed.' });
  }

  // Update order payment status in database if orderId provided
  if (orderId) {
    const db = loadDatabase();
    const order = db.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (order) {
      order.paymentStatus = 'Paid';
      order.transactionReference = razorpay_payment_id;
      saveDatabase(db);
    }
  }

  return res.json({
    success: true,
    verified: true,
    paymentId: razorpay_payment_id,
    message: 'Payment verified successfully via Razorpay HMAC signature',
  });
});

// POST /api/payment/razorpay/failed
app.post('/api/payment/razorpay/failed', (req: Request, res: Response) => {
  const { orderId, errorDetails } = req.body;
  console.warn(`[ZIPROO RAZORPAY FAILED] Order: ${orderId}. Details:`, errorDetails);
  res.json({ recorded: true, status: 'Payment cancelled or failed' });
});

// ----------------- IMAGE UPLOAD API -----------------

// POST /api/upload (Admin only)
app.post('/api/upload', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { dataUrl, filename } = req.body;
  if (!dataUrl) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  try {
    const matches = dataUrl.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }

    const ext = matches[1].replace('jpeg', 'jpg');
    const base64Data = matches[2];
    const cleanName = filename ? filename.replace(/[^a-zA-Z0-9_-]/g, '_') : 'upload';
    const newFilename = `${cleanName}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, newFilename);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    res.json({
      url: `/uploads/${newFilename}`,
      filename: newFilename,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process image upload' });
  }
});

// POST /api/upload-media (Admin only - Image or Video file)
app.post('/api/upload-media', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { dataUrl, filename } = req.body;
  if (!dataUrl) {
    return res.status(400).json({ error: 'No media file data provided' });
  }

  try {
    const matches = dataUrl.match(/^data:([a-zA-Z0-9_\-\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 media data' });
    }

    const mime = matches[1];
    let ext = 'mp4';
    if (mime.includes('webm')) ext = 'webm';
    else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
    else if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('mp4')) ext = 'mp4';
    else if (mime.includes('mov')) ext = 'mov';
    else if (mime.includes('ogg')) ext = 'ogg';

    const base64Data = matches[2];
    const cleanName = filename ? filename.replace(/[^a-zA-Z0-9_-]/g, '_') : 'media';
    const newFilename = `${cleanName}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, newFilename);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    res.json({
      url: `/uploads/${newFilename}`,
      filename: newFilename,
      mimeType: mime,
    });
  } catch (err: any) {
    console.error('Media upload error:', err);
    res.status(500).json({ error: 'Failed to process media upload' });
  }
});

// ----------------- CUSTOMER REGISTRATION & LOGIN APIS -----------------

// POST /api/customers/login-register
app.post('/api/customers/login-register', (req: Request, res: Response) => {
  const { name, email, phone, address, city, state, pinCode, location } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Phone number are required' });
  }

  const db = loadDatabase();
  db.customers = db.customers || [];

  const cleanPhone = phone.trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  let customer = db.customers.find(
    (c) => c.phone === cleanPhone || (cleanEmail && c.email.toLowerCase() === cleanEmail)
  );

  const now = new Date().toISOString();

  if (customer) {
    customer.name = name.trim();
    if (cleanEmail) customer.email = cleanEmail;
    if (address) customer.address = address.trim();
    if (city) customer.city = city.trim();
    if (state) customer.state = state.trim();
    if (pinCode) customer.pinCode = pinCode.trim();
    if (location) customer.location = location.trim();
    customer.lastLoginAt = now;
  } else {
    customer = {
      id: `cust_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail || `${cleanPhone.replace(/\D/g, '')}@ziproo-customer.com`,
      phone: cleanPhone,
      address: address ? address.trim() : '',
      city: city ? city.trim() : '',
      state: state ? state.trim() : '',
      pinCode: pinCode ? pinCode.trim() : '',
      location: location ? location.trim() : (city ? `${city}, ${state}` : ''),
      registeredAt: now,
      lastLoginAt: now,
      totalOrders: 0,
    };
    db.customers.unshift(customer);
  }

  saveDatabase(db);

  const tokenPayload = {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    role: 'customer',
  };
  const token = generateToken(tokenPayload as any);

  res.json({ success: true, customer, token });
});

// POST /api/customers/auth/login
// Customers log in securely using their email address and optional password
app.post('/api/customers/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = loadDatabase();
  db.customers = db.customers || [];

  let customer = db.customers.find((c) => c.email.toLowerCase() === cleanEmail);

  if (!customer) {
    // If not found in customers table, check if they have existing orders placed with this email
    const existingOrder = db.orders.find((o) => o.email.toLowerCase() === cleanEmail);
    if (existingOrder) {
      customer = {
        id: `cust_${Date.now()}`,
        name: existingOrder.customerName,
        email: cleanEmail,
        phone: existingOrder.mobileNumber,
        address: existingOrder.completeAddress,
        city: existingOrder.city,
        state: existingOrder.state,
        pinCode: existingOrder.pinCode,
        location: `${existingOrder.city}, ${existingOrder.state}`,
        registeredAt: existingOrder.createdAt,
        lastLoginAt: new Date().toISOString(),
        totalOrders: 1,
      };
      db.customers.unshift(customer);
      saveDatabase(db);
    } else {
      return res.status(404).json({
        error: `No customer profile found for ${cleanEmail}. Please register or place an order first.`,
      });
    }
  }

  // Password verification if customer set a password
  if (customer.hash && customer.salt && password) {
    const isValid = verifyPassword(password, customer.salt, customer.hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password. Please verify and try again.' });
    }
  }

  customer.lastLoginAt = new Date().toISOString();
  saveDatabase(db);

  // Generate safe customer token
  const tokenPayload = {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    role: 'customer',
  };
  const token = generateToken(tokenPayload as any);

  res.json({
    success: true,
    message: `Welcome to ZIPROO, ${customer.name}`,
    customer,
    token,
  });
});

// POST /api/customers/auth/register
app.post('/api/customers/auth/register', (req: Request, res: Response) => {
  const { name, email, phone, address, city, state, pinCode, location, password } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Full name, email address, and phone number are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();

  const db = loadDatabase();
  db.customers = db.customers || [];

  let existing = db.customers.find(
    (c) => c.email.toLowerCase() === cleanEmail || c.phone === cleanPhone
  );

  const now = new Date().toISOString();
  let salt: string | undefined;
  let hash: string | undefined;

  if (password && password.trim().length >= 6) {
    const hashed = hashPassword(password.trim());
    salt = hashed.salt;
    hash = hashed.hash;
  }

  if (existing) {
    existing.name = name.trim();
    existing.email = cleanEmail;
    existing.phone = cleanPhone;
    if (address) existing.address = address.trim();
    if (city) existing.city = city.trim();
    if (state) existing.state = state.trim();
    if (pinCode) existing.pinCode = pinCode.trim();
    if (location) existing.location = location.trim();
    if (salt && hash) {
      existing.salt = salt;
      existing.hash = hash;
    }
    existing.lastLoginAt = now;
  } else {
    existing = {
      id: `cust_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      address: address ? address.trim() : '',
      city: city ? city.trim() : '',
      state: state ? state.trim() : '',
      pinCode: pinCode ? pinCode.trim() : '',
      location: location ? location.trim() : (city ? `${city}, ${state}` : ''),
      registeredAt: now,
      lastLoginAt: now,
      totalOrders: 0,
      salt,
      hash,
    };
    db.customers.unshift(existing);
  }

  saveDatabase(db);

  const tokenPayload = {
    id: existing.id,
    email: existing.email,
    name: existing.name,
    role: 'customer',
  };
  const token = generateToken(tokenPayload as any);

  res.status(201).json({
    success: true,
    message: 'Customer account created successfully',
    customer: existing,
    token,
  });
});

// GET /api/customers/orders
// Customer Portal Orders: Returns orders strictly belonging to the authenticated customer
app.get('/api/customers/orders', requireCustomer, (req: AuthenticatedCustomerRequest, res: Response) => {
  const customer = req.customer!;
  const customerId = customer.id;
  const cleanEmail = customer.email ? customer.email.trim().toLowerCase() : '';
  const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, '') : '';

  const db = loadDatabase();
  const allOrders = db.orders || [];

  // Strictly filter orders belonging ONLY to this authenticated customer
  const customerOrders = allOrders.filter((o) => {
    // 1. Direct verified customerId ownership
    if (o.customerId && o.customerId === customerId) return true;

    // 2. Verified email ownership (non-placeholder)
    if (cleanEmail && !cleanEmail.includes('@ziproo-customer.com') && o.email && o.email.trim().toLowerCase() === cleanEmail) {
      o.customerId = customerId;
      return true;
    }

    // 3. Verified phone number match (10+ digits)
    if (cleanPhone && cleanPhone.length >= 10 && o.mobileNumber) {
      const oPhone = o.mobileNumber.replace(/\D/g, '');
      if (oPhone === cleanPhone || (cleanPhone.length >= 10 && oPhone.endsWith(cleanPhone))) {
        o.customerId = customerId;
        return true;
      }
    }

    return false;
  });

  // Ensure all items have color property populated
  for (const ord of customerOrders) {
    for (const item of ord.items) {
      if (!item.color) {
        const prod = db.products.find((p) => p.id === item.productId);
        item.color = prod?.color || 'Deep Onyx Black';
      }
    }
  }

  // Sort descending by creation date
  customerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    customerId,
    total: customerOrders.length,
    orders: customerOrders,
  });
});

// GET /api/customers/orders/:orderId
// Customer Order Details: Verifies that the authenticated customer owns this order before returning
app.get('/api/customers/orders/:orderId', requireCustomer, (req: AuthenticatedCustomerRequest, res: Response) => {
  const customer = req.customer!;
  const { orderId } = req.params;

  const db = loadDatabase();
  const cleanOrderId = (orderId || '').trim().toUpperCase();

  const order = (db.orders || []).find(
    (o) =>
      o.id === orderId ||
      o.orderNumber.toUpperCase() === cleanOrderId ||
      o.orderNumber.replace(/^#/, '').toUpperCase() === cleanOrderId.replace(/^#/, '')
  );

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Verify ownership: customerId, verified email, or verified phone
  const cleanEmail = customer.email ? customer.email.trim().toLowerCase() : '';
  const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, '') : '';
  const oPhone = (order.mobileNumber || '').replace(/\D/g, '');

  const isOwner =
    (order.customerId && order.customerId === customer.id) ||
    (cleanEmail && !cleanEmail.includes('@ziproo-customer.com') && order.email && order.email.trim().toLowerCase() === cleanEmail) ||
    (cleanPhone && cleanPhone.length >= 10 && (oPhone === cleanPhone || oPhone.endsWith(cleanPhone)));

  if (!isOwner) {
    return res.status(403).json({
      error: 'Forbidden: You do not have permission to access this order.',
      code: 'FORBIDDEN'
    });
  }

  res.json({
    success: true,
    order,
  });
});

// GET /api/admin/customers (Admin only - Customer particulars registered in one page visible to admin only)
app.get('/api/admin/customers', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  const customers = db.customers || [];
  const customersWithOrders = customers.map((c) => {
    const cleanP = c.phone.replace(/\D/g, '');
    const orderCount = db.orders.filter(
      (o) => (cleanP && o.mobileNumber.replace(/\D/g, '').includes(cleanP)) ||
             (c.email && o.email.toLowerCase() === c.email.toLowerCase())
    ).length;
    return {
      ...c,
      totalOrders: Math.max(c.totalOrders || 0, orderCount),
    };
  });
  res.json(customersWithOrders);
});

// ----------------- ATELIER MESSAGES APIS -----------------

// POST /api/messages (Public customer messages to atelier)
app.post('/api/messages', (req: Request, res: Response) => {
  const { name, email, phone, location, subject, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'Customer name and message are required' });
  }

  const db = loadDatabase();
  db.messages = db.messages || [];

  const newMessage: CustomerMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    name: name.trim(),
    email: (email || '').trim(),
    phone: (phone || '').trim(),
    location: (location || '').trim(),
    subject: (subject || 'Atelier Inquiry').trim(),
    message: message.trim(),
    createdAt: new Date().toISOString(),
    status: 'unread',
  };

  db.messages.unshift(newMessage);
  saveDatabase(db);

  res.status(201).json({ success: true, message: newMessage });
});

// GET /api/admin/messages (Admin only - messages to atelier in one separate page seen by admin only)
app.get('/api/admin/messages', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  res.json(db.messages || []);
});

// PUT /api/admin/messages/:id/status (Admin only)
app.put('/api/admin/messages/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = loadDatabase();
  db.messages = db.messages || [];
  const msg = db.messages.find((m) => m.id === id);
  if (!msg) {
    return res.status(404).json({ error: 'Message not found' });
  }
  msg.status = status;
  saveDatabase(db);
  res.json(msg);
});

// DELETE /api/admin/messages/:id (Admin only)
app.delete('/api/admin/messages/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  db.messages = (db.messages || []).filter((m) => m.id !== id);
  saveDatabase(db);
  res.json({ success: true, id });
});

// ----------------- ADMIN MANAGEMENT APIS -----------------

// POST /api/admin/admins (Create Admin account)
app.post('/api/admin/admins', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, username, email, password, role, status } = req.body;
  const userIdentifier = (email || username || '').trim().toLowerCase();

  if (!name || !userIdentifier || !password) {
    return res.status(400).json({ error: 'Name, Username/Email, and Password are required' });
  }

  const db = loadDatabase();
  const cleanEmail = email ? email.trim().toLowerCase() : (userIdentifier.includes('@') ? userIdentifier : undefined);
  const cleanUsername = username ? username.trim().toLowerCase() : userIdentifier.split('@')[0];

  const existing = db.admins.find(
    (a) =>
      a.username.toLowerCase() === cleanUsername ||
      (cleanEmail && a.email && a.email.toLowerCase() === cleanEmail)
  );

  if (existing) {
    return res.status(400).json({ error: `An administrator with identifier '${userIdentifier}' already exists.` });
  }

  const hashed = hashPassword(password.trim());
  const newAdminId = `usr_admin_${Date.now()}`;
  const newAdmin: StoredAdmin = {
    id: newAdminId,
    username: cleanUsername,
    email: cleanEmail,
    name: name.trim(),
    role: role || 'admin',
    status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    salt: hashed.salt,
    hash: hashed.hash,
    createdAt: new Date().toISOString(),
    lastLogin: undefined,
  };

  db.admins.push(newAdmin);
  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'Admin Created',
    details: `Created admin "${newAdmin.name}" (${newAdmin.username}) with status ${newAdmin.status}`,
    relatedId: newAdmin.id,
  });

  const { salt, hash, ...safeAdmin } = newAdmin;
  res.status(201).json({
    success: true,
    message: 'Admin account created successfully',
    admin: safeAdmin,
  });
});

// Legacy Alias for create-admin
app.post('/api/admin/create-admin', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { username, name, role, password, email, status } = req.body;
  const userIdentifier = (email || username || '').trim().toLowerCase();
  if (!name || !userIdentifier || !password) {
    return res.status(400).json({ error: 'Name, Username, and Password are required' });
  }

  const db = loadDatabase();
  const cleanUsername = username ? username.trim().toLowerCase() : userIdentifier.split('@')[0];
  const cleanEmail = email ? email.trim().toLowerCase() : (userIdentifier.includes('@') ? userIdentifier : undefined);

  const existing = db.admins.find((a) => a.username.toLowerCase() === cleanUsername || (cleanEmail && a.email && a.email.toLowerCase() === cleanEmail));
  if (existing) {
    return res.status(400).json({ error: `An administrator with identifier '${userIdentifier}' already exists.` });
  }

  const hashed = hashPassword(password.trim());
  const newAdminId = `usr_admin_${Date.now()}`;
  const newAdmin: StoredAdmin = {
    id: newAdminId,
    username: cleanUsername,
    email: cleanEmail,
    name: name.trim(),
    role: role || 'admin',
    status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    salt: hashed.salt,
    hash: hashed.hash,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  db.admins.push(newAdmin);
  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'Admin Created',
    details: `Created admin account ${newAdmin.name}`,
    relatedId: newAdmin.id,
  });

  const { salt, hash, ...safeAdmin } = newAdmin;
  res.status(201).json({ success: true, admin: safeAdmin });
});

// GET /api/admin/admins (List all admins without password hashes)
app.get('/api/admin/admins', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  const safeAdmins = db.admins.map((a) => ({
    id: a.id,
    username: a.username,
    email: a.email,
    name: a.name,
    role: a.role,
    status: a.status || 'ACTIVE',
    lastLogin: a.lastLogin,
    createdAt: a.createdAt,
    isAdmin1: a.id === 'usr_admin_1' || a.username === 'rohithsharma',
  }));
  res.json({ success: true, admins: safeAdmins });
});

// PUT /api/admin/admins/:id (Edit Admin details)
app.put('/api/admin/admins/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, username, role, status } = req.body;
  const db = loadDatabase();

  const admin = db.admins.find((a) => a.id === id);
  if (!admin) {
    return res.status(404).json({ error: 'Admin account not found' });
  }

  if (name) admin.name = name.trim();
  if (email) admin.email = email.trim().toLowerCase();
  if (username) admin.username = username.trim().toLowerCase();
  if (role) admin.role = role.trim();
  if (status && ['ACTIVE', 'INACTIVE'].includes(status)) {
    admin.status = status;
  }

  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'Admin Updated',
    details: `Updated admin profile for "${admin.name}"`,
    relatedId: admin.id,
  });

  const { salt, hash, ...safeAdmin } = admin;
  res.json({ success: true, message: 'Admin updated successfully', admin: safeAdmin });
});

// PUT /api/admin/admins/:id/status (Activate / Deactivate Admin)
app.put('/api/admin/admins/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
    return res.status(400).json({ error: "Status must be 'ACTIVE' or 'INACTIVE'" });
  }

  if (id === 'usr_admin_1') {
    return res.status(400).json({ error: 'Cannot deactivate primary Super Admin account.' });
  }

  const db = loadDatabase();
  const admin = db.admins.find((a) => a.id === id);
  if (!admin) {
    return res.status(404).json({ error: 'Admin account not found' });
  }

  admin.status = status;
  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: status === 'ACTIVE' ? 'Admin Activated' : 'Admin Deactivated',
    details: `${status === 'ACTIVE' ? 'Activated' : 'Deactivated'} admin account for ${admin.name}`,
    relatedId: admin.id,
  });

  const { salt, hash, ...safeAdmin } = admin;
  res.json({ success: true, admin: safeAdmin, message: `Admin account marked ${status}` });
});

// POST /api/admin/admins/:id/reset-password (Secure password reset)
app.post('/api/admin/admins/:id/reset-password', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.trim().length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const db = loadDatabase();
  const admin = db.admins.find((a) => a.id === id);
  if (!admin) {
    return res.status(404).json({ error: 'Admin account not found' });
  }

  const hashed = hashPassword(newPassword.trim());
  admin.salt = hashed.salt;
  admin.hash = hashed.hash;
  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'Admin Password Reset',
    details: `Password reset for admin "${admin.name}"`,
    relatedId: admin.id,
  });

  res.json({ success: true, message: `Password for administrator "${admin.name}" has been securely updated.` });
});

// DELETE /api/admin/admins/:id (Remove an Admin)
app.delete('/api/admin/admins/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (id === 'usr_admin_1') {
    return res.status(400).json({ error: 'Cannot delete primary Super Admin account.' });
  }

  const db = loadDatabase();
  const adminToDelete = db.admins.find((a) => a.id === id);
  if (!adminToDelete) {
    return res.status(404).json({ error: 'Admin account not found' });
  }

  db.admins = db.admins.filter((a) => a.id !== id);
  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'Admin Removed',
    details: `Removed admin account "${adminToDelete.name}" (${adminToDelete.username})`,
    relatedId: id,
  });

  res.json({ success: true, message: `Admin account "${adminToDelete.name}" removed successfully`, id });
});

// =========================================================================
// MULTI-SELLER PLATFORM APIS (PART 2 - PART 10)
// =========================================================================

// ----------------- 1. SELLER AUTHENTICATION (PART 3) -----------------

// POST /api/sellers/auth/register
app.post('/api/sellers/auth/register', (req: Request, res: Response) => {
  const { name, businessName, email, phone, password, address, city, state, pinCode, gstNumber, description } = req.body;
  if (!name || !businessName || !email || !phone || !password) {
    return res.status(400).json({ error: 'Owner Name, Business Name, Email, Phone, and Password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = loadDatabase();
  db.sellers = db.sellers || [];

  const existing = db.sellers.find((s) => s.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ error: `A seller account with email '${cleanEmail}' already exists. Please sign in instead.` });
  }

  const hashed = hashPassword(password.trim());
  const newSellerId = `seller_${Date.now()}`;
  const newSeller: Seller = {
    id: newSellerId,
    name: name.trim(),
    businessName: businessName.trim(),
    email: cleanEmail,
    phone: phone.trim(),
    status: 'ACTIVE', // Automatically active for immediate onboarding, or can be managed by admin
    address: address ? address.trim() : '',
    city: city ? city.trim() : '',
    state: state ? state.trim() : '',
    pinCode: pinCode ? pinCode.trim() : '',
    gstNumber: gstNumber ? gstNumber.trim() : undefined,
    description: description ? description.trim() : '',
    commissionPercentage: 10,
    emailNotificationsEnabled: true,
    salt: hashed.salt,
    hash: hashed.hash,
    createdAt: new Date().toISOString(),
  };

  db.sellers.push(newSeller);
  saveDatabase(db);

  const token = generateToken({
    id: newSeller.id,
    role: 'SELLER',
    name: newSeller.name,
    email: newSeller.email,
    businessName: newSeller.businessName,
  });

  const { salt, hash, ...safeSeller } = newSeller;
  res.status(201).json({
    success: true,
    message: `Welcome to the ZIPROO Seller Atelier, ${safeSeller.businessName}`,
    seller: safeSeller,
    token,
  });
});

// POST /api/sellers/auth/login
app.post('/api/sellers/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = loadDatabase();
  db.sellers = db.sellers || [];

  const seller = db.sellers.find((s) => s.email.toLowerCase() === cleanEmail);
  if (!seller || !seller.salt || !seller.hash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isValid = verifyPassword(password, seller.salt, seller.hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (seller.status === 'SUSPENDED') {
    return res.status(403).json({
      error: 'Your seller account has been suspended by administration.',
      reason: seller.suspendedReason || 'Account suspended',
    });
  }

  const token = generateToken({
    id: seller.id,
    role: 'SELLER',
    name: seller.name,
    email: seller.email,
    businessName: seller.businessName,
  });

  const { salt, hash, ...safeSeller } = seller;
  res.json({
    success: true,
    message: `Welcome back, ${safeSeller.businessName}`,
    seller: safeSeller,
    token,
  });
});

// GET /api/sellers/auth/me
app.get('/api/sellers/auth/me', requireSeller, (req: AuthenticatedSellerRequest, res: Response) => {
  const seller = req.seller!;
  const db = loadDatabase();

  const sellerProducts = (db.products || []).filter((p) => p.sellerId === seller.id);
  const sellerOrders = (db.orders || []).filter((o) =>
    (o.items || []).some((it) => it.sellerId === seller.id)
  );

  let totalSales = 0;
  for (const ord of sellerOrders) {
    for (const it of ord.items) {
      if (it.sellerId === seller.id) {
        totalSales += (it.price || 0) * (it.quantity || 1);
      }
    }
  }

  const { salt, hash, ...safeSeller } = seller;
  res.json({
    seller: safeSeller,
    stats: {
      totalProducts: sellerProducts.length,
      activeProducts: sellerProducts.filter((p) => p.inStock && p.approvalStatus === 'APPROVED').length,
      pendingApproval: sellerProducts.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length,
      rejectedProducts: sellerProducts.filter((p) => p.approvalStatus === 'REJECTED').length,
      totalOrders: sellerOrders.length,
      totalSales,
    },
  });
});

// PUT /api/sellers/profile
app.put('/api/sellers/profile', requireSeller, (req: AuthenticatedSellerRequest, res: Response) => {
  const seller = req.seller!;
  const db = loadDatabase();
  const current = db.sellers.find((s) => s.id === seller.id);
  if (!current) {
    return res.status(404).json({ error: 'Seller account not found' });
  }

  const {
    name,
    businessName,
    phone,
    address,
    city,
    state,
    pinCode,
    gstNumber,
    hsnCodeDefault,
    description,
    bankDetails,
    emailNotificationsEnabled,
    password,
  } = req.body;

  if (name) current.name = name.trim();
  if (businessName) current.businessName = businessName.trim();
  if (phone) current.phone = phone.trim();
  if (address !== undefined) current.address = address.trim();
  if (city !== undefined) current.city = city.trim();
  if (state !== undefined) current.state = state.trim();
  if (pinCode !== undefined) current.pinCode = pinCode.trim();
  if (gstNumber !== undefined) current.gstNumber = gstNumber.trim();
  if (hsnCodeDefault !== undefined) current.hsnCodeDefault = hsnCodeDefault.trim();
  if (description !== undefined) current.description = description.trim();
  if (bankDetails) current.bankDetails = bankDetails;
  if (emailNotificationsEnabled !== undefined) current.emailNotificationsEnabled = Boolean(emailNotificationsEnabled);

  if (password && password.trim().length >= 6) {
    const hashed = hashPassword(password.trim());
    current.salt = hashed.salt;
    current.hash = hashed.hash;
  }

  current.updatedAt = new Date().toISOString();
  saveDatabase(db);

  const { salt, hash, ...safeSeller } = current;
  res.json({ success: true, seller: safeSeller });
});

// ----------------- 2. SELLER PRODUCT MANAGEMENT (PART 4 & PART 5) -----------------

// GET /api/seller/products
// Seller's "My Products" page must show ONLY products created by that seller.
app.get('/api/seller/products', requireSeller, (req: AuthenticatedSellerRequest, res: Response) => {
  const seller = req.seller!;
  const db = loadDatabase();

  // Strict isolation: Seller A never sees Seller B's products
  const products = (db.products || []).filter((p) => p.sellerId === seller.id);
  res.json(products);
});

// POST /api/seller/products
// Add Product: automatically binds seller's unique sellerId, approvalStatus = 'PENDING_APPROVAL'
app.post('/api/seller/products', requireSeller, (req: AuthenticatedSellerRequest, res: Response) => {
  const seller = req.seller!;
  const {
    name,
    category,
    price,
    originalPrice,
    salePrice,
    description,
    fabricDetails,
    material,
    image,
    primaryImage,
    images,
    sizes,
    colors,
    color,
    gsm,
    features,
    careInstructions,
    tags,
    inStock,
    stockCount,
    piecesAvailable,
    inventoryQuantity,
    gstApplicable,
    gstRate,
    hsnCode,
    taxInclusive,
  } = req.body;

  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: 'Product name, category, and price are required' });
  }

  const db = loadDatabase();

  const finalPrice = Number(price);
  const finalSalePrice = salePrice ? Number(salePrice) : finalPrice;
  const finalGstRate = gstApplicable !== false ? (gstRate !== undefined ? Number(gstRate) : 12) : 0;
  const isTaxInclusive = taxInclusive !== false;

  let basePrice = finalSalePrice;
  let gstAmount = 0;
  if (finalGstRate > 0) {
    if (isTaxInclusive) {
      basePrice = Math.round((finalSalePrice / (1 + finalGstRate / 100)) * 100) / 100;
      gstAmount = Math.round((finalSalePrice - basePrice) * 100) / 100;
    } else {
      gstAmount = Math.round((finalSalePrice * (finalGstRate / 100)) * 100) / 100;
    }
  }

  const galleryImages = Array.isArray(images) && images.length > 0 ? images : [image || primaryImage || '/assets/placeholder.jpg'];
  const mainImage = primaryImage || image || galleryImages[0];
  const invQty = piecesAvailable !== undefined ? Number(piecesAvailable) : inventoryQuantity !== undefined ? Number(inventoryQuantity) : (stockCount !== undefined ? Number(stockCount) : 50);

  const newProductId = `prod_seller_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newProduct: Product = {
    id: newProductId,
    name: name.trim(),
    category,
    price: finalSalePrice,
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    salePrice: finalSalePrice,
    description: description ? description.trim() : '',
    fabricDetails: fabricDetails || material || '',
    material: material || fabricDetails || '',
    image: mainImage,
    primaryImage: mainImage,
    images: galleryImages,
    sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'],
    colors: Array.isArray(colors) && colors.length > 0 ? colors : [color || 'Deep Onyx Black'],
    color: color || (Array.isArray(colors) && colors[0]) || 'Deep Onyx Black',
    gsm: gsm ? Number(gsm) || gsm : undefined,
    features: Array.isArray(features) ? features : [],
    careInstructions: careInstructions || 'Cold wash inside out. Dry flat. Do not bleach.',
    tags: Array.isArray(tags) ? tags : ['Streetwear', category],
    inStock: inStock !== false && invQty > 0,
    stockCount: invQty,
    piecesAvailable: invQty,
    inventoryQuantity: invQty,
    isNewLaunch: false,
    rating: 5,
    reviewsCount: 0,
    reviews: [],
    // CRITICAL MULTI-SELLER BINDINGS
    sellerId: seller.id, // Never trust client-submitted sellerId
    sellerName: seller.businessName || seller.name,
    approvalStatus: 'PENDING_APPROVAL', // Default: PENDING APPROVAL
    // GST Details
    gstApplicable: gstApplicable !== false,
    gstRate: finalGstRate,
    hsnCode: hsnCode || seller.hsnCodeDefault || '6109',
    taxInclusive: isTaxInclusive,
    basePrice,
    gstAmount,
    createdAt: new Date().toISOString(),
  };

  newProduct.productLink = `/?product=${newProductId}`;

  db.products.unshift(newProduct);
  saveDatabase(db);

  res.status(201).json({
    success: true,
    message: `Product "${newProduct.name}" created and submitted for admin approval`,
    product: newProduct,
  });
});

// PUT /api/seller/products/:id
// Update product: strictly verifies product belongs to authenticated seller
app.put('/api/seller/products/:id', requireSeller, (req: AuthenticatedSellerRequest, res: Response) => {
  const seller = req.seller!;
  const { id } = req.params;
  const db = loadDatabase();

  const product = db.products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Strict isolation check: Seller A cannot edit Seller B's product
  if (product.sellerId !== seller.id) {
    return res.status(403).json({
      error: 'Forbidden: You do not own this product and cannot modify it.',
      code: 'FORBIDDEN_OWNERSHIP',
    });
  }

  const updates = req.body;
  delete updates.id;
  delete updates.sellerId; // Prevent changing seller association

  // If seller updates pricing or critical specs, keep existing approval or re-flag if needed
  Object.assign(product, updates);

  if (updates.price !== undefined) {
    product.price = Number(updates.price);
  }
  if (updates.images && Array.isArray(updates.images)) {
    product.images = updates.images;
    if (!updates.image && updates.images.length > 0) {
      product.image = updates.images[0];
    }
  }

  if (updates.piecesAvailable !== undefined || updates.stockCount !== undefined) {
    const qty = Number(updates.piecesAvailable ?? updates.stockCount);
    product.piecesAvailable = qty;
    product.stockCount = qty;
    product.inventoryQuantity = qty;
    if (qty <= 0) {
      product.inStock = false;
    }
  }

  product.updatedAt = new Date().toISOString();
  saveDatabase(db);

  res.json({ success: true, product });
});

// PUT /api/seller/products/:id/stock
// Quick stock & inventory toggle
app.put('/api/seller/products/:id/stock', requireSeller, (req: AuthenticatedSellerRequest, res: Response) => {
  const seller = req.seller!;
  const { id } = req.params;
  const { inStock, piecesAvailable } = req.body;
  const db = loadDatabase();

  const product = db.products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (product.sellerId !== seller.id) {
    return res.status(403).json({ error: 'Forbidden: You do not own this product.' });
  }

  if (inStock !== undefined) {
    product.inStock = Boolean(inStock);
  }
  if (piecesAvailable !== undefined) {
    const qty = Math.max(0, Number(piecesAvailable) || 0);
    product.piecesAvailable = qty;
    product.stockCount = qty;
    product.inventoryQuantity = qty;
    if (qty === 0) product.inStock = false;
  }

  product.updatedAt = new Date().toISOString();
  saveDatabase(db);

  res.json({ success: true, product });
});

// DELETE /api/seller/products/:id
app.delete('/api/seller/products/:id', requireSeller, (req: AuthenticatedSellerRequest, res: Response) => {
  const seller = req.seller!;
  const { id } = req.params;
  const db = loadDatabase();

  const product = db.products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (product.sellerId !== seller.id) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this product.' });
  }

  db.products = db.products.filter((p) => p.id !== id);
  saveDatabase(db);

  res.json({ success: true, message: 'Product deleted successfully', id });
});

// ----------------- 3. SELLER ORDERS (PART 6 & PART 7) -----------------

// GET /api/seller/orders
// Returns ONLY orders containing this seller's products, showing ONLY this seller's items!
app.get('/api/seller/orders', requireSeller, (req: AuthenticatedSellerRequest, res: Response) => {
  const seller = req.seller!;
  const db = loadDatabase();

  const scopedOrders: any[] = [];

  for (const ord of db.orders || []) {
    // Filter items belonging ONLY to this seller
    const sellerItems = (ord.items || []).filter((it) => it.sellerId === seller.id);
    if (sellerItems.length > 0) {
      const sellerSubtotal = sellerItems.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);
      const sellerItemCount = sellerItems.reduce((acc, it) => acc + (it.quantity || 1), 0);

      // Scoped order payload: Never leaks Seller B's items to Seller A!
      scopedOrders.push({
        id: ord.id,
        orderNumber: ord.orderNumber,
        createdAt: ord.createdAt,
        orderStatus: ord.orderStatus,
        paymentStatus: ord.paymentStatus,
        paymentMethod: ord.paymentMethod,
        items: sellerItems,
        sellerSubtotal,
        sellerItemCount,
        // Customer information required for shipping & fulfillment
        customerName: ord.customerName,
        mobileNumber: ord.mobileNumber,
        completeAddress: ord.completeAddress,
        city: ord.city,
        state: ord.state,
        pinCode: ord.pinCode,
        trackingInfo: ord.trackingInfo,
      });
    }
  }

  // Sort descending
  scopedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    total: scopedOrders.length,
    orders: scopedOrders,
  });
});

// GET /api/seller/orders/:id
app.get('/api/seller/orders/:id', requireSeller, (req: AuthenticatedSellerRequest, res: Response) => {
  const seller = req.seller!;
  const { id } = req.params;
  const db = loadDatabase();

  const ord = (db.orders || []).find((o) => o.id === id || o.orderNumber === id);
  if (!ord) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const sellerItems = (ord.items || []).filter((it) => it.sellerId === seller.id);
  if (sellerItems.length === 0) {
    return res.status(403).json({ error: 'Forbidden: You do not have products in this order.' });
  }

  const sellerSubtotal = sellerItems.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);

  res.json({
    success: true,
    order: {
      id: ord.id,
      orderNumber: ord.orderNumber,
      createdAt: ord.createdAt,
      orderStatus: ord.orderStatus,
      paymentStatus: ord.paymentStatus,
      paymentMethod: ord.paymentMethod,
      items: sellerItems,
      sellerSubtotal,
      customerName: ord.customerName,
      mobileNumber: ord.mobileNumber,
      completeAddress: ord.completeAddress,
      city: ord.city,
      state: ord.state,
      pinCode: ord.pinCode,
      trackingInfo: ord.trackingInfo,
    },
  });
});

// PUT /api/seller/orders/:id/status
// Update fulfillment status for this seller's items
app.put('/api/seller/orders/:id/status', requireSeller, (req: AuthenticatedSellerRequest, res: Response) => {
  const seller = req.seller!;
  const { id } = req.params;
  const { fulfillmentStatus, carrier, trackingNumber } = req.body;
  const db = loadDatabase();

  const ord = (db.orders || []).find((o) => o.id === id || o.orderNumber === id);
  if (!ord) {
    return res.status(404).json({ error: 'Order not found' });
  }

  let updatedAny = false;
  for (const item of ord.items || []) {
    if (item.sellerId === seller.id) {
      if (fulfillmentStatus) item.fulfillmentStatus = fulfillmentStatus;
      if (carrier) item.carrier = carrier.trim();
      if (trackingNumber) item.trackingNumber = trackingNumber.trim();
      updatedAny = true;
    }
  }

  if (!updatedAny) {
    return res.status(403).json({ error: 'Forbidden: No items for this seller found in order.' });
  }

  // Update order tracking carrier if provided
  if (carrier || trackingNumber) {
    ord.trackingInfo = ord.trackingInfo || {};
    if (carrier) ord.trackingInfo.carrier = carrier.trim();
    if (trackingNumber) ord.trackingInfo.trackingNumber = trackingNumber.trim();
  }

  saveDatabase(db);
  res.json({ success: true, message: 'Order fulfillment status updated successfully' });
});

// POST /api/seller/orders/:id/resend-email
// Seller can retry sending notification email for their items
app.post('/api/seller/orders/:id/resend-email', requireSeller, async (req: AuthenticatedSellerRequest, res: Response) => {
  const seller = req.seller!;
  const { id } = req.params;
  const db = loadDatabase();

  const ord = (db.orders || []).find((o) => o.id === id || o.orderNumber === id);
  if (!ord) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const sellerItems = (ord.items || []).filter((it) => it.sellerId === seller.id);
  if (sellerItems.length === 0) {
    return res.status(403).json({ error: 'Forbidden: No products for this seller in this order' });
  }

  const result = await sendSellerOrderEmail({
    seller,
    order: ord,
    sellerItems,
    forceResend: true,
  });

  saveDatabase(db);
  res.json(result);
});

// ----------------- 4. ADMIN SELLER MANAGEMENT (PART 8) -----------------

// GET /api/admin/sellers
app.get('/api/admin/sellers', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  db.sellers = db.sellers || [];

  const sellersWithStats = db.sellers.map((s) => {
    const sellerProducts = (db.products || []).filter((p) => p.sellerId === s.id);
    const sellerOrders = (db.orders || []).filter((o) =>
      (o.items || []).some((it) => it.sellerId === s.id)
    );

    let totalRevenue = 0;
    for (const ord of sellerOrders) {
      for (const it of ord.items) {
        if (it.sellerId === s.id) {
          totalRevenue += (it.price || 0) * (it.quantity || 1);
        }
      }
    }

    const { salt, hash, ...safeSeller } = s;
    return {
      ...safeSeller,
      stats: {
        totalProducts: sellerProducts.length,
        approvedProducts: sellerProducts.filter((p) => p.approvalStatus === 'APPROVED').length,
        pendingProducts: sellerProducts.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length,
        totalOrders: sellerOrders.length,
        totalRevenue,
      },
    };
  });

  res.json(sellersWithStats);
});

// POST /api/admin/sellers
// Admin directly creates / onboards seller
app.post('/api/admin/sellers', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const sellerName = (req.body.name || req.body.sellerName || req.body.businessName || req.body.storeName || '').trim();
  const businessName = (req.body.businessName || req.body.storeName || req.body.name || req.body.sellerName || '').trim();
  const email = (req.body.email || req.body.username || '').trim().toLowerCase();
  const phone = (req.body.phone || req.body.contact || '+91 0000000000').trim();
  const password = req.body.password;
  const status = req.body.status || 'ACTIVE';
  const commissionPercentage = req.body.commissionPercentage ?? req.body.commissionRate;
  const { gstNumber, address, city, state, pinCode, description } = req.body;

  if (!sellerName || !businessName || !email) {
    return res.status(400).json({ error: 'Seller Name/Store Name, and Email are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = loadDatabase();
  db.sellers = db.sellers || [];

  if (db.sellers.some((s) => s.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: `Seller with email '${cleanEmail}' already exists` });
  }

  const defaultPass = password && password.trim().length >= 6 ? password.trim() : 'seller123';
  const hashed = hashPassword(defaultPass);

  const newSeller: Seller = {
    id: `seller_${Date.now()}`,
    name: sellerName,
    businessName: businessName,
    email: cleanEmail,
    phone: phone,
    status: status || 'ACTIVE',
    commissionPercentage: commissionPercentage !== undefined ? Number(commissionPercentage) : 10,
    gstNumber: gstNumber ? gstNumber.trim() : undefined,
    address: address ? address.trim() : '',
    city: city ? city.trim() : '',
    state: state ? state.trim() : '',
    pinCode: pinCode ? pinCode.trim() : '',
    description: description ? description.trim() : '',
    emailNotificationsEnabled: true,
    salt: hashed.salt,
    hash: hashed.hash,
    createdAt: new Date().toISOString(),
    approvedAt: status === 'ACTIVE' ? new Date().toISOString() : undefined,
  };

  db.sellers.unshift(newSeller);
  saveDatabase(db);

  const { salt, hash, ...safeSeller } = newSeller;
  res.status(201).json({ success: true, seller: safeSeller });
});

// PUT /api/admin/sellers/:id
// Admin edits seller
app.put('/api/admin/sellers/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  const seller = (db.sellers || []).find((s) => s.id === id);
  if (!seller) {
    return res.status(404).json({ error: 'Seller not found' });
  }

  const {
    name,
    businessName,
    email,
    phone,
    status,
    commissionPercentage,
    gstNumber,
    address,
    city,
    state,
    pinCode,
    description,
    suspendedReason,
    bankDetails,
  } = req.body;

  if (name) seller.name = name.trim();
  if (businessName) seller.businessName = businessName.trim();
  if (email) seller.email = email.trim().toLowerCase();
  if (phone) seller.phone = phone.trim();
  if (status) {
    seller.status = status;
    if (status === 'ACTIVE' && !seller.approvedAt) {
      seller.approvedAt = new Date().toISOString();
    }
  }
  if (commissionPercentage !== undefined) seller.commissionPercentage = Number(commissionPercentage);
  if (gstNumber !== undefined) seller.gstNumber = gstNumber.trim();
  if (address !== undefined) seller.address = address.trim();
  if (city !== undefined) seller.city = city.trim();
  if (state !== undefined) seller.state = state.trim();
  if (pinCode !== undefined) seller.pinCode = pinCode.trim();
  if (description !== undefined) seller.description = description.trim();
  if (suspendedReason !== undefined) seller.suspendedReason = suspendedReason.trim();
  if (bankDetails) seller.bankDetails = bankDetails;

  seller.updatedAt = new Date().toISOString();
  saveDatabase(db);

  const { salt, hash, ...safeSeller } = seller;
  res.json({ success: true, seller: safeSeller });
});

// PUT /api/admin/sellers/:id/status
// Quick approve / suspend / activate
app.put('/api/admin/sellers/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, suspendedReason } = req.body;
  if (!status || !['ACTIVE', 'PENDING', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ error: "Status must be 'ACTIVE', 'PENDING', or 'SUSPENDED'" });
  }

  const db = loadDatabase();
  const seller = (db.sellers || []).find((s) => s.id === id);
  if (!seller) {
    return res.status(404).json({ error: 'Seller not found' });
  }

  seller.status = status;
  if (status === 'ACTIVE' && !seller.approvedAt) {
    seller.approvedAt = new Date().toISOString();
  }
  if (suspendedReason) {
    seller.suspendedReason = suspendedReason.trim();
  } else if (status === 'ACTIVE') {
    seller.suspendedReason = undefined;
  }

  seller.updatedAt = new Date().toISOString();
  saveDatabase(db);

  const { salt, hash, ...safeSeller } = seller;
  res.json({ success: true, seller: safeSeller });
});

// POST /api/admin/sellers/:id/reset-password
app.post('/api/admin/sellers/:id/reset-password', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.trim().length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const db = loadDatabase();
  const seller = (db.sellers || []).find((s) => s.id === id);
  if (!seller) {
    return res.status(404).json({ error: 'Seller not found' });
  }

  const hashed = hashPassword(newPassword.trim());
  seller.salt = hashed.salt;
  seller.hash = hashed.hash;
  seller.updatedAt = new Date().toISOString();
  saveDatabase(db);

  res.json({ success: true, message: `Password for seller "${seller.businessName}" reset successfully` });
});

// DELETE /api/admin/sellers/:id
app.delete('/api/admin/sellers/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();

  const seller = (db.sellers || []).find((s) => s.id === id);
  if (!seller) {
    return res.status(404).json({ error: 'Seller not found' });
  }

  db.sellers = (db.sellers || []).filter((s) => s.id !== id);
  saveDatabase(db);

  res.json({ success: true, message: `Seller "${seller.businessName}" removed`, id });
});

// ----------------- 6. ADMIN PAYMENT QR CODE MANAGEMENT -----------------

// GET /api/admin/qr-codes (Admin only)
app.get('/api/admin/qr-codes', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  res.json({ success: true, qrCodes: db.qrCodes || [] });
});

// POST /api/admin/qr-codes (Admin only - Upload / Add QR code)
app.post('/api/admin/qr-codes', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { label, upiId, imageUrl, isActive } = req.body;
  if (!label || !imageUrl) {
    return res.status(400).json({ error: 'Label and Image URL are required' });
  }

  const db = loadDatabase();
  db.qrCodes = db.qrCodes || [];

  const shouldBeActive = Boolean(isActive || db.qrCodes.length === 0);
  if (shouldBeActive) {
    db.qrCodes.forEach((qr) => (qr.isActive = false));
  }

  const newQr: PaymentQrCode = {
    id: `qr_${Date.now()}`,
    label: label.trim(),
    upiId: upiId ? upiId.trim() : undefined,
    imageUrl: imageUrl.trim(),
    isActive: shouldBeActive,
    uploadedBy: req.adminUser!.id,
    createdAt: new Date().toISOString(),
  };

  db.qrCodes.unshift(newQr);

  // Sync with store settings online receiving portal
  if (shouldBeActive) {
    db.settings.onlineReceivingPortal.qrCodeUrl = newQr.imageUrl;
    if (newQr.upiId) {
      db.settings.onlineReceivingPortal.upiId = newQr.upiId;
    }
  }

  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'QR Code Added',
    details: `Added new QR code "${newQr.label}" (Active: ${shouldBeActive})`,
    relatedId: newQr.id,
  });

  res.status(201).json({ success: true, message: 'Payment QR code added', qr: newQr, qrCode: newQr });
});

// PUT /api/admin/qr-codes/:id/active (Admin only - Set which QR code is active)
app.put('/api/admin/qr-codes/:id/active', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  db.qrCodes = db.qrCodes || [];

  const targetQr = db.qrCodes.find((qr) => qr.id === id);
  if (!targetQr) {
    return res.status(404).json({ error: 'QR Code not found' });
  }

  db.qrCodes.forEach((qr) => {
    qr.isActive = qr.id === id;
  });

  db.settings.onlineReceivingPortal.qrCodeUrl = targetQr.imageUrl;
  if (targetQr.upiId) {
    db.settings.onlineReceivingPortal.upiId = targetQr.upiId;
  }

  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'Active QR Code Changed',
    details: `Activated QR code "${targetQr.label}"`,
    relatedId: id,
  });

  res.json({ success: true, message: 'Active QR code updated', qr: targetQr });
});

// DELETE /api/admin/qr-codes/:id (Admin only)
app.delete('/api/admin/qr-codes/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  db.qrCodes = db.qrCodes || [];

  const target = db.qrCodes.find((qr) => qr.id === id);
  if (!target) {
    return res.status(404).json({ error: 'QR Code not found' });
  }

  db.qrCodes = db.qrCodes.filter((qr) => qr.id !== id);
  // If active was deleted and other exists, set first to active
  if (target.isActive && db.qrCodes.length > 0) {
    db.qrCodes[0].isActive = true;
    db.settings.onlineReceivingPortal.qrCodeUrl = db.qrCodes[0].imageUrl;
  }

  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'QR Code Removed',
    details: `Removed QR code "${target.label}"`,
    relatedId: id,
  });

  res.json({ success: true, message: 'QR Code removed', id });
});

// Public Endpoint to fetch active QR code for checkout page
app.get('/api/public/active-qr', (_req: Request, res: Response) => {
  const db = loadDatabase();
  const activeQr = (db.qrCodes || []).find((q) => q.isActive) || (db.qrCodes || [])[0];
  res.json({
    success: true,
    qr: activeQr || null,
    qrCode: activeQr || null,
  });
});

// ----------------- 7. ADMIN BANK / PAYMENT RECEIVING DETAILS -----------------

// GET /api/admin/bank-details (Admin only)
app.get('/api/admin/bank-details', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  res.json({ success: true, bankDetails: db.bankDetails });
});

// PUT /api/admin/bank-details (Admin only - Add/Update receiving details)
app.put('/api/admin/bank-details', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  const current = db.bankDetails || {
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  };

  const updated: BankReceivingDetails = {
    ...current,
    ...req.body,
    updatedAt: new Date().toISOString(),
    updatedBy: req.adminUser!.id,
  };

  db.bankDetails = updated;

  // Sync primary UPI ID and instruction bank details in store settings
  if (updated.upiId) {
    db.settings.onlineReceivingPortal.upiId = updated.upiId;
  }
  db.settings.onlineReceivingPortal.bankAccountDetails = `Account Name: ${updated.accountHolderName} | Bank: ${updated.bankName} | A/C No: ${updated.accountNumber} | IFSC: ${updated.ifscCode}`;

  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'Bank Details Updated',
    details: `Updated banking receiving details for ${updated.bankName} (${updated.accountHolderName})`,
  });

  res.json({ success: true, message: 'Bank details updated successfully', bankDetails: updated });
});

// Public sanitized payment receiver info for checkout (protects full account number)
app.get('/api/public/payment-details', (_req: Request, res: Response) => {
  const db = loadDatabase();
  const b = db.bankDetails;
  const activeQr = (db.qrCodes || []).find((q) => q.isActive);

  res.json({
    success: true,
    upiId: b?.upiId || db.settings.onlineReceivingPortal.upiId,
    gpayUpiId: b?.gpayUpiId || b?.upiId,
    phonepeUpiId: b?.phonepeUpiId || b?.upiId,
    paytmUpiId: b?.paytmUpiId || b?.upiId,
    bankName: b?.bankName,
    accountHolderName: b?.accountHolderName,
    ifscCode: b?.ifscCode,
    activeQrUrl: activeQr?.imageUrl || db.settings.onlineReceivingPortal.qrCodeUrl,
  });
});

// ----------------- 8. ADMIN INTRO VIDEO MANAGEMENT -----------------

// GET /api/admin/intro-videos (Admin only)
app.get('/api/admin/intro-videos', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  res.json({ success: true, videos: db.introVideos || [] });
});

// POST /api/admin/intro-videos (Admin only - Upload / Add intro video)
app.post('/api/admin/intro-videos', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, videoUrl, description, isActive } = req.body;
  if (!title || !videoUrl) {
    return res.status(400).json({ error: 'Title and Video URL are required' });
  }

  const db = loadDatabase();
  db.introVideos = db.introVideos || [];

  const shouldBeActive = Boolean(isActive || db.introVideos.length === 0);
  if (shouldBeActive) {
    db.introVideos.forEach((v) => (v.isActive = false));
  }

  const newVideo: IntroVideoItem = {
    id: `vid_${Date.now()}`,
    title: title.trim(),
    videoUrl: videoUrl.trim(),
    description: description ? description.trim() : undefined,
    isActive: shouldBeActive,
    uploadedBy: req.adminUser!.id,
    createdAt: new Date().toISOString(),
  };

  db.introVideos.unshift(newVideo);

  if (shouldBeActive) {
    db.settings.introVideoUrl = newVideo.videoUrl;
    db.settings.introVideoTitle = newVideo.title;
    if (newVideo.description) {
      db.settings.introVideoDescription = newVideo.description;
    }
  }

  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'Intro Video Added',
    details: `Uploaded new intro video "${newVideo.title}"`,
    relatedId: newVideo.id,
  });

  res.status(201).json({ success: true, message: 'Intro video added successfully', video: newVideo });
});

// PUT /api/admin/intro-videos/:id/active (Admin only - Set active intro video)
app.put('/api/admin/intro-videos/:id/active', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  db.introVideos = db.introVideos || [];

  const target = db.introVideos.find((v) => v.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Video not found' });
  }

  db.introVideos.forEach((v) => {
    v.isActive = v.id === id;
  });

  db.settings.introVideoUrl = target.videoUrl;
  db.settings.introVideoTitle = target.title;
  if (target.description) {
    db.settings.introVideoDescription = target.description;
  }

  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'Intro Video Activated',
    details: `Activated intro video "${target.title}"`,
    relatedId: id,
  });

  res.json({ success: true, message: 'Active intro video updated', video: target });
});

// DELETE /api/admin/intro-videos/:id (Admin only)
app.delete('/api/admin/intro-videos/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  db.introVideos = db.introVideos || [];

  const target = db.introVideos.find((v) => v.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Video not found' });
  }

  db.introVideos = db.introVideos.filter((v) => v.id !== id);
  if (target.isActive && db.introVideos.length > 0) {
    db.introVideos[0].isActive = true;
    db.settings.introVideoUrl = db.introVideos[0].videoUrl;
  }

  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'Intro Video Removed',
    details: `Removed intro video "${target.title}"`,
    relatedId: id,
  });

  res.json({ success: true, message: 'Intro video removed', id });
});

// Public Active Intro Video endpoint
app.get('/api/public/active-intro-video', (_req: Request, res: Response) => {
  const db = loadDatabase();
  const active = (db.introVideos || []).find((v) => v.isActive) || (db.introVideos || [])[0];
  res.json({
    success: true,
    video: active || null,
    videoUrl: active?.videoUrl || db.settings.introVideoUrl || '/intro_video.mp4',
  });
});

// ----------------- 9. ADMIN HOMEPAGE BACKGROUND MANAGEMENT -----------------

// GET /api/admin/homepage-backgrounds (Admin only)
app.get('/api/admin/homepage-backgrounds', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  res.json({ success: true, backgrounds: db.homepageBackgrounds || [] });
});

// POST /api/admin/homepage-backgrounds (Admin only - Upload / Add homepage background)
app.post('/api/admin/homepage-backgrounds', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, imageUrl, isActive } = req.body;
  if (!title || !imageUrl) {
    return res.status(400).json({ error: 'Title and Image URL are required' });
  }

  const db = loadDatabase();
  db.homepageBackgrounds = db.homepageBackgrounds || [];

  const shouldBeActive = Boolean(isActive || db.homepageBackgrounds.length === 0);
  if (shouldBeActive) {
    db.homepageBackgrounds.forEach((bg) => (bg.isActive = false));
  }

  const newBg: HomepageBackgroundItem = {
    id: `bg_${Date.now()}`,
    title: title.trim(),
    imageUrl: imageUrl.trim(),
    isActive: shouldBeActive,
    uploadedBy: req.adminUser!.id,
    createdAt: new Date().toISOString(),
  };

  db.homepageBackgrounds.unshift(newBg);
  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'Homepage Background Added',
    details: `Added new background image "${newBg.title}"`,
    relatedId: newBg.id,
  });

  res.status(201).json({ success: true, message: 'Homepage background added', background: newBg });
});

// PUT /api/admin/homepage-backgrounds/:id/active (Admin only)
app.put('/api/admin/homepage-backgrounds/:id/active', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  db.homepageBackgrounds = db.homepageBackgrounds || [];

  const target = db.homepageBackgrounds.find((bg) => bg.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Background not found' });
  }

  db.homepageBackgrounds.forEach((bg) => {
    bg.isActive = bg.id === id;
  });

  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'Homepage Background Activated',
    details: `Activated background image "${target.title}"`,
    relatedId: id,
  });

  res.json({ success: true, message: 'Active homepage background updated', background: target });
});

// DELETE /api/admin/homepage-backgrounds/:id (Admin only)
app.delete('/api/admin/homepage-backgrounds/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  db.homepageBackgrounds = db.homepageBackgrounds || [];

  const target = db.homepageBackgrounds.find((bg) => bg.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Background not found' });
  }

  db.homepageBackgrounds = db.homepageBackgrounds.filter((bg) => bg.id !== id);
  if (target.isActive && db.homepageBackgrounds.length > 0) {
    db.homepageBackgrounds[0].isActive = true;
  }

  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'Homepage Background Removed',
    details: `Removed background "${target.title}"`,
    relatedId: id,
  });

  res.json({ success: true, message: 'Homepage background removed', id });
});

// Public Active Homepage Background endpoint
app.get('/api/public/active-background', (_req: Request, res: Response) => {
  const db = loadDatabase();
  const active = (db.homepageBackgrounds || []).find((bg) => bg.isActive) || (db.homepageBackgrounds || [])[0];
  res.json({
    success: true,
    background: active || null,
    imageUrl: active?.imageUrl || null,
  });
});

// ----------------- 10. ADMIN AUDIT LOG APIS -----------------

// GET /api/admin/audit-logs (Admin only)
app.get('/api/admin/audit-logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  res.json({ success: true, logs: db.auditLogs || [] });
});

// ----------------- 11. PAYMENT STATUS & ORDER WORKFLOW APIS -----------------

// PATCH /api/admin/orders/:id/payment-status (Authorized Admin only)
app.patch('/api/admin/orders/:id/payment-status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { paymentStatus, orderStatus, note } = req.body;

  if (!paymentStatus) {
    return res.status(400).json({ error: 'paymentStatus is required' });
  }

  const db = loadDatabase();
  const order = db.orders.find((o) => o.id === id || o.orderNumber === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const prevPaymentStatus = order.paymentStatus;
  const prevOrderStatus = order.orderStatus;

  order.paymentStatus = paymentStatus as any;

  if (orderStatus) {
    order.orderStatus = orderStatus as OrderStatus;
  } else if (paymentStatus === 'Payment Successful' || paymentStatus === 'Cash Received') {
    order.orderStatus = 'Confirmed';
  }

  order.notificationLog = order.notificationLog || {
    adminEmailSent: false,
    adminEmailRecipient: db.settings.adminNotificationEmail || 'ziprooclothing@gmail.com',
    customerSmsSent: false,
    customerSmsRecipient: order.mobileNumber,
  };

  order.notificationLog.statusHistory = order.notificationLog.statusHistory || [];
  order.notificationLog.statusHistory.push({
    status: order.orderStatus,
    timestamp: new Date().toISOString(),
    notificationSent: true,
    note: note || `Payment status changed from ${prevPaymentStatus} to ${paymentStatus}. Order status: ${order.orderStatus}`,
  });

  saveDatabase(db);

  recordAuditLog({
    userId: req.adminUser!.id,
    userName: req.adminUser!.name,
    userRole: req.adminUser!.role,
    action: 'Payment Status Changed',
    details: `Order #${order.orderNumber}: Payment changed from "${prevPaymentStatus}" to "${paymentStatus}". Order: "${order.orderStatus}"`,
    relatedId: order.id,
  });

  if (paymentStatus === 'Payment Successful' || paymentStatus === 'Cash Received') {
    try {
      await sendCustomerOrderEmail(order, 'payment_successful', `Payment verified: ${paymentStatus}. Your order is confirmed.`);
    } catch (e) {
      console.warn('Customer email notify note:', e);
    }
  }

  const orderResponse = {
    ...order,
    status: order.orderStatus,
  };

  res.json({ success: true, message: `Payment status updated to ${paymentStatus}`, order: orderResponse });
});

// GET /api/admin/products
// Admin can see ALL products from ALL sellers with clear seller badges and approval statuses
app.get('/api/admin/products', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  res.json(db.products || []);
});

// PUT /api/admin/products/:id/approve
// Approves product -> status becomes APPROVED, appears in public store
app.put('/api/admin/products/:id/approve', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();

  const product = db.products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  product.approvalStatus = 'APPROVED';
  product.rejectionReason = undefined;
  product.updatedAt = new Date().toISOString();
  saveDatabase(db);

  res.json({ success: true, message: `Product "${product.name}" has been approved and is now live on the storefront!`, product });
});

// PUT /api/admin/products/:id/reject
// Rejects product with optional reason
app.put('/api/admin/products/:id/reject', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;
  const db = loadDatabase();

  const product = db.products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  product.approvalStatus = 'REJECTED';
  product.rejectionReason = rejectionReason ? rejectionReason.trim() : 'Does not meet ZIPROO catalog design standards';
  product.updatedAt = new Date().toISOString();
  saveDatabase(db);

  res.json({ success: true, message: `Product "${product.name}" marked as rejected`, product });
});

// ----------------- VITE / STATIC INTEGRATION -----------------

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ZIPROO 2026] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
