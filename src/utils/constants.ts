export const PRODUCT_IMAGES = {
  hero: "/images/equipment-hero.png",
  generator: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=85",
  powerTool: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=900&q=85",
  workshop: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=900&q=85",
  accessories: "https://images.unsplash.com/photo-1533069027836-fa937181a8ce?auto=format&fit=crop&w=900&q=85",
};

export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["COD", "GCash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CATEGORIES = [
  "All",
  "Silent Inverter Generator",
  "Open Type Generator",
  "Grasscutter",
  "Industrial Equipment",
  "Pressure Hose",
  "Water Pump Hose",
  "Vacuum Cleaner",
] as const;
