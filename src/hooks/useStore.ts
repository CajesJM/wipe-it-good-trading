import { useState, useCallback, useEffect } from 'react';
import type { Product, CartItem, User, Order } from '../utils/types';
import type { OrderStatus } from '../utils/constants';
import { dummyProducts, dummyOrders, dummyUsers } from '../utils/dummyData';

// Simple global state using a singleton pattern
let globalState = {
  products: [...dummyProducts],
  cart: [] as CartItem[],
  user: null as User | null,
  orders: [...dummyOrders],
  users: [...dummyUsers],
};

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function useStore() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    const existing = globalState.cart.find((item) => item.product.id === product.id);
    if (existing) {
      globalState.cart = globalState.cart.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      globalState.cart = [...globalState.cart, { product, quantity }];
    }
    notifyListeners();
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    globalState.cart = globalState.cart.filter((item) => item.product.id !== productId);
    notifyListeners();
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      globalState.cart = globalState.cart.filter((item) => item.product.id !== productId);
    } else {
      globalState.cart = globalState.cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    }
    notifyListeners();
  }, []);

  const clearCart = useCallback(() => {
    globalState.cart = [];
    notifyListeners();
  }, []);

  const getCartTotal = useCallback(() => {
    return globalState.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, []);

  const getCartCount = useCallback(() => {
    return globalState.cart.reduce((sum, item) => sum + item.quantity, 0);
  }, []);

  const login = useCallback((email: string, _password: string) => {
    const user = globalState.users.find((u) => u.email === email);
    if (user) {
      globalState.user = user;
      notifyListeners();
      return { success: true, user };
    }
    return { success: false, user: null };
  }, []);

  const register = useCallback((userData: Omit<User, 'id' | 'isAdmin' | 'verified' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `u${Date.now()}`,
      isAdmin: false,
      verified: true,
      createdAt: new Date().toISOString(),
    };
    globalState.users = [...globalState.users, newUser];
    globalState.user = newUser;
    notifyListeners();
    return newUser;
  }, []);

  const logout = useCallback(() => {
    globalState.user = null;
    notifyListeners();
  }, []);

  const placeOrder = useCallback((paymentMethod: 'COD' | 'GCash') => {
    if (!globalState.user || globalState.cart.length === 0) return null;
    const order: Order = {
      id: `ORD-${Date.now()}`,
      userId: globalState.user.id,
      userName: globalState.user.fullName,
      userEmail: globalState.user.email,
      userPhone: globalState.user.phone,
      userAddress: globalState.user.address,
      items: [...globalState.cart],
      total: globalState.cart.reduce((s, i) => s + i.product.price * i.quantity, 0),
      status: 'Pending',
      paymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    globalState.orders = [order, ...globalState.orders];
    globalState.cart = [];
    notifyListeners();
    return order;
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    globalState.orders = globalState.orders.map((o) =>
      o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
    );
    notifyListeners();
  }, []);

  const addProduct = useCallback((product: Omit<Product, 'id' | 'soldCount'>) => {
    const newProduct: Product = {
      ...product,
      id: `p${Date.now()}`,
      soldCount: 0,
    };
    globalState.products = [...globalState.products, newProduct];
    notifyListeners();
    return newProduct;
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    globalState.products = globalState.products.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    notifyListeners();
  }, []);

  const deleteProduct = useCallback((id: string) => {
    globalState.products = globalState.products.filter((p) => p.id !== id);
    notifyListeners();
  }, []);

  return {
    products: globalState.products,
    cart: globalState.cart,
    user: globalState.user,
    orders: globalState.orders,
    users: globalState.users,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    login,
    register,
    logout,
    placeOrder,
    updateOrderStatus,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
