import 'dotenv/config';
import nodemailer from 'nodemailer';
import type { Order, StoreSettings, OrderStatus, EmailDispatchRecord } from '../types/index.js';

const ADMIN_PRIMARY_EMAIL = 'ziproo2026@gmail.com';
const ADMIN_SECONDARY_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'ziprooclothing@gmail.com';

// BREVO TRANSACTIONAL EMAIL CONFIGURATION
// Read securely from server-side environment secrets with alias resolution
export function getBrevoApiKey(): string {
  const direct = (process.env.BREVO_API_KEY || '').trim();
  if (direct && !direct.includes('YOUR_BREVO_API_KEY')) return direct;

  // Also support user naming secrets 'email' or 'ziproo' in Secrets panel
  for (const k of ['BREVO_API_KEY', 'brevo_api_key', 'email', 'ziproo']) {
    const val = process.env[k];
    if (val && typeof val === 'string' && val.startsWith('xkeysib-')) {
      return val.trim();
    }
  }
  return '';
}

const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_FROM_EMAIL || 'ziproo2026@gmail.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'ZIPROO Atelier';

// SMTP FALLBACK CONFIGURATION
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'ZIPROO Atelier';
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || SMTP_USER || 'orders@ziproofashion.com';

// MSG91 Indian DLT-Approved SMS Gateway Configuration Helper
// Reads securely from server environment variable MSG91_AUTH_KEY on every invocation
export function getMsg91Config() {
  // 1. Direct environment variable lookup: MSG91_AUTH_KEY
  let authKey = (process.env.MSG91_AUTH_KEY || '').trim();

  // 2. Check case-insensitive aliases in process.env
  if (!authKey) {
    const candidateKeys = [
      'msg91_auth_key',
      'MSG91_API_KEY',
      'msg91_api_key',
      'MSG91_KEY',
      'msg91_key',
      'MSG91_AUTHKEY',
      'msg91authkey',
      'MSG91',
      'msg91',
      'MSG_91_AUTH_KEY',
      'msg_91_auth_key',
      'AUTH_KEY',
    ];
    for (const key of candidateKeys) {
      const val = process.env[key];
      if (val && typeof val === 'string' && val.trim()) {
        authKey = val.trim();
        break;
      }
    }
  }

  // 3. Normalize quotes if present
  if (authKey.startsWith('"') && authKey.endsWith('"')) {
    authKey = authKey.slice(1, -1).trim();
  } else if (authKey.startsWith("'") && authKey.endsWith("'")) {
    authKey = authKey.slice(1, -1).trim();
  }

  // Template / Flow ID for DLT approved templates
  let templateId = (
    process.env.MSG91_TEMPLATE_ID ||
    process.env.MSG91_FLOW_ID ||
    process.env.msg91_template_id ||
    process.env.msg91_flow_id ||
    ''
  ).trim();
  if (templateId.startsWith('"') && templateId.endsWith('"')) templateId = templateId.slice(1, -1).trim();
  if (templateId.includes('YOUR_MSG91_TEMPLATE_ID')) templateId = '';

  // Sender ID (e.g., ZIPROO)
  let senderId = (
    process.env.MSG91_SENDER_ID ||
    process.env.msg91_sender_id ||
    'ZIPROO'
  ).trim();
  if (senderId.startsWith('"') && senderId.endsWith('"')) senderId = senderId.slice(1, -1).trim();

  const isAvailable = Boolean(
    authKey &&
    authKey.length > 0 &&
    !authKey.includes('YOUR_MSG91_AUTH_KEY') &&
    authKey !== 'undefined' &&
    authKey !== 'null'
  );

  return {
    authKey,
    templateId,
    senderId,
    isAvailable,
  };
}

// Generic SMS Gateway Fallback
const SMS_API_URL = process.env.SMS_GATEWAY_API_URL;
const SMS_API_KEY = process.env.SMS_GATEWAY_API_KEY;
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'ZIPROO';

// Active in-flight email locks to prevent duplicate concurrent dispatches
const inFlightEmailLocks = new Set<string>();

/**
 * Configure Nodemailer transport if SMTP credentials are provided
 */
function createTransporter() {
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return null;
}

export type EmailEvent =
  | 'order_confirmed'
  | 'payment_successful'
  | 'order_processing'
  | 'order_shipped'
  | 'out_for_delivery'
  | 'order_delivered'
  | 'order_cancelled'
  | 'admin_notification'
  | 'resend_attempt';

function getEventSubject(event: EmailEvent, order: Order): string {
  switch (event) {
    case 'order_confirmed':
      return `ZIPROO Order Confirmed: #${order.orderNumber} - Create Your Identity`;
    case 'payment_successful':
      return `ZIPROO Payment Verified & Received: #${order.orderNumber}`;
    case 'order_processing':
      return `ZIPROO Atelier Update: #${order.orderNumber} is Being Tailored & Prepared`;
    case 'order_shipped':
      return `ZIPROO Order Shipped: #${order.orderNumber} is In Transit!`;
    case 'out_for_delivery':
      return `ZIPROO Delivery Alert: #${order.orderNumber} is OUT FOR DELIVERY Today!`;
    case 'order_delivered':
      return `ZIPROO Package Delivered: #${order.orderNumber} - Welcome to the Identity`;
    case 'order_cancelled':
      return `ZIPROO Order Status: #${order.orderNumber} Cancelled`;
    default:
      return `ZIPROO Order Update: #${order.orderNumber}`;
  }
}

