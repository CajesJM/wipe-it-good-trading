import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, TrendingUp } from "lucide-react";
import type { Product } from "../utils/types";
import { useStore } from "../hooks/useStore";
import "@/styles/productCard.css";

interface ProductCardProps {
  product: Product;
  showBadge?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showBadge = true,
}) => {
  const { addToCart, user } = useStore();
  const adminViewing = user?.isAdmin === true;
  const ratingValue = Math.min(5, Math.max(0, Number.isFinite(Number(product.rating)) ? Number(product.rating) : 0));

  return (
    <div className="product-card">
      {/* Image */}
      <Link to={`/product/${product.id}`} className="product-image">
        <img src={product.image} alt={product.name} />
        {/* Badges */}
        <div className="product-badges">
          {showBadge && product.featured && (
            <span className="badge badge-featured">Featured</span>
          )}
          {showBadge && product.topSelling && (
            <span className="badge badge-top-selling">
              <TrendingUp className="w-3 h-3" /> Top Seller
            </span>
          )}
        </div>
        {product.stock < 10 && (
          <span className="badge-low-stock">Low Stock</span>
        )}
      </Link>

      {/* Details */}
      <div className="product-details">
        <span className="product-category">{product.category}</span>
        <Link to={`/product/${product.id}`} className="product-name">
          {product.name}
        </Link>

        {/* Rating */}
        <div className="product-rating">
          <div className="stars">
            {[...Array(5)].map((_, i) => {
              const fillPercent = Math.min(100, Math.max(0, (ratingValue - i) * 100));
              return (
                <span className="star-shell" key={i}>
                  <Star className="star-icon star-empty" fill="none" />
                  <span className="star-fill-layer" style={{ width: `${fillPercent}%` }}>
                    <Star className="star-icon star-filled" fill="currentColor" />
                  </span>
                </span>
              );
            })}
          </div>
          <span className="rating-sold">{ratingValue.toFixed(1)} · {product.soldCount} sold</span>
        </div>

        <div className="product-bottom">
          <span className="product-price">₱{product.price.toFixed(2)}</span>
          <button
            onClick={async () => {
              try {
                await addToCart(product);
              } catch (error) {
                window.alert(error instanceof Error ? error.message : "Please sign in first.");
              }
            }}
            disabled={product.stock === 0 || adminViewing}
            className="add-to-cart-btn"
            title={adminViewing ? "Admins cannot shop" : "Add to cart"}
          >
            <ShoppingCart />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
