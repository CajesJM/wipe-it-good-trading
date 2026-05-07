// Product images from Pexels
export const PRODUCT_IMAGES = {
  spray1: 'https://images.pexels.com/photos/28921817/pexels-photo-28921817.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  spray2: 'https://images.pexels.com/photos/12997254/pexels-photo-12997254.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  spray3: 'https://images.pexels.com/photos/12997255/pexels-photo-12997255.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  cleaner1: 'https://images.pexels.com/photos/9230316/pexels-photo-9230316.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  kit1: 'https://images.pexels.com/photos/9230463/pexels-photo-9230463.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  kit2: 'https://images.pexels.com/photos/9225633/pexels-photo-9225633.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  stainRemover: 'https://images.pexels.com/photos/28921809/pexels-photo-28921809.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  hero: 'https://images.pexels.com/photos/5591908/pexels-photo-5591908.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  hero2: 'https://images.pexels.com/photos/5591926/pexels-photo-5591926.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
};

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const PAYMENT_METHODS = ['COD', 'GCash'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const CATEGORIES = [
  'All',
  'Surface Cleaners',
  'Disinfectants',
  'Kitchen Cleaners',
  'Bathroom Cleaners',
  'Floor Care',
  'Cleaning Kits',
  'Accessories',
] as const;
