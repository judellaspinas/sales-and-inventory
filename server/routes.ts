// src/api.ts
const BASE_URL = "https://sales-inventory-management.onrender.com";

export interface IUser {
  id: string;
  username: string;
  role: string;
  [key: string]: any;
}

export interface IProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  [key: string]: any;
}

export interface ISaleItem {
  id: string;
  quantity: number;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/* -------------------- AUTH -------------------- */
export const authApi = {
  login: (username: string, password: string) =>
    request<{ user: IUser; session: any }>("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  register: (data: { username: string; password: string; confirmPassword: string; role?: string }) =>
    request<{ user: IUser }>("/api/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<{ message: string }>("/api/logout", {
      method: "POST",
    }),
};

/* -------------------- PRODUCTS -------------------- */
export const productApi = {
  getAll: () => request<IProduct[]>("/api/products"),
  get: (id: string) => request<IProduct>(`/api/products/${id}`),
  create: (product: IProduct) =>
    request<IProduct>("/api/products", {
      method: "POST",
      body: JSON.stringify(product),
    }),
  update: (id: string, updates: Partial<IProduct>) =>
    request<IProduct>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),
  delete: (id: string) =>
    request<{ message: string }>(`/api/products/${id}`, {
      method: "DELETE",
    }),
  deductStock: (id: string, quantity: number) =>
    request<{ message: string; product: IProduct }>(
      `/api/products/${id}/deduct`,
      {
        method: "POST",
        body: JSON.stringify({ quantity }),
      }
    ),
};

/* -------------------- SALES -------------------- */
export const salesApi = {
  createSale: (items: ISaleItem[]) =>
    request<{ message: string; totalAmount: number; saleRecords: any[] }>(
      "/api/sales",
      {
        method: "POST",
        body: JSON.stringify({ items }),
      }
    ),
  getSalesReport: () => request<any[]>("/api/sales"),
};

/* -------------------- REPORTS -------------------- */
export const reportApi = {
  getReport: (period: "daily" | "weekly") =>
    request<any[]>(`/api/reports/${period}`),
};

/* -------------------- ADMIN -------------------- */
export const adminApi = {
  resetPassword: (username: string, newPassword: string) =>
    request<{ message: string }>("/api/admin/reset-password", {
      method: "POST",
      body: JSON.stringify({ username, newPassword }),
    }),
  getAccounts: () => request<IUser[]>("/api/admin/accounts"),
};
