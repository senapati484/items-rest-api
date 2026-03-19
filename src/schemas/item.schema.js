const { z } = require('zod');

const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === 'true') {
      return true;
    }

    if (normalizedValue === 'false') {
      return false;
    }
  }

  return value;
}, z.boolean().optional());

const createItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  price: z.number({ required_error: 'Price is required' }).nonnegative('Price cannot be negative'),
  inStock: z.boolean().optional().default(true),
  category: z.string().max(50, 'Category cannot exceed 50 characters').optional(),
  sku: z
    .string()
    .max(50, 'SKU cannot exceed 50 characters')
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});

const updateItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  price: z.number().nonnegative('Price cannot be negative').optional(),
  inStock: z.boolean().optional(),
  category: z
    .string()
    .max(50, 'Category cannot exceed 50 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  sku: z
    .string()
    .max(50, 'SKU cannot exceed 50 characters')
    .nullable()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});

const itemQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().max(100).optional().default(''),
  sortBy: z.enum(['name', 'price', 'createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  category: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  inStock: booleanQuerySchema,
});

module.exports = {
  createItemSchema,
  updateItemSchema,
  itemQuerySchema,
};