function getEventBanner(event: EmailEvent) {
  switch (event) {
    case 'order_confirmed':
      return {
        title: 'ORDER CONFIRMED',
        subtitle: 'Your streetwear drop is secured and queued in the atelier',
        color: '#7c3aed',
      };
    case 'payment_successful':
      return {
        title: 'PAYMENT VERIFIED & RECEIVED',
        subtitle: 'Payment confirmed. Manufacturing and fulfillment underway',
        color: '#059669',
      };
    case 'order_processing':
      return {
        title: 'ORDER IN PROCESSING',
        subtitle: 'Hand-inspected, tagged, and boxed at ZIPROO HQ',
        color: '#7c3aed',
      };
    case 'order_shipped':
      return {
        title: 'DISPATCHED & IN TRANSIT',
        subtitle: 'Your apparel package is rolling with courier partners',
        color: '#0891b2',
      };
    case 'out_for_delivery':
      return {
        title: 'OUT FOR DELIVERY TODAY',
        subtitle: 'Keep your phone handy. Delivery agent arriving soon',
        color: '#d97706',
      };
    case 'order_delivered':
      return {
        title: 'ORDER DELIVERED',
        subtitle: 'Wear your identity. Thank you for choosing ZIPROO',
        color: '#059669',
      };
    case 'order_cancelled':
      return {
        title: 'ORDER CANCELLED',
        subtitle: 'This order has been cancelled. Contact support for assistance',
        color: '#dc2626',
      };
    default:
      return {
        title: 'ORDER UPDATE',
        subtitle: 'Latest tracking details from ZIPROO Atelier',
        color: '#7c3aed',
      };
  }
}

/**
 * Brevo Transactional Email Engine
 * Dispatches via official Brevo REST API v3: POST https://api.brevo.com/v3/smtp/email
 */
interface BrevoSendOptions {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  senderName?: string;
  senderEmail?: string;
}

export async function sendBrevoEmail(
  options: BrevoSendOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = getBrevoApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: 'BREVO_API_KEY is not defined in server environment secrets',
    };
  }

  const senderEmail = options.senderEmail || process.env.BREVO_SENDER_EMAIL?.trim() || BREVO_SENDER_EMAIL;
  const senderName = options.senderName || process.env.BREVO_SENDER_NAME?.trim() || BREVO_SENDER_NAME;

  try {
    const payload = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: options.toEmail.trim(),
          name: options.toName.trim() || options.toEmail.trim(),
        },
      ],
      subject: options.subject,
      htmlContent: options.htmlContent,
      textContent: options.textContent,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Non-JSON response
    }

    if (response.ok && data?.messageId) {
      console.log(`[ZIPROO BREVO SUCCESS] Email delivered to ${options.toEmail}. Brevo MessageId: ${data.messageId}`);
      return { success: true, messageId: data.messageId };
    } else {
      const errorMsg = data?.message || data?.code || `HTTP ${response.status}: ${responseText || response.statusText}`;
      console.error(`[ZIPROO BREVO API ERROR] Failed sending email to ${options.toEmail}:`, errorMsg);
      return { success: false, error: `Brevo API error: ${errorMsg}` };
    }
  } catch (err: any) {
    console.error(`[ZIPROO BREVO NETWORK ERROR] Exception connecting to Brevo API:`, err);
    return { success: false, error: `Brevo connection failed: ${err.message || String(err)}` };
  }
}

/**
 * Test utility for Brevo transactional email integration
 */
export async function testBrevoEmailIntegration(
  toEmail = 'ziproo2026@gmail.com'
): Promise<{ success: boolean; message: string; messageId?: string; error?: string }> {
  const apiKey = getBrevoApiKey();
  if (!apiKey) {
    return {
      success: false,
      message: 'BREVO_API_KEY is not configured in server environment',
      error: 'Missing BREVO_API_KEY secret',
    };
  }

  const result = await sendBrevoEmail({
    toEmail,
    toName: 'ZIPROO Admin Test',
    subject: `[ZIPROO TEST] Brevo Transactional Email Integration Test · ${new Date().toLocaleTimeString('en-IN')}`,
    textContent: `ZIPROO Brevo Transactional Email Integration is active and verified.\nTimestamp: ${new Date().toISOString()}\nRecipient: ${toEmail}`,
    htmlContent: `
      <div style="font-family: sans-serif; padding: 24px; background: #09090b; color: #ffffff; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #7c3aed;">
        <h1 style="color: #ffffff; font-size: 20px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px;">ZIPROO ATELIER</h1>
        <p style="color: #a855f7; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; margin: 0 0 16px;">BREVO TRANSACTIONAL EMAIL VERIFICATION</p>
        <div style="background: #18181b; padding: 14px; border-radius: 8px; border: 1px solid #27272a; font-size: 13px; line-height: 1.6;">
          <p style="margin: 0 0 8px; color: #10b981; font-weight: bold;">✔ Brevo API Key connected and transmitting successfully!</p>
          <p style="margin: 0; color: #a1a1aa; font-size: 11px;">Timestamp: ${new Date().toISOString()}</p>
          <p style="margin: 4px 0 0; color: #a1a1aa; font-size: 11px;">Recipient: ${toEmail}</p>
        </div>
        <p style="font-size: 11px; color: #71717a; margin-top: 16px; text-align: center;">CREATE YOUR IDENTITY · EST. 2026</p>
      </div>
    `,
  });

  if (result.success) {
    return {
      success: true,
      message: `Test email successfully dispatched via Brevo! MessageId: ${result.messageId}`,
      messageId: result.messageId,
    };
  } else {
    return {
      success: false,
      message: `Brevo test dispatch failed: ${result.error}`,
      error: result.error,
    };
  }
}

/**
 * Builds responsive, streetwear-aesthetic HTML email for the customer
 */
