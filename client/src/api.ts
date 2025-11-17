// src/api.ts

// Use environment variable for production; fallback to localhost for dev
export const BASE_API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

// Helper fetch wrapper for JSON + error handling
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_API_URL}${endpoint}`, {
    credentials: "include", // include cookies/session
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API request failed: ${res.status} ${text}`);
  }

  return res.json();
}
