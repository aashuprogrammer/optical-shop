const API_BASE = '';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('optisuite_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // sends cookies
    });

    const contentType = res.headers.get('content-type') || '';
    let data: any;

    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = {
        success: res.ok,
        error: res.ok ? undefined : text || `HTTP ${res.status}: ${res.statusText}`,
        message: text,
      };
    }

    if (!res.ok && res.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('optisuite_token');
        localStorage.removeItem('optisuite_user');
        window.location.href = '/login';
      }
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network request failed',
    };
  }
}

// API methods
export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    fetchApi('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => fetchApi('/api/v1/auth/logout', { method: 'POST' }),
  me: () => fetchApi('/api/v1/auth/me'),
  updatePassword: (body: any) =>
    fetchApi('/api/v1/auth/password', { method: 'PUT', body: JSON.stringify(body) }),
  updateProfilePhoto: (profile_image_url: string) =>
    fetchApi('/api/v1/auth/profile-photo', { method: 'PUT', body: JSON.stringify({ profile_image_url }) }),

  // File Upload (Multipart & R2/Local)
  uploadFile: async (file: File, category: string = 'general'): Promise<ApiResponse<{ url: string; key: string }>> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('optisuite_token') : null;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: 'include',
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Upload failed' };
    }
  },

  // Shop
  getShop: () => fetchApi('/api/v1/shop'),
  updateShop: (body: any) =>
    fetchApi('/api/v1/shop', { method: 'PUT', body: JSON.stringify(body) }),

  // Customers
  getCustomers: (params?: { search?: string; filter?: string; city?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchApi(`/api/v1/customers?${q}`);
  },
  getCustomer: (id: number) => fetchApi(`/api/v1/customers/${id}`),
  createCustomer: (body: any) =>
    fetchApi('/api/v1/customers', { method: 'POST', body: JSON.stringify(body) }),
  updateCustomer: (id: number, body: any) =>
    fetchApi(`/api/v1/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCustomer: (id: number) =>
    fetchApi(`/api/v1/customers/${id}`, { method: 'DELETE' }),
  addCustomerNote: (id: number, note: string) =>
    fetchApi(`/api/v1/customers/${id}/notes`, { method: 'POST', body: JSON.stringify({ note }) }),
  getCustomerCities: () => fetchApi('/api/v1/customers/cities'),

  // Eye Tests
  getEyeTests: (params?: { search?: string; from?: string; to?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchApi(`/api/v1/eye-tests?${q}`);
  },
  getEyeTest: (id: number) => fetchApi(`/api/v1/eye-tests/${id}`),
  createEyeTest: (body: any) =>
    fetchApi('/api/v1/eye-tests', { method: 'POST', body: JSON.stringify(body) }),
  transpose: (body: { sph: number; cyl: number; axis: number }) =>
    fetchApi('/api/v1/eye-tests/transpose', { method: 'POST', body: JSON.stringify(body) }),
  convertToCL: (body: { sph: number; cyl: number; axis: number; vertex_distance?: number }) =>
    fetchApi('/api/v1/eye-tests/convert-cl', { method: 'POST', body: JSON.stringify(body) }),

  // Products
  getProducts: (params?: { search?: string; category?: string; stock?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchApi(`/api/v1/products?${q}`);
  },
  getProduct: (id: number) => fetchApi(`/api/v1/products/${id}`),
  createProduct: (body: any) =>
    fetchApi('/api/v1/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id: number, body: any) =>
    fetchApi(`/api/v1/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  adjustStock: (id: number, body: { quantity: number; movement_type?: string; notes?: string }) =>
    fetchApi(`/api/v1/products/${id}/stock`, { method: 'POST', body: JSON.stringify(body) }),
  getLowStock: () => fetchApi('/api/v1/products/low-stock'),
  deleteProduct: (id: number) =>
    fetchApi(`/api/v1/products/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params?: { search?: string; status?: string; payment_status?: string; order_type?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchApi(`/api/v1/orders?${q}`);
  },
  getOrder: (id: number) => fetchApi(`/api/v1/orders/${id}`),
  createOrder: (body: any) =>
    fetchApi('/api/v1/orders', { method: 'POST', body: JSON.stringify(body) }),
  updateOrder: (id: number, body: any) =>
    fetchApi(`/api/v1/orders/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateOrderStatus: (id: number, body: { status: string; notes?: string }) =>
    fetchApi(`/api/v1/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
  addOrderPayment: (id: number, body: any) =>
    fetchApi(`/api/v1/orders/${id}/payments`, { method: 'POST', body: JSON.stringify(body) }),
  getOrdersDue: (date?: string) =>
    fetchApi(`/api/v1/orders/due?date=${date || ''}`),
  cancelOrder: (id: number) =>
    fetchApi(`/api/v1/orders/${id}/cancel`, { method: 'POST' }),

  // Repairs & Services (Dedicated Repairing Section)
  getRepairs: (params?: { search?: string; status?: string; repair_type?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchApi(`/api/v1/repairs?${q}`);
  },
  getRepair: (id: number) => fetchApi(`/api/v1/repairs/${id}`),
  getRepairStats: () => fetchApi('/api/v1/repairs/stats'),
  createRepair: (body: any) =>
    fetchApi('/api/v1/repairs', { method: 'POST', body: JSON.stringify(body) }),
  updateRepair: (id: number, body: any) =>
    fetchApi(`/api/v1/repairs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateRepairStatus: (id: number, status: string) =>
    fetchApi(`/api/v1/repairs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteRepair: (id: number) =>
    fetchApi(`/api/v1/repairs/${id}`, { method: 'DELETE' }),

  // Vendors & Purchases
  getVendors: () => fetchApi('/api/v1/vendors'),
  getVendor: (id: number) => fetchApi(`/api/v1/vendors/${id}`),
  createVendor: (body: any) =>
    fetchApi('/api/v1/vendors', { method: 'POST', body: JSON.stringify(body) }),
  updateVendor: (id: number, body: any) =>
    fetchApi(`/api/v1/vendors/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteVendor: (id: number) => fetchApi(`/api/v1/vendors/${id}`, { method: 'DELETE' }),
  getPurchaseBills: (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    return fetchApi(`/api/v1/purchases/bills?${q}`);
  },
  getPurchaseBill: (id: number) => fetchApi(`/api/v1/purchases/bills/${id}`),
  createPurchaseBill: (body: any) =>
    fetchApi('/api/v1/purchases/bills', { method: 'POST', body: JSON.stringify(body) }),
  recordVendorPayment: (body: any) =>
    fetchApi('/api/v1/purchases/payments', { method: 'POST', body: JSON.stringify(body) }),

  // Expenses
  getExpenses: (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    return fetchApi(`/api/v1/expenses?${q}`);
  },
  createExpense: (body: any) =>
    fetchApi('/api/v1/expenses', { method: 'POST', body: JSON.stringify(body) }),
  getExpenseCategories: () => fetchApi('/api/v1/expenses/categories'),
  createExpenseCategory: (name: string) =>
    fetchApi('/api/v1/expenses/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteExpense: (id: number) => fetchApi(`/api/v1/expenses/${id}`, { method: 'DELETE' }),

  // Reports & Stats
  getDashboardStats: () => fetchApi('/api/v1/reports/overview'),
  getRevenueChart: (period?: string) => fetchApi(`/api/v1/reports/revenue?period=${period || 'week'}`),
  getGSTReport: (from?: string, to?: string) =>
    fetchApi(`/api/v1/reports/gst?from=${from || ''}&to=${to || ''}`),
  getTopProducts: () => fetchApi('/api/v1/reports/top-products'),
  getStockValuation: () => fetchApi('/api/v1/reports/stock-valuation'),
  getPaymentModes: () => fetchApi('/api/v1/reports/payment-modes'),

  // Settings & Users
  getSettings: () => fetchApi('/api/v1/settings'),
  upsertSetting: (key: string, value: string) =>
    fetchApi('/api/v1/settings', { method: 'POST', body: JSON.stringify({ key, value }) }),
  getUsers: () => fetchApi('/api/v1/settings/users'),
  createUser: (body: any) =>
    fetchApi('/api/v1/settings/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: number, body: any) =>
    fetchApi(`/api/v1/settings/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id: number) => fetchApi(`/api/v1/settings/users/${id}`, { method: 'DELETE' }),
  getActivityLogs: () => fetchApi('/api/v1/settings/activity-logs'),
};
