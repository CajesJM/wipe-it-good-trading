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
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`star-icon ${i < Math.floor(product.rating) ? "star-filled" : "star-empty"}`}
              />
            ))}
          </div>
          <span className="rating-sold">({product.soldCount} sold)</span>
        </div>

        <div className="product-bottom">
          <span className="product-price">₱{product.price.toFixed(2)}</span>
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock === 0}
            className="add-to-cart-btn"
            title={!user ? "Login to add to cart" : "Add to cart"}
          >
            <ShoppingCart />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
