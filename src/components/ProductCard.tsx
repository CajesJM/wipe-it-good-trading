import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, TrendingUp } from 'lucide-react';
import type { Product } from '../utils/types';
import { useStore } from '../hooks/useStore';

interface ProductCardProps {
  product: Product;
  showBadge?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, showBadge = true }) => {
  const { addToCart, user } = useStore();

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-primary-200 transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Image */}
      <Link to={`/product/${product.id}`} className="relative overflow-hidden aspect-square">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {showBadge && product.featured && (
            <span className="bg-primary-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Featured
            </span>
          )}
          {showBadge && product.topSelling && (
            <span className="bg-accent-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Top Seller
            </span>
          )}
        </div>
        {product.stock < 10 && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            Low Stock
          </span>
        )}
      </Link>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[10px] font-semibold text-primary-600 uppercase tracking-widest mb-1">
          {product.category}
        </span>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1.5 group-hover:text-primary-600 transition line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'text-accent-400 fill-accent-400' : 'text-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-500">({product.soldCount} sold)</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-lg font-bold text-gray-900">
            ₱{product.price.toFixed(2)}
          </span>
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock === 0}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white p-2.5 rounded-xl transition shadow-sm hover:shadow-md disabled:cursor-not-allowed"
            title={!user ? 'Login to add to cart' : 'Add to cart'}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
