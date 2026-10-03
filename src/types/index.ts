export type ProductCategory = 'all' | 't-shirts' | 'oversized-t-shirts' | 'shirts' | 'pants' | 'hoodies';

export interface ProductReview {
  id: string;
  productId: string;
  customerName: string;
  rating: number; // 1 to 5 stars
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: 't-shirts' | 'oversized-t-shirts' | 'shirts' | 'pants' | 'hoodies';
  price: number; // in Rupees ₹
  originalPrice?: number;
  description: string;
  fabricDetails?: string;
  image: string;
  isNewLaunch: boolean;
  inStock: boolean;
  sizes: string[];
  stockCount?: number;
  color?: string; // e.g. "Deep Onyx Black"
  colors?: string[]; // Available colorways
  shippingCharge?: number; // Editor: Shipping charge per product (e.g. 0 for free or ₹99)
  piecesAvailable?: number; // Editor: How many pieces available / inventory
  productLink?: string; // Automatically generated link to product in website
  // GST Tax & HSN Portal Details
  gstRate?: number; // e.g. 5, 12, 18%
  hsnCode?: string; // e.g. "6109", "6110", "6203", "6205"
  taxInclusive?: boolean; // Price includes GST (default true)
  basePrice?: number; // Price before GST
  gstAmount?: number; // Amount of GST in ₹
  rating?: number;
  reviewsCount?: number;
  reviews?: ProductReview[];
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyUpdate {
  id: string;
  title: string;
  content: string;
  category: 'New Design' | 'Product Launch' | 'Announcement' | 'Progress' | 'Behind The Scenes';
  date: string; // e.g. "2026-09-28"
  author: string;
  imageUrl?: string; // Uploaded or specified image
  videoUrl?: string; // Uploaded or specified video
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  location: string;
  registeredAt: string;
  lastLoginAt?: string;
  totalOrders?: number;
  salt?: string;
  hash?: string;
}

export interface CustomerMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read' | 'replied';
}

export interface OnlineReceivingPortal {
  enabled: boolean;
  upiId: string;
  merchantName: string;
  qrCodeUrl?: string;
  instructions: string;
  bankAccountDetails?: string;
}

export interface StoreSettings {
  brandName: string;
  domain?: string;
  tagline: string;
  secondarySlogan: string;
  email: string;
  adminNotificationEmail: string; // ziprooclothing@gmail.com
  instagram: string;
  facebook: string;
  youtube: string; // ZIPROO
  announcementMessages: string[];
  currencySymbol: string; // ₹
  freeShippingThreshold: number; // in ₹
  onlineReceivingPortal: OnlineReceivingPortal;
}

export interface CartItem {
  product: Product;
  size: string;
  color?: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  category: string;
  size: string;
  color?: string;
  quantity: number;
  price: number;
  image: string;
}

export type OrderStatus =
  | 'Order Confirmed'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface EmailDispatchRecord {
  id: string;
  event: 'order_confirmed' | 'payment_successful' | 'order_processing' | 'order_shipped' | 'out_for_delivery' | 'order_delivered' | 'order_cancelled' | 'admin_notification' | 'resend_attempt';
  recipient: string;
  subject: string;
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface NotificationLog {
  adminEmailSent: boolean;
  adminEmailRecipient: string;
  adminEmailTimestamp?: string;
  adminEmailError?: string;
  customerEmailSent?: boolean;
  customerEmailRecipient?: string;
  customerEmailTimestamp?: string;
  customerEmailError?: string;
  customerSmsSent: boolean;
  customerSmsRecipient: string;
  customerSmsTimestamp?: string;
  customerSmsContent?: string;
  customerSmsError?: string;
  statusHistory?: {
    status: OrderStatus;
    timestamp: string;
    notificationSent: boolean;
    note?: string;
  }[];
  emailAuditLog?: EmailDispatchRecord[];
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  mobileNumber: string;
  email: string;
  completeAddress: string;
  city: string;
  state: string;
  pinCode: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  totalAmount: number;
  paymentMethod: 'cod' | 'online_portal' | 'razorpay';
  paymentStatus: 'Pending' | 'Paid' | 'Processing' | 'Failed';
  transactionReference?: string; // UTR or online transfer ref
  orderStatus: OrderStatus;
  createdAt: string;
  notificationLog: NotificationLog;
  // Tracking carrier info if available
  trackingInfo?: {
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    currentLocation?: string;
  };
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: string;
  lastLogin?: string;
}