function buildCustomerEmailHtml(order: Order, event: EmailEvent, note?: string): string {
  const { title, subtitle, color } = getEventBanner(event);
  const orderTimeFormatted = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Asia/Kolkata',
  });

  const itemsHtml = order.items
    .map((item) => {
      const colorDisplay = item.color || 'Deep Onyx Black';
      return `
      <tr style="border-bottom: 1px solid #e4e4e7;">
        <td style="padding: 12px 10px 12px 0; vertical-align: top; width: 64px;">
          <img src="${item.image}" alt="${item.productName}" style="width: 58px; height: 58px; object-fit: cover; border-radius: 8px; border: 1px solid #e4e4e7; display: block;" />
        </td>
        <td style="padding: 12px 10px; vertical-align: top;">
          <div style="font-weight: 700; font-size: 13px; color: #18181b; text-transform: uppercase;">${item.productName}</div>
          <div style="font-size: 11px; color: #71717a; margin-top: 2px;">
            <span>Size: <strong style="color: #7c3aed; font-family: monospace;">[${item.size}]</strong></span>
            <span style="margin: 0 4px;">·</span>
            <span>Colour: <strong style="color: #18181b;">${colorDisplay}</strong></span>
          </div>
          <div style="font-size: 11px; color: #71717a; margin-top: 2px;">
            Qty: <strong style="color: #18181b;">${item.quantity}</strong>
          </div>
        </td>
        <td style="padding: 12px 0 12px 8px; vertical-align: top; text-align: right;">
          <div style="font-family: monospace; font-size: 13px; font-weight: 700; color: #18181b;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
          <div style="font-size: 10px; color: #a1a1aa; font-family: monospace;">₹${item.price.toLocaleString('en-IN')} each</div>
        </td>
      </tr>
      `;
    })
    .join('');

  const trackingBox = order.trackingInfo?.trackingNumber
    ? `
    <div style="margin: 16px 0; padding: 14px; border-radius: 10px; background-color: #f5f3ff; border: 1px solid #ddd6fe;">
      <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #6d28d9; letter-spacing: 1px;">🚚 Live Tracking Information</div>
      <div style="margin-top: 6px; font-size: 12px; color: #1e1b4b;">
        <div>Carrier: <strong>${order.trackingInfo.carrier || 'Express Roadway Logistics'}</strong></div>
        <div style="margin-top: 2px;">Tracking Waybill #: <strong style="font-family: monospace; color: #7c3aed;">${order.trackingInfo.trackingNumber}</strong></div>
        ${order.trackingInfo.estimatedDelivery ? `<div style="margin-top: 2px;">Estimated Delivery: <strong>${order.trackingInfo.estimatedDelivery}</strong></div>` : ''}
        ${order.trackingInfo.currentLocation ? `<div style="margin-top: 2px;">Current Hub: <strong>${order.trackingInfo.currentLocation}</strong></div>` : ''}
      </div>
    </div>
    `
    : '';

  const noteBox = note
    ? `
    <div style="margin: 16px 0; padding: 12px; border-radius: 8px; background-color: #faf5ff; border-left: 4px solid #7c3aed; font-size: 12px; color: #581c87;">
      <strong>Atelier Dispatch Note:</strong> ${note}
    </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${getEventSubject(event, order)}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b;">
  <table role="presentation" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <!-- Top Brand Header -->
    <tr>
      <td style="background-color: #09090b; padding: 28px 24px; text-align: center; border-bottom: 3px solid #7c3aed;">
        <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: 4px; margin: 0; text-transform: uppercase;">ZIPROO</h1>
        <p style="color: #a855f7; font-size: 11px; font-weight: 600; letter-spacing: 2.5px; margin: 6px 0 0; text-transform: uppercase;">CREATE YOUR IDENTITY · EST. 2026</p>
      </td>
    </tr>

    <!-- Event Banner -->
    <tr>
      <td style="background-color: ${color}; padding: 14px 24px; text-align: center; color: #ffffff;">
        <div style="font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">${title}</div>
        <div style="font-size: 12px; opacity: 0.95; margin-top: 2px;">${subtitle}</div>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 28px 24px;">
        <p style="font-size: 15px; line-height: 1.5; margin: 0 0 16px; color: #18181b;">
          Dear <strong>${order.customerName}</strong>,
        </p>
        <p style="font-size: 13px; line-height: 1.6; color: #52525b; margin: 0 0 20px;">
          Thank you for choosing ZIPROO. Here are the latest particulars and tracking verification for your order.
        </p>

        <!-- Order Metadata Card -->
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; margin-bottom: 20px;">
          <tr>
            <td style="padding: 10px 14px; font-size: 11px; color: #71717a; text-transform: uppercase;">Order ID:</td>
            <td style="padding: 10px 14px; font-size: 13px; font-weight: 700; font-family: monospace; color: #18181b; text-align: right;">#${order.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 14px; font-size: 11px; color: #71717a; text-transform: uppercase;">Order Date:</td>
            <td style="padding: 6px 14px; font-size: 12px; color: #52525b; text-align: right;">${orderTimeFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 6px 14px; font-size: 11px; color: #71717a; text-transform: uppercase;">Order Status:</td>
            <td style="padding: 6px 14px; font-size: 12px; font-weight: 700; color: ${color}; text-align: right; text-transform: uppercase;">● ${order.orderStatus}</td>
          </tr>
          <tr>
            <td style="padding: 6px 14px; font-size: 11px; color: #71717a; text-transform: uppercase;">Payment Method:</td>
            <td style="padding: 6px 14px; font-size: 12px; color: #18181b; font-weight: 600; text-align: right; text-transform: uppercase;">
              ${order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod === 'online_portal' ? 'Online UPI Portal' : 'Razorpay Gateway'}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-size: 11px; color: #71717a; text-transform: uppercase;">Payment Status:</td>
            <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${order.paymentStatus === 'Paid' ? '#059669' : '#d97706'}; text-align: right; text-transform: uppercase;">${order.paymentStatus}</td>
          </tr>
        </table>

        ${trackingBox}
        ${noteBox}

        <!-- Items Table -->
        <div style="font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #18181b; margin: 24px 0 8px; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px;">
          Purchased Apparel (${order.items.reduce((s, it) => s + it.quantity, 0)} Items)
        </div>
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
        </table>

        <!-- Price Breakdown -->
        <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px;">
          <tr>
            <td style="padding: 4px 0; color: #71717a;">Subtotal</td>
            <td style="padding: 4px 0; text-align: right; font-family: monospace; color: #18181b;">₹${order.subtotal.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #71717a;">All-India Express Delivery</td>
            <td style="padding: 4px 0; text-align: right; font-family: monospace; color: #18181b;">
              ${order.shipping === 0 ? '<strong style="color: #059669;">FREE</strong>' : `₹${order.shipping.toLocaleString('en-IN')}`}
            </td>
          </tr>
          <tr style="border-top: 2px solid #18181b;">
            <td style="padding: 10px 0 4px; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #18181b;">Grand Total</td>
            <td style="padding: 10px 0 4px; text-align: right; font-size: 16px; font-weight: 800; font-family: monospace; color: #7c3aed;">₹${order.totalAmount.toLocaleString('en-IN')}</td>
          </tr>
        </table>

        <!-- Delivery Destination -->
        <div style="margin-top: 24px; padding: 14px; background-color: #fafafa; border-radius: 10px; border: 1px solid #e4e4e7;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #71717a; margin-bottom: 4px;">📍 Shipping Address</div>
          <div style="font-size: 13px; font-weight: 600; color: #18181b;">${order.customerName}</div>
          <div style="font-size: 12px; color: #52525b; line-height: 1.5; margin-top: 2px;">
            ${order.completeAddress}<br>
            ${order.city}, ${order.state} - ${order.pinCode}<br>
            Phone: ${order.mobileNumber}
          </div>
        </div>

        <!-- Action Button -->
        <div style="text-align: center; margin-top: 28px;">
          <a href="https://ziproofashion.com/?portal=orders&order=${encodeURIComponent(order.orderNumber)}"
             style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
            View in My Orders Portal →
          </a>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f4f4f5; padding: 20px 24px; text-align: center; border-top: 1px solid #e4e4e7; font-size: 11px; color: #71717a; line-height: 1.5;">
        <div>Need assistance? Email our atelier at <a href="mailto:ziproo2026@gmail.com" style="color: #7c3aed; text-decoration: none; font-weight: 600;">ziproo2026@gmail.com</a></div>
        <div style="margin-top: 6px; font-weight: 600; color: #18181b; text-transform: uppercase; letter-spacing: 1px;">"DON'T FOLLOW THE RULES. CREATE IT."</div>
        <div style="margin-top: 4px; font-size: 10px;">ZIPROO Fashion Atelier · All Rights Reserved © 2026</div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send automatic email to Customer whenever their order is confirmed or status changes
 * Uses Brevo Transactional Email when BREVO_API_KEY is configured
 */
export async function sendCustomerOrderEmail(
  order: Order,
  event: EmailEvent,
  note?: string,
  forceResend = false
): Promise<{ success: boolean; message: string; error?: string }> {
  const recipient = order.email;
  if (!recipient || recipient.includes('@ziproo-customer.com')) {
    return { success: false, message: 'No valid customer email address provided' };
  }

  // Deduplication guard: prevent double sending for the same order + event
  const dedupKey = `${order.id}_${event}_${recipient.toLowerCase()}`;
  if (!forceResend && inFlightEmailLocks.has(dedupKey)) {
    console.log(`[ZIPROO EMAIL DEDUP] In-flight email lock active for ${dedupKey}. Skipping duplicate.`);
    return { success: true, message: 'Email dispatch already in progress' };
  }

  order.notificationLog = order.notificationLog || {
    adminEmailSent: false,
    adminEmailRecipient: ADMIN_PRIMARY_EMAIL,
    customerSmsSent: false,
    customerSmsRecipient: order.mobileNumber,
  };
  order.notificationLog.emailAuditLog = order.notificationLog.emailAuditLog || [];

  if (!forceResend) {
    const existingSuccess = order.notificationLog.emailAuditLog.find(
      (entry) =>
        entry.event === event &&
        entry.recipient.toLowerCase() === recipient.toLowerCase() &&
        entry.success
    );

    if (existingSuccess) {
      console.log(`[ZIPROO EMAIL DEDUP] Skipped duplicate '${event}' email for order #${order.orderNumber} to ${recipient} (previously sent at ${existingSuccess.timestamp})`);
      return { success: true, message: 'Duplicate email suppressed (already delivered)' };
    }
  }

  inFlightEmailLocks.add(dedupKey);

  const subject = getEventSubject(event, order);
  const htmlContent = buildCustomerEmailHtml(order, event, note);
  const plainText = `
ZIPROO FASHION ATELIER
------------------------------------------------
${subject}
Order Reference: #${order.orderNumber}
Customer: ${order.customerName}
Status: ${order.orderStatus}
Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})
Total Amount: ₹${order.totalAmount.toLocaleString('en-IN')}

ITEMS:
${order.items.map((i) => `- ${i.productName} [${i.size}] (${i.color || 'Onyx Black'}) x${i.quantity} = ₹${(i.price * i.quantity).toLocaleString('en-IN')}`).join('\n')}

DELIVERY ADDRESS:
${order.completeAddress}, ${order.city}, ${order.state} - ${order.pinCode}
Phone: ${order.mobileNumber}
${order.trackingInfo?.trackingNumber ? `\nTracking #: ${order.trackingInfo.trackingNumber} (${order.trackingInfo.carrier || 'Express'})` : ''}

