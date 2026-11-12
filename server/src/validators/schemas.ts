import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  storeName: z.string().trim().min(2, 'Store name must be at least 2 characters').max(120),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const productCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    sku: z.string().trim().min(1).max(64),
    description: z.string().max(4000).optional().default(''),
    shortDescription: z.string().max(300).optional().default(''),
    categoryId: objectId.nullish(),
    price: z.coerce.number().min(0, 'Price cannot be negative'),
    compareAtPrice: z.coerce.number().min(0).nullish(),
    stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
    lowStockThreshold: z.coerce.number().int().min(0).nullish(),
    imageUrl: z.string().max(2000).optional().default(''),
    status: z.enum(['active', 'archived']).optional(),
    tags: z.array(z.string().trim().max(40)).max(20).optional(),
    keywords: z.array(z.string().trim().max(40)).max(30).optional(),
  })
  .strict();

export const productUpdateSchema = productCreateSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(120).optional(),
  categoryId: z.string().trim().optional(),
  status: z.enum(['active', 'archived', 'all']).optional(),
  stock: z.enum(['low', 'out', 'in']).optional(),
  sort: z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'name']).optional(),
});

export const orderItemSchema = z.object({
  productId: objectId,
  quantity: z.coerce.number().int().min(1).max(999),
});

export const orderCreateSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Add at least one item').max(50),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().max(40).optional().default(''),
    address: z
      .object({
        line1: z.string().max(200).optional().default(''),
        line2: z.string().max(200).optional().default(''),
        city: z.string().max(100).optional().default(''),
        state: z.string().max(100).optional().default(''),
        postalCode: z.string().max(30).optional().default(''),
        country: z.string().max(60).optional().default(''),
      })
      .optional(),
  }),
  notes: z.string().max(1000).optional().default(''),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  note: z.string().max(500).optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(120).optional(),
  status: z.string().trim().optional(),
  paymentStatus: z.string().trim().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
});

export const createPayPalOrderSchema = z.object({
  orderId: objectId,
  orderNumber: z.string().trim().min(3).max(40),
});

export const capturePayPalOrderSchema = z.object({
  paypalOrderId: z.string().trim().min(6).max(64),
  orderId: objectId.optional(),
});

export const chatSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(2000),
  conversationId: objectId.nullish(),
  customerEmail: z.string().trim().email().optional(),
  language: z.string().trim().max(10).optional(),
});

export const recommendSchema = z.object({
  query: z.string().trim().min(1).max(500),
  limit: z.coerce.number().int().min(1).max(6).optional(),
  budget: z.coerce.number().min(0).nullish(),
  category: z.string().trim().max(80).optional(),
});

export const generateDescriptionSchema = z.object({
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().max(80).optional(),
  specs: z.string().trim().max(2000).optional(),
  tone: z.enum(['professional', 'friendly', 'luxury', 'technical']).optional(),
});

export const inventoryAdjustSchema = z.object({
  newStock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  reason: z.string().trim().min(3, 'Give a reason for the adjustment').max(300),
});

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(120).optional(),
  filter: z.enum(['all', 'low', 'out']).optional(),
});

export const movementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  productId: z.string().trim().optional(),
  type: z.string().trim().optional(),
});

export const notificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  unreadOnly: z.enum(['true', 'false']).optional(),
});

export const analyticsRangeSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
});
