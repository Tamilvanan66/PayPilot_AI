/**
 * Seed script — creates a demo store, owner account, categories and products.
 * Usage: npm run seed --workspace server
 * Credentials: demo@paypilot.ai / DemoPass123!
 */
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { Store } from './models/Store.js';
import { User, hashPassword } from './models/User.js';
import { Category } from './models/Category.js';
import { Product } from './models/Product.js';
import { InventoryMovement } from './models/InventoryMovement.js';
import { Notification } from './models/Notification.js';

const CATEGORIES = [
  { name: 'Audio', slug: 'audio', description: 'Headphones, earbuds and speakers' },
  { name: 'Wearables', slug: 'wearables', description: 'Watches and fitness trackers' },
  { name: 'Accessories', slug: 'accessories', description: 'Chargers, cables and stands' },
  { name: 'Smart Home', slug: 'smart-home', description: 'Connected home devices' },
];

const PRODUCTS = [
  { cat: 'audio', name: 'Pulse ANC Headphones', sku: 'AUD-ANC-01', price: 249.0, stock: 18, short: 'Hybrid noise cancelling over-ear headphones with 40h battery.' },
  { cat: 'audio', name: 'Echo Buds Mini', sku: 'AUD-BUD-02', price: 89.0, stock: 42, short: 'Compact true-wireless earbuds with ambient mode.' },
  { cat: 'audio', name: 'Boom Portable Speaker', sku: 'AUD-SPK-03', price: 129.5, stock: 3, short: 'IPX7 waterproof speaker with deep bass and 20h playback.' },
  { cat: 'wearables', name: 'Nova Smartwatch S2', sku: 'WER-WCH-01', price: 199.0, stock: 12, short: 'AMOLED smartwatch with SpO2, GPS and 10-day battery.' },
  { cat: 'wearables', name: 'Stride Fitness Band', sku: 'WER-BND-02', price: 59.0, stock: 0, short: 'Lightweight activity band with sleep and heart-rate tracking.' },
  { cat: 'accessories', name: 'Flux 65W GaN Charger', sku: 'ACC-CHG-01', price: 45.0, stock: 64, short: 'Three-port GaN charger, laptop-class 65W output.' },
  { cat: 'accessories', name: 'Braided USB-C Cable 2m', sku: 'ACC-CBL-02', price: 19.0, stock: 120, short: '240W rated braided USB-C cable with 2m reach.' },
  { cat: 'accessories', name: 'Lift Laptop Stand', sku: 'ACC-STD-03', price: 69.0, stock: 4, short: 'Aluminium adjustable stand for 11–17 inch laptops.' },
  { cat: 'smart-home', name: 'Halo Smart Bulb Pack', sku: 'HOM-BLB-01', price: 39.0, stock: 55, short: 'Four colour smart bulbs, no hub required.' },
  { cat: 'smart-home', name: 'Vigil Indoor Camera', sku: 'HOM-CAM-02', price: 79.0, stock: 9, short: '1080p indoor camera with local storage and motion alerts.' },
];

async function main() {
  await connectDatabase();
  console.log('[seed] connected');

  const email = 'demo@paypilot.ai';
  await User.deleteOne({ email });
  const existing = await Store.findOne({ slug: 'paypilot-demo' });
  if (existing) {
    await Product.deleteMany({ storeId: existing._id });
    await Category.deleteMany({ storeId: existing._id });
    await Notification.deleteMany({ storeId: existing._id });
    await InventoryMovement.deleteMany({ storeId: existing._id });
    await Store.deleteOne({ _id: existing._id });
  }

  const store = await Store.create({
    name: 'PayPilot Demo Store',
    slug: 'paypilot-demo',
    description: 'Demo storefront used to exercise every PayPilot AI feature.',
    currency: 'USD',
    supportEmail: 'support@paypilot.ai',
  });

  const cats = await Category.insertMany(
    CATEGORIES.map((c) => ({ ...c, storeId: store._id })),
  );
  const catMap = new Map(cats.map((c) => [c.slug, c._id]));

  const products = await Product.insertMany(
    PRODUCTS.map((p) => ({
      storeId: store._id,
      name: p.name,
      sku: p.sku,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: `${p.short} Backed by a 12-month limited warranty and free returns within 30 days.`,
      shortDescription: p.short,
      categoryId: catMap.get(p.cat),
      price: p.price,
      stock: p.stock,
      currency: 'USD',
      tags: [p.cat],
    })),
  );

  await InventoryMovement.insertMany(
    products.map((p) => ({
      storeId: store._id,
      productId: p._id,
      type: 'initial',
      quantityChange: p.stock,
      previousStock: 0,
      newStock: p.stock,
      reason: 'Seed initial stock',
      idempotencyKey: `seed:${String(p._id)}`,
    })),
  );

  await User.create({
    name: 'Demo Owner',
    email,
    passwordHash: await hashPassword('DemoPass123!'),
    role: 'owner',
    storeId: store._id,
  });

  await Notification.create({
    storeId: store._id,
    type: 'insight',
    severity: 'info',
    title: 'Demo store seeded',
    body: `${products.length} products across ${cats.length} categories are ready.`,
    link: '/dashboard',
  });

  console.log(`[seed] done. Login: ${email} / DemoPass123!`);
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error('[seed] failed', err);
  await disconnectDatabase();
  process.exit(1);
});
