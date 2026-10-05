// Automated Verification Test for ZIPROO features & security
import http from 'http';
import { generateToken } from './src/server/auth.js';

function makeRequest(options: http.RequestOptions, postData?: any): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode || 0, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode || 0, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING COMPREHENSIVE ZIPROO SUITE TESTS ===\n');
  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition: boolean, msg: string) {
    testsTotal++;
    if (condition) {
      console.log(`[PASS] ${msg}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Register Customer A
    console.log('\n--- 1. Testing Customer A Registration & Order Placement ---');
    const custAEmail = `customer_a_${Date.now()}@ziproo.test`;
    const regARes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/customers/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Aarav Patel',
        email: custAEmail,
        phone: '9876543210',
        address: '42 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560001',
      }
    );
    assert(regARes.status === 201, `Customer A registration returned 201 (got ${regARes.status})`);
    const tokenA = regARes.data.token;
    assert(!!tokenA, 'Customer A received auth token');

    // Customer A places an order
    const orderARes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
      },
      {
        customerName: 'Aarav Patel',
        mobileNumber: '9876543210',
        email: custAEmail,
        completeAddress: '42 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: '560001',
        paymentMethod: 'cod',
        items: [
          {
            productId: 'prod_1',
            productName: 'VORTEX 01 OVERSIZED TEE',
            category: 'oversized-t-shirts',
            size: 'L',
            quantity: 1,
            price: 1499,
          },
        ],
      }
    );
    assert(orderARes.status === 201, `Order A created successfully with 201 (got ${orderARes.status})`);
    const orderA = orderARes.data.order;
    assert(!!orderA?.id, 'Order A received order ID');
    assert(!!orderA?.taxSummary, 'Order A includes backend-calculated taxSummary');
    console.log(`Order A taxSummary: CGST=₹${orderA.taxSummary.cgst}, SGST=₹${orderA.taxSummary.sgst}, TotalTax=₹${orderA.taxSummary.totalTax}`);

    // 2. Register Customer B
    console.log('\n--- 2. Testing Customer B Registration & Order Placement ---');
    const custBEmail = `customer_b_${Date.now()}@ziproo.test`;
    const regBRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/customers/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Bhavna Sharma',
        email: custBEmail,
        phone: '9811223344',
        address: '15 Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400020',
      }
    );
    assert(regBRes.status === 201, `Customer B registration returned 201 (got ${regBRes.status})`);
    const tokenB = regBRes.data.token;
    assert(!!tokenB, 'Customer B received auth token');

    // Customer B places an order
    const orderBRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`,
        },
      },
      {
        customerName: 'Bhavna Sharma',
        mobileNumber: '9811223344',
        email: custBEmail,
        completeAddress: '15 Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400020',
        paymentMethod: 'cod',
        items: [
          {
            productId: 'prod_2',
            productName: 'SHADOW MONOLITH HEAVY HOODIE',
            category: 'hoodies',
            size: 'M',
            quantity: 1,
            price: 3499,
          },
        ],
      }
    );
    assert(orderBRes.status === 201, `Order B created successfully with 201 (got ${orderBRes.status})`);
    const orderB = orderBRes.data.order;

    // 3. Customer Isolation & Multiple Customers
    console.log('\n--- 3. Testing Customer Orders Isolation (Multiple Customers) ---');
    const ordersARes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/customers/orders',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(ordersARes.status === 200, 'Customer A can fetch orders with 200');
    const ordersA = ordersARes.data.orders || [];
    assert(ordersA.some((o: any) => o.id === orderA.id), "Customer A's orders include Order A");
    assert(!ordersA.some((o: any) => o.id === orderB.id), "Customer A's orders DO NOT include Customer B's order");

    const ordersBRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/customers/orders',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(ordersBRes.status === 200, 'Customer B can fetch orders with 200');
    const ordersB = ordersBRes.data.orders || [];
    assert(ordersB.some((o: any) => o.id === orderB.id), "Customer B's orders include Order B");
    assert(!ordersB.some((o: any) => o.id === orderA.id), "Customer B's orders DO NOT include Customer A's order");

    // 4. Backend Security & Direct Tampering Resistance
    console.log('\n--- 4. Testing Backend Security & Direct API Tampering ---');
    // Unauthenticated request should be 401
    const unauthRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/customers/orders',
      method: 'GET',
    });
    assert(unauthRes.status === 401, `Unauthenticated request returned 401 (got ${unauthRes.status})`);

    // Customer B trying to directly access Customer A's order by ID must return 403 Forbidden
    const crossAccessRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/customers/orders/${orderA.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(crossAccessRes.status === 403, `Customer B accessing Customer A order returned 403 Forbidden (got ${crossAccessRes.status})`);

    // 5. Admin Authentication & Access to All Orders
    console.log('\n--- 5. Testing Admin Portal Access ---');
    const adminToken = generateToken({
      id: 'usr_admin_1',
      username: 'rohithsharma',
      name: 'Rohith Sharma (Founder & Creative Director)',
      role: 'Founder & Creative Director',
    });
    assert(!!adminToken, 'Admin token generated successfully');

    const allOrdersRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(allOrdersRes.status === 200, 'Admin can fetch all orders');
    const allOrders = Array.isArray(allOrdersRes.data) ? allOrdersRes.data : [];
    assert(allOrders.some((o: any) => o.id === orderA.id), 'Admin orders include Order A');
    assert(allOrders.some((o: any) => o.id === orderB.id), 'Admin orders include Order B');

    // 6. Product Stock Management (IN STOCK / OUT OF STOCK)
    console.log('\n--- 6. Testing Product Stock Management (IN / OUT OF STOCK) ---');
    // Admin sets product 1 to OUT OF STOCK
    const setOutOfStockRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/products/prod_1',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      { inStock: false }
    );
    assert(setOutOfStockRes.status === 200, 'Admin set prod_1 to OUT OF STOCK');
    assert(setOutOfStockRes.data.inStock === false, 'Product prod_1 is now out of stock');

    // Customer attempts to checkout OUT OF STOCK product -> must fail with 400
    const failOrderRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`,
        },
      },
      {
        customerName: 'Bhavna Sharma',
        mobileNumber: '9811223344',
        email: custBEmail,
        completeAddress: '15 Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400020',
        paymentMethod: 'cod',
        items: [
          {
            productId: 'prod_1',
            productName: 'VORTEX 01 OVERSIZED TEE',
            category: 'oversized-t-shirts',
            size: 'L',
            quantity: 1,
            price: 1499,
          },
        ],
      }
    );
    assert(failOrderRes.status === 400, `Checkout for OUT OF STOCK product failed with 400 as expected (got ${failOrderRes.status})`);
    console.log(`Server stock rejection message: "${failOrderRes.data.error}"`);

    // Admin sets prod_1 back to IN STOCK
    const setInStockRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/products/prod_1',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      { inStock: true }
    );
    assert(setInStockRes.status === 200, 'Admin restored prod_1 to IN STOCK');
    assert(setInStockRes.data.inStock === true, 'prod_1 is now IN STOCK again');

    // 7. Product Gallery (3-4 images) & GST Fields
    console.log('\n--- 7. Testing 3-4 Product Images & GST Configuration ---');
    const updateImagesRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/products/prod_1',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        images: [
          '/src/assets/images/ziproo_product_tee_1790610656044.jpg',
          '/src/assets/images/ziproo_tee_back_1791053935583.jpg',
          '/src/assets/images/ziproo_tee_macro_1791053949356.jpg',
          '/src/assets/images/ziproo_tee_side_1791053962419.jpg',
        ],
        gstApplicable: true,
        gstRate: 12,
        hsnCode: '6109',
        taxInclusive: true,
      }
    );
    assert(updateImagesRes.status === 200, 'Product images & GST updated successfully');
    assert(updateImagesRes.data.images?.length === 4, 'Product has 4 gallery images configured');
    assert(updateImagesRes.data.gstRate === 12, 'Product has 12% GST rate');
    assert(updateImagesRes.data.hsnCode === '6109', 'Product has HSN 6109');

    console.log(`\n========================================`);
    console.log(`TEST RESULTS: ${testsPassed}/${testsTotal} passed (${Math.round((testsPassed / testsTotal) * 100)}%)`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Test execution failed with exception:', err);
    process.exit(1);
  }
}

runTests();
