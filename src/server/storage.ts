import fs from 'fs';
import path from 'path';
import type { Product, CompanyUpdate, StoreSettings, Order, ProductReview, Customer, CustomerMessage } from '../types/index.js';
import { hashPassword, verifyPassword, type StoredAdmin } from './auth.js';

interface DatabaseSchema {
  admins: StoredAdmin[];
  products: Product[];
  updates: CompanyUpdate[];
  settings: StoreSettings;
  orders: Order[];
  customers: Customer[];
  messages: CustomerMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'ziproo_db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialDatabase(): DatabaseSchema {
  const admin1 = hashPassword('rohith004');
  const admin2 = hashPassword('rohith004');

  const defaultReviews: Record<string, ProductReview[]> = {
    prod_1: [
      {
        id: 'rev_1',
        productId: 'prod_1',
        customerName: 'Aarav Mehta',
        rating: 5,
        comment: 'The 280 GSM cotton is phenomenal. Drops cleanly on the shoulders without wrinkling. The purple monogram is subtle and high-grade.',
        date: '2026-09-24',
        verifiedPurchase: true,
      },
      {
        id: 'rev_2',
        productId: 'prod_1',
        customerName: 'Karan Singhania',
        rating: 5,
        comment: 'Best oversized tee in India hands down. Fits boxy, heavyweight collar ribbing does not sag after wash.',
        date: '2026-09-26',
        verifiedPurchase: true,
      },
    ],
    prod_2: [
      {
        id: 'rev_3',
        productId: 'prod_2',
        customerName: 'Devansh Verma',
        rating: 5,
        comment: '480 GSM French Terry feels like luxury armor. Hood holds its shape perfectly. Worth every rupee.',
        date: '2026-09-25',
        verifiedPurchase: true,
      },
    ],
    prod_3: [
      {
        id: 'rev_4',
        productId: 'prod_3',
        customerName: 'Vikram Joshi',
        rating: 5,
        comment: 'Tactical cargo perfection. Waterproof zippers and knee articulation make it effortless to style with chunky kicks.',
        date: '2026-09-22',
        verifiedPurchase: true,
      },
    ],
  };

