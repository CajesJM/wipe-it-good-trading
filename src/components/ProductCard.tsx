import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, TrendingUp } from "lucide-react";
import type { Product } from "../utils/types";
import { useStore } from "../hooks/useStore";
import Toast from "./Toast";
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
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"cart" | "buy" | null>(null);
  const [toast, setToast] = useState("");
  const adminViewing = user?.isAdmin === true;
  const ratingValue = Math.min(5, Math.max(0, Number.isFinite(Number(product.rating)) ? Number(product.rating) : 0));
  const handleBuyNow = async () => {
    if (busy) return;
    if (!user) {
      navigate("/login");
      return;
    }
    setBusy("buy");
    try {
      animateToCart();
      await addToCart(product);
      navigate("/cart");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Please sign in first.");
    } finally { setBusy(null); }
  };
  const handleAddToCart = async () => {
    if (busy) return;
    if (!user) {
      navigate("/login");
      return;
    }
    setBusy("cart");
    animateToCart();
    try {
      await addToCart(product);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to add this item.");
    } finally {
      setBusy(null);
    }
  };
  const animateToCart = () => {
    const image = document.querySelector<HTMLImageElement>(`[data-product-card="${product.id}"] .product-image img`);
    const target = document.querySelector<HTMLElement>("#cart-icon-target");
    if (!image || !target) return;
    const from = image.getBoundingClientRect(); const to = target.getBoundingClientRect(); const clone = image.cloneNode(true) as HTMLImageElement;
    clone.className = "cart-fly-image"; clone.style.left = `${from.left}px`; clone.style.top = `${from.top}px`; clone.style.width = `${Math.min(from.width, 120)}px`; clone.style.height = `${Math.min(from.height, 120)}px`;
    document.body.appendChild(clone); requestAnimationFrame(() => { clone.style.transform = `translate(${to.left + to.width / 2 - from.left - Math.min(from.width, 120) / 2}px, ${to.top + to.height / 2 - from.top - Math.min(from.height, 120) / 2}px) scale(.18)`; clone.style.opacity = "0.25"; });
    window.setTimeout(() => clone.remove(), 650);
  };

  return (
    <div className={`product-card ${product.stock === 0 ? "out-of-stock" : product.stock <= 10 ? "low-stock" : ""}`} data-product-card={product.id}><Toast message={toast} type="error" onClose={() => setToast("")} />
      {/* Image */}
      <Link to={`/product/${product.id}`} className="product-image">
        {product.image ? <img src={product.image} alt={product.name} /> : <div className="product-image-placeholder" aria-label="No product image" />}
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
        {product.stock <= 10 && (
          <span className={`badge-low-stock ${product.stock === 0 ? "sold-out" : ""}`}>
            {product.stock === 0 ? "Out of stock" : "Low stock"}
          </span>
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
        <div className={`product-stock-count ${product.stock === 0 ? "stock-none" : product.stock <= 10 ? "stock-limited" : "stock-available"}`}>
          <span aria-hidden="true" />
          {product.stock === 0 ? "0 in stock" : `${product.stock} in stock`}
        </div>

        <div className="product-bottom">
          <span className="product-price">₱{product.price.toFixed(2)}</span>
          <div className="product-actions">
            <button onClick={handleBuyNow} disabled={product.stock === 0 || adminViewing || Boolean(busy)} className="buy-now-btn" title={adminViewing ? "Admins cannot shop" : "Buy now"}>
              {busy === "buy" ? "Opening…" : "Buy now"}
            </button>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || adminViewing || Boolean(busy)}
              className="add-to-cart-btn"
              title={adminViewing ? "Admins cannot shop" : "Add to cart"}
              aria-label={adminViewing ? "Admins cannot shop" : "Add to cart"}
            >
              <span className="cart-button-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
