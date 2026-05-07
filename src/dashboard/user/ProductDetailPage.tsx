import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Star, Minus, Plus, Truck, Shield, RotateCcw } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import ProductCard from '../../components/ProductCard';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart } = useStore();
  const [quantity, setQuantity] = useState(1);

  const product = products.find((p) => p.id === id);
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <Link to="/products" className="text-primary-600 hover:underline">Back to products</Link>
        </div>
      </div>
    );
  }

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#f8faf9] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Image */}
            <div className="relative aspect-square lg:aspect-auto">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.featured && (
                <span className="absolute top-4 left-4 bg-primary-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  Featured
                </span>
              )}
            </div>

            {/* Details */}
            <div className="p-6 sm:p-8 lg:p-10 flex flex-col">
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-2">{product.category}</span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-accent-400 fill-accent-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">{product.rating} ({product.soldCount} sold)</span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">₱{product.price.toFixed(2)}</span>
              </div>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

              {/* Stock */}
              <div className="mb-6">
                <span className={`text-sm font-medium ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {product.stock > 10 ? `✓ In Stock (${product.stock} available)` : product.stock > 0 ? `⚠ Low Stock (${product.stock} left)` : '✗ Out of Stock'}
                </span>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center gap-0 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 text-gray-500 hover:text-gray-700 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2.5 text-gray-500 hover:text-gray-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={() => {
                    addToCart(product, quantity);
                    navigate('/cart');
                  }}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white px-6 py-3.5 rounded-xl font-semibold transition shadow-md hover:shadow-lg"
                >
                  <ShoppingCart className="w-5 h-5" /> Add to Cart
                </button>
              </div>

              {/* Trust */}
              <div className="border-t border-gray-100 pt-6 grid grid-cols-3 gap-4 mt-auto">
                {[
                  { icon: Truck, text: 'Fast Delivery' },
                  { icon: Shield, text: 'Genuine Product' },
                  { icon: RotateCcw, text: 'Easy Returns' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-1">
                    <item.icon className="w-5 h-5 text-primary-500" />
                    <span className="text-[10px] text-gray-500 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
