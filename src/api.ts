import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchProducts = (params?: Record<string, string>) => API.get("/products", { params });
export const sendExpertInquiry = (data: { name: string; email: string; phone?: string; subject: string; message: string; website?: string }) => API.post("/contact/expert", data);
export const register = (data: { fullName: string; email: string; password: string; phone: string; address: string }) => API.post("/auth/register", data);
export const login = (email: string, password: string) => API.post("/auth/login", { email, password });
export const fetchMe = () => API.get("/auth/me");
export const updateProfile = (data: { fullName: string; email: string; phone: string; address: string; region?: string; province?: string; city?: string; barangay?: string; postalCode?: string; profileImage?: string | null }) => API.patch("/auth/me", data);
export const changePassword = (currentPassword: string, newPassword: string) => API.post("/auth/change-password", { currentPassword, newPassword });
export const setPassword = (newPassword: string) => API.post("/auth/set-password", { newPassword });
export const verifyAccount = (userId: string, channel: "EMAIL" | "PHONE", code: string) => API.post("/auth/verify", { userId, channel, code });
export const resendVerification = (userId: string, channel: "EMAIL" | "PHONE") => API.post("/auth/verification/send", { userId, channel });
export const fetchCart = () => API.get("/cart");
export const addToCart = (productId: string, quantity: number) => API.post("/cart/items", { productId, quantity });
export const updateCartItem = (cartItemId: string, quantity: number) => API.patch(`/cart/items/${cartItemId}`, { quantity });
export const removeCartItem = (cartItemId: string) => API.delete(`/cart/items/${cartItemId}`);
export const clearCart = () => API.delete("/cart/items");
export const fetchOrders = () => API.get("/orders");
export const placeOrder = (data: { addressId: string; paymentMethod: "COD" | "GCash"; itemIds?: string[] }) => API.post("/orders", data);
export const fetchOrderPayment = (id: string) => API.get(`/orders/${encodeURIComponent(id)}/payment`);
export const cancelOrder = (id: string) => API.post(`/orders/${id}/cancel`);
export const fetchAddresses = () => API.get("/addresses");
export const createAddress = (data: Record<string, string | boolean>) => API.post("/addresses", data);
export const updateOrderStatusAPI = (id: string, status: string) => API.patch(`/admin/orders/${id}/status`, { status });
export const fetchAdminOrders = () => API.get("/admin/orders");
export const fetchAdminCustomers = () => API.get("/admin/customers");
export const createAdminProduct = (data: Record<string, unknown>) => API.post("/admin/products", data);
export const updateAdminProduct = (id: string, data: Record<string, unknown>) => API.patch(`/admin/products/${id}`, data);
export const deleteAdminProduct = (id: string) => API.delete(`/admin/products/${id}`);
