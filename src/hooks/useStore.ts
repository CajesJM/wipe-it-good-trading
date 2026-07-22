import { useCallback, useEffect, useState } from "react";
import type { CartItem, Order, Product, User } from "../utils/types";
import type { OrderStatus, PaymentMethod } from "../utils/constants";
import * as api from "../api";

type Address = {
  id: string;
  recipientName: string;
  phone: string;
  line1: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
};
type State = {
  products: Product[];
  cart: CartItem[];
  user: User | null;
  orders: Order[];
  users: User[];
  addresses: Address[];
  loading: boolean;
  error: string | null;
};
let state: State = {
  products: [],
  cart: [],
  user: null,
  orders: [],
  users: [],
  addresses: [],
  loading: false,
  error: null,
};
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const setLoading = (loading: boolean) => {
  state.loading = loading;
  notify();
};

const toProduct = (item: any): Product => ({
  id: item.id,
  name: item.name,
  price: Number(item.price ?? item.priceCentavos / 100),
  description: item.description,
  image: item.image ?? item.images?.[0]?.url ?? "",
  category: item.category?.name ?? item.category ?? "Accessories",
  stock: Number(
    item.stock ??
      item.availableStock ??
      Math.max(0, (item.stockOnHand ?? 0) - (item.stockReserved ?? 0)),
  ),
  featured: Boolean(item.featured),
  topSelling: Boolean(item.topSelling),
  rating: Number(item.rating ?? 0),
  soldCount: Number(item.soldCount ?? 0),
});
const toCartItem = (item: any): CartItem => ({
  cartItemId: item.id,
  product: toProduct(item.product),
  quantity: item.quantity,
});
const toUser = (item: any): User => ({
  id: item.id,
  email: item.email,
  fullName: item.fullName,
  phone: item.phone ?? "",
  address:
    item.address ?? item.addresses?.find((a: any) => a.isDefault)?.line1 ?? "",
  isAdmin: item.role === "ADMIN" || item.isAdmin === true,
  verified: Boolean(item.verifiedAt ?? item.verified),
  createdAt: item.createdAt,
  profileImage: item.profileImage ?? undefined,
});
const toOrder = (item: any): Order => ({
  id: item.orderNumber ?? item.id,
  userId: item.userId,
  userName: item.user?.fullName ?? item.userName ?? "",
  userEmail: item.user?.email ?? item.userEmail ?? "",
  userPhone: item.recipientPhone ?? item.userPhone ?? "",
  userAddress: item.deliveryAddress ?? item.userAddress ?? "",
  items: (item.items ?? []).map((line: any) => ({
    product: toProduct(
      line.product ?? {
        id: line.productId,
        name: line.nameSnapshot,
        priceCentavos: line.unitPriceCentavos,
        image: line.image,
      },
    ),
    quantity: line.quantity,
  })),
  total: Number(item.total ?? item.totalCentavos / 100),
  status:
    item.status === "PAYMENT_PENDING"
      ? "Pending"
      : item.status === "CONFIRMED"
        ? "Confirmed"
        : item.status === "PACKED"
          ? "Packed"
          : item.status === "SHIPPED"
            ? "Shipped"
            : item.status === "DELIVERED"
              ? "Delivered"
              : item.status === "CANCELLED"
                ? "Cancelled"
                : "Pending",
  paymentMethod: item.paymentMethod === "GCASH" ? "GCash" : "COD",
  createdAt: item.placedAt ?? item.createdAt,
  updatedAt: item.updatedAt,
  statusEvents: (item.statusEvents ?? []).map((event: any) => ({
    status:
      event.status === "PAYMENT_PENDING" ? "Pending" :
      event.status === "CONFIRMED" ? "Confirmed" :
      event.status === "PACKED" ? "Packed" :
      event.status === "SHIPPED" ? "Shipped" :
      event.status === "DELIVERED" ? "Delivered" :
      event.status === "CANCELLED" ? "Cancelled" : "Pending",
    note: event.note,
    createdAt: event.createdAt,
  })),
});

