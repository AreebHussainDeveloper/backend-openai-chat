export const PRODUCTS_API_TAG = 'Products';
export const PRODUCTS_API_PREFIX = 'products';

export const PRODUCTS_API_OPTIONS = {
  website: {
    path: 'website',
    operation: { summary: 'Get public website products' },
  },
  dashboard: {
    path: 'dashboard',
    operation: { summary: 'Get all products for dashboard' },
  },
  create: {
    path: '',
    operation: { summary: 'Create a product (dashboard account only)' },
  },
  update: {
    path: ':id',
    operation: { summary: 'Update a product (dashboard account only)' },
  },
  delete: {
    path: ':id',
    operation: { summary: 'Delete a product (dashboard account only)' },
  },
} as const;