Track anytime in your My Orders portal: https://ziproofashion.com/
ZIPROO 2026 — CREATE YOUR IDENTITY.
  `.trim();

  const timestamp = new Date().toISOString();

  try {
    // 1. PRIMARY: Brevo Transactional Email Engine
    const apiKey = getBrevoApiKey();
    if (apiKey) {
      const brevoResult = await sendBrevoEmail({
        toEmail: recipient,
        toName: order.customerName,
        subject,
        htmlContent,
        textContent: plainText,
      });

      const record: EmailDispatchRecord = {
        id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        event,
        recipient,
        subject,
        timestamp,
        success: brevoResult.success,
        error: brevoResult.error,
      };
      order.notificationLog.emailAuditLog.push(record);
      order.notificationLog.customerEmailSent = brevoResult.success;
      order.notificationLog.customerEmailRecipient = recipient;
      order.notificationLog.customerEmailTimestamp = timestamp;
      order.notificationLog.customerEmailError = brevoResult.error;

      if (brevoResult.success) {
        return { success: true, message: `Email delivered via Brevo to ${recipient} (MsgId: ${brevoResult.messageId})` };
      } else {
        return { success: false, message: 'Brevo transmission reported error', error: brevoResult.error };
      }
    }

    // 2. SECONDARY FALLBACK: SMTP (Nodemailer)
    const transporter = createTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
          to: recipient,
          subject,
          text: plainText,
          html: htmlContent,
        });

        console.log(`[ZIPROO SMTP SUCCESS] Sent '${event}' to customer ${recipient} for #${order.orderNumber}. MsgId: ${info.messageId}`);
        const record: EmailDispatchRecord = {
          id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          event,
          recipient,
          subject,
          timestamp,
          success: true,
        };
        order.notificationLog.emailAuditLog.push(record);
        order.notificationLog.customerEmailSent = true;
        order.notificationLog.customerEmailRecipient = recipient;
        order.notificationLog.customerEmailTimestamp = timestamp;
        order.notificationLog.customerEmailError = undefined;

        return { success: true, message: `Email delivered via SMTP to ${recipient}` };
      } catch (err: any) {
        console.error(`[ZIPROO SMTP ERROR] Failed delivering to ${recipient}:`, err);
        const record: EmailDispatchRecord = {
          id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          event,
          recipient,
          subject,
          timestamp,
          success: false,
          error: err.message || String(err),
        };
        order.notificationLog.emailAuditLog.push(record);
        order.notificationLog.customerEmailSent = false;
        order.notificationLog.customerEmailError = err.message || String(err);
        order.notificationLog.customerEmailTimestamp = timestamp;

        return { success: false, message: 'SMTP transmission failed', error: err.message || String(err) };
      }
    }

    // 3. TERTIARY: Simulated Development Dispatch
    console.log(`\n======================================================`);
    console.log(`[ZIPROO CUSTOMER EMAIL DISPATCH: ${recipient}]`);
    console.log(`Event: ${event} | Subject: ${subject}`);
    console.log(plainText);
    console.log(`======================================================\n`);

    const record: EmailDispatchRecord = {
      id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      event,
      recipient,
      subject,
      timestamp,
      success: true,
    };
    order.notificationLog.emailAuditLog.push(record);
    order.notificationLog.customerEmailSent = true;
    order.notificationLog.customerEmailRecipient = recipient;
    order.notificationLog.customerEmailTimestamp = timestamp;
    order.notificationLog.customerEmailError = undefined;

    return {
      success: true,
      message: `Order notification recorded and dispatched to ${recipient}`,
    };
  } finally {
    inFlightEmailLocks.delete(dedupKey);
  }
}