  return {
    admins: [
      {
        id: 'usr_admin_1',
        username: 'rohithsharma',
        name: 'Rohith Sharma (Founder & Creative Director)',
        role: 'Founder & Creative Director',
        salt: admin1.salt,
        hash: admin1.hash,
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'usr_admin_2',
        username: 'ranjithkumar',
        name: 'Ranjith Kumar (Co-founder of ZIPROO)',
        role: 'Co-founder of ZIPROO',
        salt: admin2.salt,
        hash: admin2.hash,
        lastLogin: new Date().toISOString(),
      },
    ],
    settings: {
      brandName: 'ZIPROO FASHION',
      domain: 'ziproofashion.com',
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
        'SHOP THE LATEST DROP · ALL INDIA EXPRESS SHIPPING',
        'OVERSIZED STREETWEAR ARCHITECTURE',
      ],
      currencySymbol: '₹',
      freeShippingThreshold: 1999,
      onlineReceivingPortal: {
        enabled: true,
        upiId: 'ziproo@upi',
        merchantName: 'ZIPROO APPAREL ATELIER',
        instructions: 'Pay directly via UPI (GPay / PhonePe / Paytm / BHIM) to UPI ID: ziproo@upi or scan the official atelier QR code. Submit your 12-digit UTR / Transaction Reference ID during checkout.',
        bankAccountDetails: 'Account Name: ZIPROO CLOTHING | Bank: HDFC Bank | A/C No: 50200089202611 | IFSC: HDFC0001234',
      },
    },
    products: [
      {
        id: 'prod_1',
        name: 'VORTEX 01 OVERSIZED TEE',
        category: 'oversized-t-shirts',
        price: 1499,
        originalPrice: 1999,
        description: 'Ultra-heavyweight 280 GSM combed jersey with custom boxy architectural silhouette. Screen-printed ZIPROO typographic monogram at chest, silicone wash for silky hand-feel, and reinforced double-needle neck ribbing.',
        fabricDetails: '100% Organic Combed Heavy Cotton · 280 GSM · Pre-shrunk Boxy Fit',
        image: '/src/assets/images/ziproo_product_tee_1790610656044.jpg',
        isNewLaunch: true,
        inStock: true,
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        stockCount: 42,
        rating: 4.9,
        reviewsCount: 14,
        reviews: defaultReviews['prod_1'] || [],
        createdAt: '2026-09-20T10:00:00.000Z',
      },
      {
        id: 'prod_2',
        name: 'SHADOW MONOLITH HEAVY HOODIE',
        category: 'hoodies',
        price: 3499,
        originalPrice: 4299,
        description: 'The definitive ZIPROO outerwear statement. Crafted from 480 GSM diagonal french terry with deep double-layered storm hood, custom matte gunmetal hardware, and concealed side-seam stash pockets.',
        fabricDetails: '100% French Terry Cotton · 480 GSM · Dropped Shoulder Box Cut',
        image: '/src/assets/images/ziproo_product_hoodie_1790610642709.jpg',
        isNewLaunch: true,
        inStock: true,
        sizes: ['S', 'M', 'L', 'XL'],
        stockCount: 28,
        rating: 5.0,
        reviewsCount: 21,
        reviews: defaultReviews['prod_2'] || [],
        createdAt: '2026-09-22T14:30:00.000Z',
      },
      {
        id: 'prod_3',
        name: 'CYBER-TACTICAL CARGO PANTS',
        category: 'pants',
        price: 2899,
        originalPrice: 3499,
        description: 'Engineered utility trousers featuring 6 waterproof zippered gusset pockets, articulated knee darts for unrestricted motion, and adjustable toggle ankles for convertible wide-leg or tapered styling.',
        fabricDetails: 'High-density Matte Ripstop Nylon Blend · Teflon DWR Coated · Water Repellent',
        image: '/src/assets/images/ziproo_product_cargo_1790610670701.jpg',
        isNewLaunch: false,
        inStock: true,
        sizes: ['S', 'M', 'L', 'XL'],
        stockCount: 35,
        rating: 4.8,
        reviewsCount: 11,
        reviews: defaultReviews['prod_3'] || [],
        createdAt: '2026-09-18T09:15:00.000Z',
      },
      {
        id: 'prod_4',
        name: 'NIGHTFALL MODULAR OVERSHIRT',
        category: 'shirts',
        price: 2199,
        originalPrice: 2699,
        description: 'Architectural short-sleeve workwear overshirt with laser-cut ventilation eyelets, matte industrial snap closures, and structural chest flap pockets. Perfect as an outer layer over our oversized tees.',
        fabricDetails: 'Structured Cotton-Twill Blend · 240 GSM · Industrial Matte Snaps',
        image: '/src/assets/images/ziproo_product_shirt_1790610686944.jpg',
        isNewLaunch: false,
        inStock: true,
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        stockCount: 20,
        rating: 4.9,
        reviewsCount: 8,
        reviews: [],
        createdAt: '2026-09-15T11:45:00.000Z',
      },
      {
        id: 'prod_5',
        name: 'IDENTITY MATRIX ACID TEE',
        category: 't-shirts',
        price: 1299,
        originalPrice: 1699,
        description: 'Hand-distressed mineral acid wash tee featuring subtle iridescent purple foil accents. Each garment undergoes a bespoke washing treatment rendering no two pieces identical.',
        fabricDetails: '100% Ring-Spun Cotton · 220 GSM · Mineral Acid Washed',
        image: '/src/assets/images/ziproo_product_tee_1790610656044.jpg',
        isNewLaunch: false,
        inStock: true,
        sizes: ['S', 'M', 'L', 'XL'],
        stockCount: 50,
        rating: 4.7,
        reviewsCount: 19,
        reviews: [],
        createdAt: '2026-09-10T16:20:00.000Z',
      },
      {
        id: 'prod_6',
        name: 'ECLIPSE BOX CUT OVERSIZED TEE',
        category: 'oversized-t-shirts',
        price: 1599,
        originalPrice: 1999,
        description: 'Exaggerated dropped shoulders with a cropped architectural hemline. Screen-printed with the ZIPROO manifesto "DON\'T FOLLOW THE RULES. CREATE IT." across the upper back shoulders.',
        fabricDetails: 'Premium Heavy Cotton Jersey · 290 GSM · Custom Boxy Fit',
        image: '/src/assets/images/ziproo_product_tee_1790610656044.jpg',
        isNewLaunch: true,
        inStock: true,
        sizes: ['S', 'M', 'L', 'XL'],
        stockCount: 30,
        rating: 4.9,
        reviewsCount: 16,
        reviews: [],
        createdAt: '2026-09-24T12:00:00.000Z',
      },
      {
        id: 'prod_7',
        name: 'ARCHITECT HYBRID UTILITY PANTS',
        category: 'pants',
        price: 2799,
        originalPrice: 3299,
        description: 'Tailored urban trousers with integrated webbing magnetic buckle belt, dual side cargo bellows, and purple contrast bartack stitching at all high-stress tension points.',
        fabricDetails: 'Technical Stretch Twill · 98% Cotton 2% Spandex · Magnetic Webbing Belt',
        image: '/src/assets/images/ziproo_product_cargo_1790610670701.jpg',
        isNewLaunch: true,
        inStock: true,
        sizes: ['S', 'M', 'L', 'XL'],
        stockCount: 22,
        rating: 4.8,
        reviewsCount: 9,
        reviews: [],
        createdAt: '2026-09-25T15:30:00.000Z',
      },
      {
        id: 'prod_8',
        name: 'NEO-VIOLET ZIP HOODIE',
        category: 'hoodies',
        price: 3699,
        originalPrice: 4499,
        description: 'Full-zip luxury streetwear hoodie with two-way heavy YKK zipper, internal purple piping, and embroidered ZIPROO tonal insignia along the left cuff.',
        fabricDetails: '460 GSM Heavy French Terry Cotton · YKK 2-Way Zipper · Tonal Embroidery',
        image: '/src/assets/images/ziproo_product_hoodie_1790610642709.jpg',
        isNewLaunch: true,
        inStock: true,
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        stockCount: 18,
        rating: 5.0,
        reviewsCount: 12,
        reviews: [],
        createdAt: '2026-09-26T08:00:00.000Z',
      },
    ],
    updates: [
      {
        id: 'upd_4',
        title: 'ZIPROO 2026 Debut Drop Officially Announced',
        category: 'Product Launch',
        content: 'Today marks the official reveal of ZIPROO Capsule 01. Founded with an uncompromising vision: Don\'t follow the rules. Create it. Our flagship 480 GSM hoodies and engineered utilitarian cargo pants are now accessible across India and globally.',
        date: '2026-09-28',
        author: 'Rohith Sharma (Founder)',
        createdAt: '2026-09-28T07:30:00.000Z',
      },
      {
        id: 'upd_3',
        title: 'Behind the Atelier: Sourcing 480 GSM French Terry',
        category: 'Behind The Scenes',
        content: 'After six months of meticulous prototyping across specialized textile mills, we selected an unbrushed diagonal cotton terry. It holds the structural silhouette of our hoodies without slouching, yet delivers cloud-soft interior comfort.',
        date: '2026-09-25',
        author: 'Ranjith Kumar (Co-founder)',
        createdAt: '2026-09-25T14:15:00.000Z',
      },
      {
        id: 'upd_2',
        title: 'Identity Series 01 Prototype Fitting & Runway Preview',
        category: 'New Design',
        content: 'Completed sample fittings for our upcoming Nightfall Modular Overshirt and Architect Utility Pants in our central design studio. Tension testing on the magnetic Fidlock buckles passed with zero defect tolerance.',
        date: '2026-09-22',
        author: 'Ranjith Kumar (Co-founder)',
        createdAt: '2026-09-22T16:00:00.000Z',
      },
      {
        id: 'upd_1',
        title: 'All-India Express Logistics Network Activated',
        category: 'Progress',
        content: 'To honor our commitment to premium streetwear enthusiasts, we have secured express courier lanes with end-to-end SMS tracking and guaranteed dispatch within 24 hours.',
        date: '2026-09-18',
        author: 'Ranjith Kumar (Co-founder)',
        createdAt: '2026-09-18T10:00:00.000Z',
      },
    ],
    orders: [
      {
        id: 'ord_101',
        orderNumber: 'ZIP-2026-8901',
        customerName: 'Marcus Cole',
        mobileNumber: '+91 98765 43210',
        email: 'marcus.cole@example.com',
        completeAddress: 'Flat 402, Skyline Residency, 12th Main Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560038',
        items: [
          {
            productId: 'prod_2',
            productName: 'SHADOW MONOLITH HEAVY HOODIE',
            category: 'hoodies',
            size: 'L',
            quantity: 1,
            price: 3499,
            image: '/src/assets/images/ziproo_product_hoodie_1790610642709.jpg',
          },
          {
            productId: 'prod_1',
            productName: 'VORTEX 01 OVERSIZED TEE',
            category: 'oversized-t-shirts',
            size: 'XL',
            quantity: 1,
            price: 1499,
            image: '/src/assets/images/ziproo_product_tee_1790610656044.jpg',
          },
        ],
        subtotal: 4998,
        shipping: 0,
        totalAmount: 4998,
        paymentMethod: 'cod',
        paymentStatus: 'Pending',
        orderStatus: 'Confirmed',
        createdAt: '2026-09-27T19:30:00.000Z',
        notificationLog: {
          adminEmailSent: true,
          adminEmailRecipient: 'ziprooclothing@gmail.com',
          adminEmailTimestamp: '2026-09-27T19:30:05.000Z',
          customerSmsSent: true,
          customerSmsRecipient: '+91 98765 43210',
          customerSmsTimestamp: '2026-09-27T19:30:08.000Z',
          customerSmsContent: "Hi Marcus Cole! Thank you for ordering from ZIPROO. Your order #ZIP-2026-8901 has been received successfully. We'll keep you updated. Thank you for choosing ZIPROO!",
        },
      },
    ],
    customers: [
      {
        id: 'cust_1',
        name: 'Marcus Cole',
        email: 'marcus.cole@example.com',
        phone: '+91 98765 43210',
        address: 'Flat 402, Skyline Residency, 12th Main Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560038',
        location: 'Indiranagar, Bengaluru, Karnataka',
        registeredAt: '2026-09-26T10:00:00.000Z',
        lastLoginAt: '2026-09-28T14:30:00.000Z',
        totalOrders: 1,
      },
      {
        id: 'cust_2',
        name: 'Ananya Deshmukh',
        email: 'ananya.deshmukh@gmail.com',
        phone: '+91 98201 12345',
        address: 'Villa 14, Palm Grove Enclave, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400050',
        location: 'Bandra West, Mumbai, Maharashtra',
        registeredAt: '2026-09-27T08:15:00.000Z',
        lastLoginAt: '2026-09-29T02:10:00.000Z',
        totalOrders: 2,
      },
    ],
    messages: [
      {
        id: 'msg_1',
        name: 'Kabir Singhania',
        email: 'kabir.s@gmail.com',
        phone: '+91 99887 76655',
        location: 'DLF Phase 5, Gurugram, Haryana',
        subject: 'Bespoke Sizing & Wholesale Capsule Inquiries',
        message: 'Hello ZIPROO Atelier Team, I am deeply impressed by your 480 GSM hoodie cuts and architectural silhouettes. We are interested in curating a private showroom presentation in Delhi NCR. Could you share wholesale terms?',
        createdAt: '2026-09-28T11:45:00.000Z',
        status: 'unread',
      },
      {
        id: 'msg_2',
        name: 'Rhea Sen',
        email: 'rhea.sen@outlook.com',
        phone: '+91 98300 54321',
        location: 'Park Street, Kolkata, West Bengal',
        subject: 'Drop 01 Restock Notification Request',
        message: 'Will the Vortex 01 oversized tee in size XL be restocked soon? Love the fabric weight.',
        createdAt: '2026-09-27T16:20:00.000Z',
        status: 'read',
      },
    ],
  };
}

