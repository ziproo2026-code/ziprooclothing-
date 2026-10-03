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
  testBrevoEmailIntegration,
  testMsg91SmsIntegration,
  getMsg91Config,
  type EmailEvent,
} from './src/server/notifications.js';
import type { AdminUser, Product, CompanyUpdate, Order, ProductReview, Customer, CustomerMessage, OrderStatus } from './src/types/index.js';

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

  let filtered = [...db.products];

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
  const { name, category, price, originalPrice, description, fabricDetails, image, isNewLaunch, inStock, sizes, stockCount } = req.body;

  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }

  const db = loadDatabase();
  const prodId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const autoProductLink = req.body.productLink || `${req.protocol}://${req.get('host')}/?product=${prodId}`;

  const newProduct: Product = {
    id: prodId,
    name: name.trim(),
    category,
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    description: description || '',
    fabricDetails: fabricDetails || '',
    image: image || '/src/assets/images/ziproo_product_tee_1790610656044.jpg',
    isNewLaunch: Boolean(isNewLaunch),
    inStock: inStock !== undefined ? Boolean(inStock) : true,
    sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'],
    stockCount: stockCount !== undefined ? Number(stockCount) : 50,
    shippingCharge: req.body.shippingCharge !== undefined ? Number(req.body.shippingCharge) : 0,
    piecesAvailable: req.body.piecesAvailable !== undefined ? Number(req.body.piecesAvailable) : (stockCount !== undefined ? Number(stockCount) : 100),
    productLink: autoProductLink,
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

  const updated: Product = {
    ...current,
    ...req.body,
    id: current.id, // prevent id overwrite
    price: req.body.price !== undefined ? Number(req.body.price) : current.price,
    originalPrice: req.body.originalPrice !== undefined ? Number(req.body.originalPrice) : current.originalPrice,
    stockCount: req.body.stockCount !== undefined ? Number(req.body.stockCount) : current.stockCount,
    shippingCharge: req.body.shippingCharge !== undefined ? Number(req.body.shippingCharge) : (current.shippingCharge ?? 0),
    piecesAvailable: req.body.piecesAvailable !== undefined ? Number(req.body.piecesAvailable) : (current.piecesAvailable ?? 100),
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
    const {
      customerName,
      mobileNumber,
      email,
      completeAddress,
      city,
      state,
      pinCode,
      items,
      paymentMethod,
      transactionReference,
    } = req.body;

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

      validatedItems.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        category: dbProduct.category,
        size: item.size || 'L',
        color: item.color || dbProduct.color || 'Deep Onyx Black',
        quantity: requestedQty,
        price: verifiedPrice,
        image: dbProduct.image,
      });
    }

    const subtotal = calculatedSubtotal;
    const shipping = subtotal >= db.settings.freeShippingThreshold ? 0 : 99; // ₹99 nominal shipping under threshold
    const totalAmount = subtotal + shipping;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ord_${Date.now()}`;
    const orderNumber = `ZIP-2026-${randomNum}`;
    const createdAt = new Date().toISOString();

    // Requirements:
    // For COD orders, confirm order immediately after successful submission
    // For prepaid orders, initial state is processing verification
    const isCod = paymentMethod === 'cod';
    const initialOrderStatus: OrderStatus = isCod ? 'Order Confirmed' : 'Processing';
    const initialPaymentStatus: Order['paymentStatus'] = isCod ? 'Pending' : 'Processing';

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
      paymentMethod: paymentMethod === 'online_portal' ? 'online_portal' : paymentMethod === 'razorpay' ? 'razorpay' : 'cod',
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

// ----------------- ADMIN 1 EXCLUSIVE ADMIN CREATION APIS -----------------

// POST /api/admin/create-admin (Strictly Admin 1 only!)
app.post('/api/admin/create-admin', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const currentAdmin = req.adminUser;
  // USER REQUIREMENT: creating new admin for website that can be created by admin1 only
  if (currentAdmin?.username !== 'rohithsharma' && currentAdmin?.id !== 'usr_admin_1') {
    return res.status(403).json({
      error: 'Permission Denied: Only Admin 1 (Rohith Sharma) has authorization to create new website administrators.',
    });
  }

  const { username, name, role, password } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, Full Name, and Password are required' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const db = loadDatabase();

  const existing = db.admins.find((a) => a.username.toLowerCase() === cleanUsername);
  if (existing) {
    return res.status(400).json({ error: `An administrator with username '${cleanUsername}' already exists.` });
  }

  const hashed = hashPassword(password);
  const newAdminId = `usr_admin_${Date.now()}`;
  const newAdmin = {
    id: newAdminId,
    username: cleanUsername,
    name: name.trim(),
    role: role ? role.trim() : 'Operations & Atelier Lead',
    salt: hashed.salt,
    hash: hashed.hash,
    lastLogin: new Date().toISOString(),
  };

  db.admins.push(newAdmin);
  saveDatabase(db);

  res.status(201).json({
    success: true,
    admin: {
      id: newAdmin.id,
      username: newAdmin.username,
      name: newAdmin.name,
      role: newAdmin.role,
      lastLogin: newAdmin.lastLogin,
    },
  });
});

// GET /api/admin/admins (Admin only)
app.get('/api/admin/admins', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  const safeAdmins = db.admins.map((a) => ({
    id: a.id,
    username: a.username,
    name: a.name,
    role: a.role,
    lastLogin: a.lastLogin,
    isAdmin1: a.id === 'usr_admin_1' || a.username === 'rohithsharma',
  }));
  res.json(safeAdmins);
});

// DELETE /api/admin/admins/:id (Admin 1 only)
app.delete('/api/admin/admins/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const currentAdmin = req.adminUser;
  if (currentAdmin?.username !== 'rohithsharma' && currentAdmin?.id !== 'usr_admin_1') {
    return res.status(403).json({ error: 'Permission Denied: Only Admin 1 can remove administrators.' });
  }

  const { id } = req.params;
  if (id === 'usr_admin_1') {
    return res.status(400).json({ error: 'Cannot delete primary Admin 1 account.' });
  }

  const db = loadDatabase();
  db.admins = db.admins.filter((a) => a.id !== id && a.username !== 'rohithsharma');
  saveDatabase(db);
  res.json({ success: true, id });
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