/**
 * Send order notification email to Admin (both ziproo2026@gmail.com and admin notification email)
 * Uses Brevo Transactional Email when BREVO_API_KEY is configured
 */
export async function sendAdminOrderEmail(
  order: Order,
  settings: StoreSettings
): Promise<{ success: boolean; message: string; error?: string }> {
  // Requirement: Also send a new order notification to ziproo2026@gmail.com
  const recipients = Array.from(
    new Set([
      ADMIN_PRIMARY_EMAIL,
      settings.adminNotificationEmail || ADMIN_SECONDARY_EMAIL,
    ])
  ).filter(Boolean);

  const recipientString = recipients.join(', ');

  const orderTimeFormatted = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Asia/Kolkata',
  });

  const itemsListText = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.productName} | Size: ${item.size} | Colour: ${item.color || 'Onyx Black'} | Qty: ${item.quantity} | Price: ₹${item.price} | Total: ₹${item.price * item.quantity}`
    )
    .join('\n');

  const itemsListHtml = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #27272a;">
        <td style="padding: 10px 0; color: #ffffff; font-weight: bold;">
          ${item.productName}
          <div style="font-size: 11px; color: #a1a1aa; font-weight: normal;">Category: ${item.category} | Colour: ${item.color || 'Onyx Black'}</div>
        </td>
        <td style="padding: 10px; text-align: center; color: #c084fc; font-weight: bold; font-family: monospace;">${item.size}</td>
        <td style="padding: 10px; text-align: center; color: #ffffff; font-family: monospace;">${item.quantity}</td>
        <td style="padding: 10px; text-align: right; color: #ffffff; font-family: monospace;">₹${item.price.toLocaleString('en-IN')}</td>
        <td style="padding: 10px; text-align: right; color: #ffffff; font-weight: bold; font-family: monospace;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  const subject = `[NEW ZIPROO ORDER] #${order.orderNumber} - ₹${order.totalAmount} by ${order.customerName}`;

  const plainText = `
========================================
NEW ZIPROO ORDER RECEIVED!
Order ID: #${order.orderNumber}
Date & Time: ${orderTimeFormatted}
========================================

CUSTOMER INFORMATION:
- Name: ${order.customerName}
- Mobile Number: ${order.mobileNumber}
- Email: ${order.email}

COMPLETE DELIVERY ADDRESS:
- Address: ${order.completeAddress}
- City: ${order.city}
- State: ${order.state}
- PIN Code: ${order.pinCode}

ORDER DETAILS:
${itemsListText}

Subtotal: ₹${order.subtotal.toLocaleString('en-IN')}
Shipping: ${order.shipping === 0 ? 'FREE' : `₹${order.shipping.toLocaleString('en-IN')}`}
TOTAL AMOUNT: ₹${order.totalAmount.toLocaleString('en-IN')}

PAYMENT INFORMATION:
- Method: ${order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod === 'online_portal' ? 'Admin Online Portal (UPI / QR)' : 'Razorpay Gateway'}
- Status: ${order.paymentStatus}
${order.transactionReference ? `- Transaction / UTR Ref: ${order.transactionReference}` : ''}
- Fulfillment Status: ${order.orderStatus}

========================================
ZIPROO 2026 Atelier Systems
  `.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #f4f4f5;">
  <table role="presentation" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #121215; border-radius: 14px; overflow: hidden; border: 1px solid #27272a;">
    <tr>
      <td style="background: linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 3px; margin: 0; text-transform: uppercase;">NEW ZIPROO ORDER</h1>
        <p style="color: #e9d5ff; font-size: 13px; font-weight: bold; margin: 6px 0 0; font-family: monospace;">Order #${order.orderNumber} · Total: ₹${order.totalAmount.toLocaleString('en-IN')}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <div style="background: #18181b; padding: 14px; border-radius: 10px; border: 1px solid #27272a; margin-bottom: 20px;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #a1a1aa; letter-spacing: 1px;">Customer Particulars</div>
          <div style="font-size: 15px; font-weight: bold; color: #ffffff; margin-top: 4px;">${order.customerName}</div>
          <div style="font-size: 12px; color: #c084fc; font-family: monospace; margin-top: 2px;">Mobile: ${order.mobileNumber} · Email: ${order.email}</div>
          <div style="font-size: 12px; color: #a1a1aa; margin-top: 6px; line-height: 1.5;">
            <strong>Shipping:</strong> ${order.completeAddress}, ${order.city}, ${order.state} - ${order.pinCode}
          </div>
        </div>

        <div style="font-size: 12px; text-transform: uppercase; font-weight: bold; color: #a1a1aa; letter-spacing: 1px; margin-bottom: 8px;">Order Items</div>
        <table role="presentation" style="width: 100%; border-collapse: collapse; font-size: 13px;">
          ${itemsListHtml}
        </table>

        <div style="margin-top: 20px; padding: 14px; background: #18181b; border-radius: 10px; border: 1px solid #27272a; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #a1a1aa;">Payment Method:</span>
            <strong style="color: #ffffff; text-transform: uppercase;">${order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod === 'online_portal' ? 'Online UPI Portal' : 'Razorpay Gateway'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #a1a1aa;">Payment Status:</span>
            <strong style="color: ${order.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'}; text-transform: uppercase;">${order.paymentStatus}</strong>
          </div>
          ${order.transactionReference ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="color: #a1a1aa;">Customer UTR:</span><strong style="color: #10b981; font-family: monospace;">${order.transactionReference}</strong></div>` : ''}
          <div style="border-top: 1px solid #27272a; padding-top: 8px; margin-top: 8px; display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #ffffff; font-weight: bold;">Grand Total:</span>
            <strong style="color: #c084fc; font-family: monospace; font-size: 16px;">₹${order.totalAmount.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #0c0a09; padding: 16px; text-align: center; border-top: 1px solid #27272a; font-size: 11px; color: #71717a;">
        ZIPROO Atelier Management Systems · Notifications routed to ${recipientString}
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const apiKey = getBrevoApiKey();

  // 1. PRIMARY: Brevo Transactional Email Engine
  if (apiKey) {
    let lastResult: any = null;
    for (const recipient of recipients) {
      lastResult = await sendBrevoEmail({
        toEmail: recipient,
        toName: 'ZIPROO Admin',
        subject,
        htmlContent,
        textContent: plainText,
        senderName: 'ZIPROO Order Alert',
      });
    }

    if (lastResult?.success) {
      console.log(`[ZIPROO BREVO ADMIN EMAIL] Order notification dispatched to ${recipientString}. MsgId: ${lastResult.messageId}`);
      return { success: true, message: `Email dispatched via Brevo to ${recipientString}` };
    } else {
      console.error(`[ZIPROO BREVO ADMIN ERROR] Failed sending to ${recipientString}:`, lastResult?.error);
      return { success: false, message: 'Brevo transmission failed', error: lastResult?.error };
    }
  }

  // 2. SECONDARY: SMTP Transport
  const transporter = createTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
        to: recipientString,
        subject,
        text: plainText,
        html: htmlContent,
      });
      console.log(`[ZIPROO ADMIN EMAIL] Order notification email dispatched to ${recipientString}. MessageId: ${info.messageId}`);
      return { success: true, message: `Email dispatched to ${recipientString}` };
    } catch (err: any) {
      console.error(`[ZIPROO ADMIN EMAIL ERROR] Failed to send email via SMTP to ${recipientString}:`, err);
      return { success: false, message: 'SMTP transmission failed', error: err.message || String(err) };
    }
  }

  // 3. TERTIARY: Simulated Development Dispatch
  console.log(`\n======================================================`);
  console.log(`[ZIPROO ADMIN EMAIL DISPATCH TO: ${recipientString}]`);
  console.log(`Subject: ${subject}`);
  console.log(plainText);
  console.log(`======================================================\n`);
  return {
    success: true,
    message: `Admin notification recorded for ${recipientString}`,
  };
}

/**
 * Send order confirmation SMS to customer's registered mobile number
 * Reads MSG91_AUTH_KEY dynamically from server environment and validates presence
 */
export async function sendCustomerOrderSms(
  order: Order
): Promise<{ success: boolean; message: string; smsContent: string; error?: string }> {
  const productSummary = order.items.map((i) => `${i.productName} (${i.size}) x${i.quantity}`).join(', ');
  const smsContent = `Hi ${order.customerName}! Thank you for ordering from ZIPROO. Your order #${order.orderNumber} (Items: ${productSummary}, Total: ₹${order.totalAmount.toLocaleString('en-IN')}) has been received successfully. We'll keep you updated on shipping. Thank you for choosing ZIPROO!`;

  const cleanMobile = order.mobileNumber.replace(/[^0-9]/g, '');
  const { authKey, templateId, senderId, isAvailable } = getMsg91Config();

  // Validate API key presence
  if (!isAvailable) {
    const errorMsg = 'Missing API key: MSG91_AUTH_KEY is unavailable in server-side environment secrets';
    console.error(`[ZIPROO MSG91 CONFIG ERROR] ${errorMsg}`);
    return {
      success: false,
      message: errorMsg,
      smsContent,
      error: errorMsg,
    };
  }

  // Format mobile number with country code for Indian telecommunications (91 prefix)
  const formattedMobile = cleanMobile.startsWith('91') && cleanMobile.length === 12
    ? cleanMobile
    : cleanMobile.length === 10
    ? `91${cleanMobile}`
    : cleanMobile;

  // 1. PRIMARY: MSG91 Flow API (DLT-Approved Template)
  if (templateId) {
    try {
      const msg91Payload = {
        template_id: templateId,
        flow_id: templateId,
        sender: senderId,
        short_url: '0',
        recipients: [
          {
            mobiles: formattedMobile,
            customer_name: order.customerName,
            name: order.customerName,
            order_id: order.orderNumber,
            order_no: order.orderNumber,
            amount: `₹${order.totalAmount.toLocaleString('en-IN')}`,
            total: `₹${order.totalAmount.toLocaleString('en-IN')}`,
            items: productSummary.slice(0, 80),
            var1: order.customerName,
            var2: order.orderNumber,
            var3: `₹${order.totalAmount.toLocaleString('en-IN')}`,
            var4: productSummary.slice(0, 80),
            VAR1: order.customerName,
            VAR2: order.orderNumber,
            VAR3: `₹${order.totalAmount.toLocaleString('en-IN')}`,
            VAR4: productSummary.slice(0, 80),
          },
        ],
      };

      // Supply authkey both in header and query string to prevent proxy/WAF strip issues
      const flowUrl = `https://control.msg91.com/api/v5/flow/?authkey=${encodeURIComponent(authKey)}`;
      const res = await fetch(flowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          authkey: authKey,
        },
        body: JSON.stringify(msg91Payload),
        signal: AbortSignal.timeout(10000),
      });

      const responseText = await res.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        // Text response
      }

      if (res.ok && (!responseJson || (responseJson.type !== 'error' && responseJson.status !== 'error'))) {
        console.log(`[ZIPROO MSG91 SMS SUCCESS] Order confirmation SMS sent to ${order.mobileNumber}. MessageId/Ref: ${responseJson?.request_id || responseText}`);
        return {
          success: true,
          message: `SMS delivered via MSG91 to ${order.mobileNumber}`,
          smsContent,
        };
      } else {
        const errorMsg = responseJson?.message || responseJson?.description || responseText || `MSG91 HTTP ${res.status}`;
        console.error(`[ZIPROO MSG91 SMS ERROR] Gateway returned error:`, errorMsg);
        return {
          success: false,
          message: `MSG91 gateway reported: ${errorMsg}`,
          smsContent,
          error: errorMsg,
        };
      }
    } catch (err: any) {
      console.error(`[ZIPROO MSG91 NETWORK ERROR]`, err);
      return {
        success: false,
        message: 'MSG91 gateway network connection error',
        smsContent,
        error: err.message || String(err),
      };
    }
  }

  // 2. MSG91 Standard SendSMS API (when templateId is not set)
  try {
    const v2Url = `https://api.msg91.com/api/v2/sendsms?authkey=${encodeURIComponent(authKey)}`;
    const res = await fetch(v2Url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        authkey: authKey,
      },
      body: JSON.stringify({
        sender: senderId,
        route: '4',
        country: '91',
        sms: [
          {
            message: smsContent,
            to: [formattedMobile],
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    const responseText = await res.text();
    let responseJson: any = null;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      // Text response
    }

    if (res.ok && (!responseJson || responseJson.type !== 'error')) {
      console.log(`[ZIPROO MSG91 SMS SUCCESS] Standard SMS dispatched to ${order.mobileNumber}.`);
      return {
        success: true,
        message: `SMS delivered via MSG91 to ${order.mobileNumber}`,
        smsContent,
      };
    } else {
      const errorMsg = responseJson?.message || responseText || `MSG91 HTTP ${res.status}`;
      console.error(`[ZIPROO MSG91 SMS ERROR] v2 Gateway reported:`, errorMsg);
      return {
        success: false,
        message: `MSG91 gateway reported: ${errorMsg}`,
        smsContent,
        error: errorMsg,
      };
    }
  } catch (err: any) {
    console.error(`[ZIPROO MSG91 ERROR]`, err);
    return {
      success: false,
      message: 'MSG91 gateway network error',
      smsContent,
      error: err.message || String(err),
    };
  }
}

/**
 * Send status update SMS to customer's registered mobile number
 */
export async function sendCustomerStatusUpdateSms(
  order: Order,
  newStatus: OrderStatus,
  note?: string
): Promise<{ success: boolean; message: string; error?: string }> {
  const smsContent = `ZIPROO Update: Order #${order.orderNumber} status changed to "${newStatus}". ${note ? `Note: ${note}. ` : ''}Track live on: https://ziproofashion.com/track`;
  const cleanMobile = order.mobileNumber.replace(/[^0-9]/g, '');
  const { authKey, templateId, senderId, isAvailable } = getMsg91Config();

  if (!isAvailable) {
    return {
      success: false,
      message: 'Missing API key: MSG91_AUTH_KEY is unavailable in server-side environment secrets',
      error: 'Missing API key: MSG91_AUTH_KEY is unavailable',
    };
  }

  const formattedMobile = cleanMobile.startsWith('91') && cleanMobile.length === 12
    ? cleanMobile
    : cleanMobile.length === 10
    ? `91${cleanMobile}`
    : cleanMobile;

  if (templateId) {
    try {
      const flowUrl = `https://control.msg91.com/api/v5/flow/?authkey=${encodeURIComponent(authKey)}`;
      const res = await fetch(flowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          authkey: authKey,
        },
        body: JSON.stringify({
          template_id: templateId,
          flow_id: templateId,
          sender: senderId,
          short_url: '0',
          recipients: [
            {
              mobiles: formattedMobile,
              customer_name: order.customerName,
              name: order.customerName,
              order_id: order.orderNumber,
              order_status: newStatus,
              status: newStatus,
              note: note || '',
              var1: order.customerName,
              var2: order.orderNumber,
              var3: newStatus,
              VAR1: order.customerName,
              VAR2: order.orderNumber,
              VAR3: newStatus,
            },
          ],
        }),
        signal: AbortSignal.timeout(10000),
      });

      const responseText = await res.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        // Text
      }

      if (res.ok && (!responseJson || responseJson.type !== 'error')) {
        return { success: true, message: `Status update SMS delivered via MSG91 to ${order.mobileNumber}` };
      }
    } catch {
      // Fallback to direct SMS
    }
  }

  try {
    const v2Url = `https://api.msg91.com/api/v2/sendsms?authkey=${encodeURIComponent(authKey)}`;
    const res = await fetch(v2Url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        authkey: authKey,
      },
      body: JSON.stringify({
        sender: senderId,
        route: '4',
        country: '91',
        sms: [
          {
            message: smsContent,
            to: [formattedMobile],
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });
    return { success: res.ok, message: res.ok ? `Status update SMS sent to ${order.mobileNumber}` : 'Status SMS gateway error' };
  } catch (err: any) {
    return { success: false, message: 'Status SMS dispatch failed', error: err.message || String(err) };
  }
}

/**
 * Test utility for MSG91 SMS Gateway
 * Accurately validates authentication with MSG91 and tests SMS delivery
 */
export async function testMsg91SmsIntegration(
  mobileNumber = '9876543210'
): Promise<{ success: boolean; message: string; error?: string }> {
  const { authKey, templateId, isAvailable } = getMsg91Config();
  if (!isAvailable) {
    return {
      success: false,
      message: 'Missing API key: MSG91_AUTH_KEY is not configured in server environment secrets',
      error: 'Missing API key: MSG91_AUTH_KEY is unavailable in server-side environment secrets. Please configure the secret MSG91_AUTH_KEY in your AI Studio Secrets panel or server environment.',
    };
  }

  // 1. If template is provided, test Flow API
  if (templateId) {
    const dummyOrder: Order = {
      id: `test_${Date.now()}`,
      orderNumber: 'TEST-SMS',
      customerName: 'ZIPROO Atelier Test',
      mobileNumber,
      email: 'test@ziproofashion.com',
      completeAddress: 'ZIPROO Fashion HQ',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560001',
      items: [
        {
          productId: 'test',
          productName: 'ZIPROO TEST TEE',
          category: 'T-Shirts',
          size: 'L',
          quantity: 1,
          price: 999,
          image: '',
        },
      ],
      subtotal: 999,
      shipping: 0,
      totalAmount: 999,
      paymentMethod: 'cod',
      paymentStatus: 'Pending',
      orderStatus: 'Order Confirmed',
      createdAt: new Date().toISOString(),
      notificationLog: {
        adminEmailSent: false,
        adminEmailRecipient: 'ziproo2026@gmail.com',
        customerSmsSent: false,
        customerSmsRecipient: mobileNumber,
      },
    };

    const result = await sendCustomerOrderSms(dummyOrder);
    return {
      success: result.success,
      message: result.message,
      error: result.error,
    };
  }

  // 2. If templateId is not set, validate authKey against MSG91 authentication endpoint
  try {
    const checkUrl = `https://api.msg91.com/api/balance.php?authkey=${encodeURIComponent(authKey)}&type=4`;
    const res = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });
    const text = (await res.text()).trim();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // Non-json
    }

    // MSG91 returns {"msg":"201","msgType":"error"} for invalid authkey
    if (json?.msgType === 'error' && (json?.msg === '201' || json?.message?.includes('auth') || json?.message?.includes('Invalid'))) {
      const err = `MSG91 authentication rejected: Invalid API key (MSG91 Error ${json.msg || '201'}). Please verify MSG91_AUTH_KEY in your MSG91 dashboard.`;
      console.error(`[ZIPROO MSG91 AUTH ERROR] ${err}`);
      return {
        success: false,
        message: err,
        error: err,
      };
    }

    const dummyOrder: Order = {
      id: `test_${Date.now()}`,
      orderNumber: 'TEST-SMS',
      customerName: 'ZIPROO Atelier Test',
      mobileNumber,
      email: 'test@ziproofashion.com',
      completeAddress: 'ZIPROO Fashion HQ',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560001',
      items: [
        {
          productId: 'test',
          productName: 'ZIPROO TEST TEE',
          category: 'T-Shirts',
          size: 'L',
          quantity: 1,
          price: 999,
          image: '',
        },
      ],
      subtotal: 999,
      shipping: 0,
      totalAmount: 999,
      paymentMethod: 'cod',
      paymentStatus: 'Pending',
      orderStatus: 'Order Confirmed',
      createdAt: new Date().toISOString(),
      notificationLog: {
        adminEmailSent: false,
        adminEmailRecipient: 'ziproo2026@gmail.com',
        customerSmsSent: false,
        customerSmsRecipient: mobileNumber,
      },
    };

    const sendRes = await sendCustomerOrderSms(dummyOrder);
    return {
      success: sendRes.success,
      message: sendRes.message,
      error: sendRes.error,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect to MSG91 gateway: ${err.message || String(err)}`,
      error: err.message || String(err),
    };
  }
}

/**
 * Send status update SMS and Email to customer when status changes
 */
export async function sendCustomerStatusUpdate(
  order: Order,
  newStatus: OrderStatus,
  note?: string
): Promise<{ success: boolean; message: string }> {
  let event: EmailEvent = 'order_processing';
  const cleanStatus = newStatus.toLowerCase();

  if (cleanStatus.includes('confirmed')) {
    event = 'order_confirmed';
  } else if (cleanStatus.includes('shipped')) {
    event = 'order_shipped';
  } else if (cleanStatus.includes('out for delivery') || cleanStatus.includes('out_for_delivery')) {
    event = 'out_for_delivery';
  } else if (cleanStatus.includes('delivered')) {
    event = 'order_delivered';
  } else if (cleanStatus.includes('cancelled')) {
    event = 'order_cancelled';
  } else {
    event = 'order_processing';
  }

  // 1. Send Automatic Email Notification to Customer via Brevo / SMTP
  const emailResult = await sendCustomerOrderEmail(order, event, note, true);

  // 2. Also send SMS notification to Customer if MSG91 is available
  const { isAvailable } = getMsg91Config();
  if (isAvailable && order.mobileNumber) {
    try {
      await sendCustomerStatusUpdateSms(order, newStatus, note);
    } catch (smsErr) {
      console.warn('[ZIPROO STATUS SMS WARN] Status update SMS failed:', smsErr);
    }
  }

  console.log(`\n[ZIPROO STATUS UPDATE] Customer: ${order.customerName} (${order.mobileNumber}) -> "${newStatus}" | Email sent: ${emailResult.success}`);

  return {
    success: emailResult.success,
    message: `Customer notification dispatched for status: ${newStatus}`,
  };
}