export function loadDatabase(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialDatabase();
    saveDatabase(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data: DatabaseSchema = JSON.parse(raw);

    // Schema migration checks:
    let modified = false;

    // Ensure Admin 1 is rohithsharma with password rohith004
    const admin1 = data.admins.find((a) => a.id === 'usr_admin_1' || a.username === 'admin_ziproo' || a.username === 'rohithsharma');
    const pwd1 = hashPassword('rohith004');
    if (admin1) {
      if (admin1.username !== 'rohithsharma' || !verifyPassword('rohith004', admin1.salt, admin1.hash)) {
        admin1.username = 'rohithsharma';
        admin1.name = 'Rohith Sharma (Founder & Creative Director)';
        admin1.role = 'Founder & Creative Director';
        admin1.salt = pwd1.salt;
        admin1.hash = pwd1.hash;
        modified = true;
      }
    } else {
      data.admins.push({
        id: 'usr_admin_1',
        username: 'rohithsharma',
        name: 'Rohith Sharma (Founder & Creative Director)',
        role: 'Founder & Creative Director',
        salt: pwd1.salt,
        hash: pwd1.hash,
        lastLogin: new Date().toISOString(),
      });
      modified = true;
    }

    // Ensure Admin 2 is ranjithkumar with password rohith004
    const admin2 = data.admins.find((a) => a.id === 'usr_admin_2' || a.username === 'manager_ziproo' || a.username === 'ranjith_ziproo' || a.username === 'ranjithkumar');
    const pwd2 = hashPassword('rohith004');
    if (admin2) {
      if (admin2.username !== 'ranjithkumar' || !verifyPassword('rohith004', admin2.salt, admin2.hash)) {
        admin2.name = 'Ranjith Kumar (Co-founder of ZIPROO)';
        admin2.role = 'Co-founder of ZIPROO';
        admin2.username = 'ranjithkumar';
        admin2.salt = pwd2.salt;
        admin2.hash = pwd2.hash;
        modified = true;
      }
    } else {
      data.admins.push({
        id: 'usr_admin_2',
        username: 'ranjithkumar',
        name: 'Ranjith Kumar (Co-founder of ZIPROO)',
        role: 'Co-founder of ZIPROO',
        salt: pwd2.salt,
        hash: pwd2.hash,
        lastLogin: new Date().toISOString(),
      });
      modified = true;
    }

    // Ensure settings has rupee symbol, youtube, and onlineReceivingPortal
    if (!data.settings.currencySymbol || data.settings.currencySymbol === '$') {
      data.settings.currencySymbol = '₹';
      data.settings.freeShippingThreshold = 1999;
      modified = true;
    }
    if (!data.settings.youtube) {
      data.settings.youtube = 'ZIPROO';
      modified = true;
    }
    if (!data.settings.adminNotificationEmail) {
      data.settings.adminNotificationEmail = 'ziprooclothing@gmail.com';
      modified = true;
    }
    if (!data.settings.onlineReceivingPortal) {
      data.settings.onlineReceivingPortal = {
        enabled: true,
        upiId: 'ziproo@upi',
        merchantName: 'ZIPROO APPAREL ATELIER',
        instructions: 'Pay directly via UPI (GPay / PhonePe / Paytm / BHIM) to UPI ID: ziproo@upi. Submit your 12-digit UTR / Transaction Reference ID during checkout.',
        bankAccountDetails: 'Account Name: ZIPROO CLOTHING | Bank: HDFC Bank | A/C No: 50200089202611 | IFSC: HDFC0001234',
      };
      modified = true;
    }

    // Convert old USD product prices into Rupees if they were small ($55 -> ₹1299 etc.)
    data.products.forEach((p) => {
      if (p.price < 200) {
        if (p.category === 'hoodies') p.price = 3499;
        else if (p.category === 'pants') p.price = 2899;
        else if (p.category === 'shirts') p.price = 2199;
        else if (p.category === 'oversized-t-shirts') p.price = 1499;
        else p.price = 1299;
        if (p.originalPrice && p.originalPrice < 300) {
          p.originalPrice = Math.round(p.price * 1.25);
        }
        modified = true;
      }
      if (!p.reviews) {
        p.reviews = [];
        p.rating = p.rating || 4.9;
        p.reviewsCount = p.reviewsCount || 12;
        modified = true;
      }
      if (p.shippingCharge === undefined) {
        p.shippingCharge = 0;
        modified = true;
      }
      if (p.piecesAvailable === undefined) {
        p.piecesAvailable = p.stockCount || 120;
        modified = true;
      }
      if (!p.productLink) {
        p.productLink = `/?product=${p.id}`;
        modified = true;
      }
    });

    // Ensure customers array exists
    if (!data.customers) {
      data.customers = [
        {
          id: 'cust_1',
          name: 'Marcus Cole',
          email: 'marcus.cole@example.com',
          phone: '+91 98765 43210',
          address: 'Flat 402, Skyline Residency, 12th Main Road, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pinCode: '560038',
          location: 'Indiranagar, Bengaluru, Karnataka',
          registeredAt: '2026-09-26T10:00:00.000Z',
          lastLoginAt: '2026-09-28T14:30:00.000Z',
          totalOrders: 1,
        },
        {
          id: 'cust_2',
          name: 'Ananya Deshmukh',
          email: 'ananya.deshmukh@gmail.com',
          phone: '+91 98201 12345',
          address: 'Villa 14, Palm Grove Enclave, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pinCode: '400050',
          location: 'Bandra West, Mumbai, Maharashtra',
          registeredAt: '2026-09-27T08:15:00.000Z',
          lastLoginAt: '2026-09-29T02:10:00.000Z',
          totalOrders: 2,
        },
      ];
      modified = true;
    }

    // Ensure messages array exists
    if (!data.messages) {
      data.messages = [
        {
          id: 'msg_1',
          name: 'Kabir Singhania',
          email: 'kabir.s@gmail.com',
          phone: '+91 99887 76655',
          location: 'DLF Phase 5, Gurugram, Haryana',
          subject: 'Bespoke Sizing & Wholesale Capsule Inquiries',
          message: 'Hello ZIPROO Atelier Team, I am deeply impressed by your 480 GSM hoodie cuts and architectural silhouettes. We are interested in curating a private showroom presentation in Delhi NCR. Could you share wholesale terms?',
          createdAt: '2026-09-28T11:45:00.000Z',
          status: 'unread',
        },
        {
          id: 'msg_2',
          name: 'Rhea Sen',
          email: 'rhea.sen@outlook.com',
          phone: '+91 98300 54321',
          location: 'Park Street, Kolkata, West Bengal',
          subject: 'Drop 01 Restock Notification Request',
          message: 'Will the Vortex 01 oversized tee in size XL be restocked soon? Love the fabric weight.',
          createdAt: '2026-09-27T16:20:00.000Z',
          status: 'read',
        },
      ];
      modified = true;
    }

    // Ensure every order has a customerId linked to its customer
    if (data.orders && Array.isArray(data.orders)) {
      data.customers = data.customers || [];
      data.orders.forEach((o) => {
        if (!o.customerId) {
          const cleanEmail = (o.email || '').trim().toLowerCase();
          const cleanPhone = (o.mobileNumber || '').replace(/\D/g, '');
          let cust = data.customers.find((c) => {
            const cEmail = (c.email || '').trim().toLowerCase();
            const cPhone = (c.phone || '').replace(/\D/g, '');
            return (cleanEmail && cEmail === cleanEmail) || (cleanPhone && cPhone === cleanPhone);
          });

          if (!cust) {
            cust = {
              id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name: o.customerName || 'ZIPROO Client',
              email: cleanEmail || `${cleanPhone}@ziproo-customer.com`,
              phone: o.mobileNumber || '',
              address: o.completeAddress || '',
              city: o.city || '',
              state: o.state || '',
              pinCode: o.pinCode || '',
              location: o.city ? `${o.city}, ${o.state}` : '',
              registeredAt: o.createdAt || new Date().toISOString(),
              lastLoginAt: o.createdAt || new Date().toISOString(),
              totalOrders: 1,
            };
            data.customers.push(cust);
          }
          o.customerId = cust.id;
          modified = true;
        }
      });
    }

    if (modified) {
      saveDatabase(data);
    }

    return data;
  } catch (err) {
    console.error('Failed to parse database, resetting to initial seed:', err);
    const initial = getInitialDatabase();
    saveDatabase(initial);
    return initial;
  }
}

export function saveDatabase(data: DatabaseSchema): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}
