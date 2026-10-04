import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Products
export const getProducts = () => api.get("/products");

export const getProduct = (id) =>
  api.get(`/products/${id}`);

export const createProduct = (product) =>
  api.post("/products", product);

export const updateProduct = (id, product) =>
  api.put(`/products/${id}`, product);

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`);

// Orders
export const getOrders = () =>
  api.get("/orders");

export const getOrder = (id) =>
  api.get(`/orders/${id}`);

export const createOrder = (order) =>
  api.post("/orders", order);

export const updateOrderStatus = (id, status) =>
  api.put(`/orders/${id}/status`, { status });

// Inventory
export const getInventory = () =>
  api.get("/inventory");

export const getLowStock = () =>
  api.get("/inventory/low-stock");

// Health
export const getHealth = () =>
  api.get("/health");

export default api;