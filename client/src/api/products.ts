import { apiFetch } from "../api";

// Fetch all products
export async function fetchProducts() {
  return apiFetch("/api/products");
}

// Fetch a single product
export async function fetchProduct(id: string) {
  return apiFetch(`/api/products/${id}`);
}

// Create new product
export async function createProduct(productData: any) {
  return apiFetch("/api/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });
}

// Update product
export async function updateProduct(id: string, data: any) {
  return apiFetch(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete product
export async function deleteProduct(id: string) {
  return apiFetch(`/api/products/${id}`, {
    method: "DELETE",
  });
}