export function useStore() {
  const [, render] = useState(0);
  useEffect(() => {
    const listener = () => render((value) => value + 1);
    listeners.add(listener);
    return () => void listeners.delete(listener);
  }, []);

  const fetchProducts = useCallback(async () => {
    const response = await api.fetchProducts();
    state.products = (response.data.data ?? response.data).map(toProduct);
    notify();
    return state.products;
  }, []);
  const fetchCart = useCallback(async () => {
    if (!state.user || state.user.isAdmin) {
      state.cart = [];
      notify();
      return [];
    }
    const response = await api.fetchCart();
    state.cart = (response.data.items ?? response.data).map(toCartItem);
    notify();
    return state.cart;
  }, []);
  const fetchOrders = useCallback(async () => {
    if (!state.user) return [];
    const response = state.user.isAdmin
      ? await api.fetchAdminOrders()
      : await api.fetchOrders();
    state.orders = (response.data.data ?? response.data).map(toOrder);
    notify();
    return state.orders;
  }, []);
  const fetchUsers = useCallback(async () => {
    if (!state.user?.isAdmin) return [];
    const response = await api.fetchAdminCustomers();
    state.users = (response.data.data ?? response.data).map(toUser);
    notify();
    return state.users;
  }, []);
  const fetchAddresses = useCallback(async () => {
    if (!state.user) return [];
    const response = await api.fetchAddresses();
    state.addresses = response.data.data ?? response.data;
    notify();
    return state.addresses;
  }, []);

  const addToCart = useCallback(
    async (product: Product, quantity = 1) => {
      if (!state.user)
        throw new Error(
          "Please sign up or sign in before adding items to your cart.",
        );
      if (state.user.isAdmin)
        throw new Error(
          "Admin accounts cannot add products to a shopping cart.",
        );
      await api.addToCart(product.id, quantity);
      await fetchCart();
    },
    [fetchCart],
  );
  const removeFromCart = useCallback(
    async (productId: string) => {
      const item = state.cart.find((entry) => entry.product.id === productId);
      if (item?.cartItemId) {
        await api.removeCartItem(item.cartItemId);
        await fetchCart();
      }
    },
    [fetchCart],
  );
  const updateCartQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const item = state.cart.find((entry) => entry.product.id === productId);
      if (!item?.cartItemId) return;
      if (quantity <= 0) await api.removeCartItem(item.cartItemId);
      else await api.updateCartItem(item.cartItemId, quantity);
      await fetchCart();
    },
    [fetchCart],
  );
  const clearCart = useCallback(async () => {
    await api.clearCart();
    state.cart = [];
    notify();
  }, []);
  const getCartTotal = useCallback(
    () =>
      state.cart.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      ),
    [],
  );
  const getCartCount = useCallback(
    () => state.cart.reduce((sum, item) => sum + item.quantity, 0),
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        const response = await api.login(email, password);
        localStorage.setItem("accessToken", response.data.accessToken);
        state.user = toUser(response.data.user);
        state.error = null;
        await Promise.all([
          fetchCart(),
          fetchOrders(),
          fetchAddresses(),
          fetchUsers(),
        ]);
        return { success: true, user: state.user };
      } catch (error: any) {
        const message =
          error.response?.data?.error ?? "Invalid email or password.";
        state.error = message;
        return { success: false, user: null, error: message };
      } finally {
        setLoading(false);
      }
    },
    [fetchCart, fetchOrders, fetchAddresses, fetchUsers],
  );
  const register = useCallback(
    async (
      userData: Omit<User, "id" | "isAdmin" | "verified" | "createdAt"> & {
        password: string;
      },
    ) => {
      try {
        setLoading(true);
        const response = await api.register({
          fullName: userData.fullName,
          email: userData.email,
          password: userData.password,
          phone: userData.phone,
          address: userData.address,
        });
        localStorage.setItem("accessToken", response.data.accessToken);
        state.user = toUser(response.data.user);
        state.addresses = response.data.addresses ?? [];
        state.error = null;
        notify();
        return { success: true, user: state.user };
      } catch (error: any) {
        const details = error.response?.data?.details;
        const message =
          Array.isArray(details) && details.length > 0
            ? details.map((item: any) => item.message).join(" ")
            : (error.response?.data?.error ?? "Registration failed.");
        state.error = message;
        return { success: false, user: null, error: message };
      } finally {
        setLoading(false);
      }
    },
    [],
  );
  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    state.user = null;
    state.cart = [];
    state.orders = [];
    state.addresses = [];
    notify();
  }, []);
  const updateProfile = useCallback(async (data: { fullName: string; email: string; phone: string; address: string; profileImage?: string | null }) => {
    const response = await api.updateProfile(data);
    state.user = toUser(response.data.user ?? response.data);
    state.addresses = response.data.addresses ?? state.addresses;
    notify();
    return state.user;
  }, []);
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.changePassword(currentPassword, newPassword);
  }, []);
  const placeOrder = useCallback(
    async (paymentMethod: PaymentMethod, addressId?: string) => {
      if (!state.user) return null;
      const address = addressId
        ? state.addresses.find((entry) => entry.id === addressId)
        : state.addresses.find((entry) => entry.isDefault);
      if (!address)
        throw new Error("Add a complete delivery address before checkout.");
      const response = await api.placeOrder({
        addressId: address.id,
        paymentMethod,
      });
      await fetchCart();
      await fetchOrders();
      return response.data.checkoutUrl
        ? {
            ...toOrder(response.data.order),
            checkoutUrl: response.data.checkoutUrl,
          }
        : toOrder(response.data.order ?? response.data);
    },
    [fetchCart, fetchOrders],
  );
  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      await api.updateOrderStatusAPI(orderId, status.toUpperCase());
      await fetchOrders();
    },
    [fetchOrders],
  );
  const cancelOrder = useCallback(
    async (orderId: string) => {
      await api.cancelOrder(orderId);
      await fetchOrders();
    },
    [fetchOrders],
  );
  const addProduct = useCallback(
    async (product: Omit<Product, "id">) => {
      await api.createAdminProduct({
        ...product,
        priceCentavos: Math.round(product.price * 100),
        category: product.category,
        imageUrl: product.image,
        rating: product.rating,
        soldCount: product.soldCount,
      });
      await fetchProducts();
    },
    [fetchProducts],
  );
  const updateProduct = useCallback(
    async (id: string, updates: Partial<Product>) => {
      const payload: Record<string, unknown> = {
        ...updates,
        priceCentavos:
          updates.price === undefined
            ? undefined
            : Math.round(updates.price * 100),
        category: updates.category,
        rating: updates.rating,
        soldCount: updates.soldCount,
      };
      if (updates.image) payload.imageUrl = updates.image;
      delete payload.image;
      delete payload.price;
      delete payload.stock;
      await api.updateAdminProduct(id, { ...payload, stock: updates.stock });
      await fetchProducts();
    },
    [fetchProducts],
  );
  const deleteProduct = useCallback(
    async (id: string) => {
      await api.deleteAdminProduct(id);
      await fetchProducts();
    },
    [fetchProducts],
  );
  const createAddress = useCallback(
    async (address: Record<string, string | boolean>) => {
      await api.createAddress(address);
      await fetchAddresses();
    },
    [fetchAddresses],
  );

  useEffect(() => {
    void fetchProducts();
    const token = localStorage.getItem("accessToken");
    if (token) {
      void api
        .fetchMe()
        .then((response) => {
          state.user = toUser(response.data.user ?? response.data);
          return Promise.all([
            fetchCart(),
            fetchOrders(),
            fetchAddresses(),
            fetchUsers(),
          ]);
        })
        .catch(() => logout());
    }
  }, [
    fetchProducts,
    fetchCart,
    fetchOrders,
    fetchAddresses,
    fetchUsers,
    logout,
  ]);
  useEffect(() => {
    if (!state.user) return;
    const interval = window.setInterval(() => {
      void fetchOrders();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [fetchOrders, state.user?.id]);
  useEffect(() => {
    const interval = window.setInterval(() => { void fetchProducts(); }, 15000);
    return () => window.clearInterval(interval);
  }, [fetchProducts]);
  return {
    ...state,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    placeOrder,
    updateOrderStatus,
    cancelOrder,
    addProduct,
    updateProduct,
    deleteProduct,
    createAddress,
    fetchProducts,
    fetchCart,
    fetchOrders,
    fetchAddresses,
    fetchUsers,
  };
}
