import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  ArrowLeft,
  Star,
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useStore } from "../../hooks/useStore";
import ProductCard from "../../components/ProductCard";
import Toast from "../../components/Toast";
import "@/styles/user_css/productDetailPage.css";

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart, user } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [actionBusy, setActionBusy] = useState<"buy" | "cart" | null>(null);
  const [toast, setToast] = useState("");

  const product = products.find((p) => p.id === id);
  if (!product) {
    return (
      <div className="not-found">
        <div style={{ textAlign: "center" }}>
          <h2 className="not-found-title">Product Not Found</h2>
          <Link to="/products" className="not-found-link">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="product-detail-page">
      <Toast message={toast} type="error" onClose={() => setToast("")} />
      <div className="product-detail-container">
        {/* Breadcrumb */}
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft /> Back
        </button>

        <div className={`product-main ${product.stock === 0 ? "product-unavailable" : ""}`}>
          <div className="product-layout">
            {/* Image */}
            <div className="product-image-area">
              {product.image ? <img src={product.image} alt={product.name} /> : <div className="product-image-placeholder" aria-label="No product image" />}
              {product.featured && (
                <span className="featured-badge">Featured</span>
              )}
              {product.stock === 0 && <span className="detail-sold-out-overlay">Currently unavailable</span>}
            </div>

            {/* Details */}
            <div className="product-details">
              <span className="product-category">{product.category}</span>
              <h1 className="product-title">{product.name}</h1>

              {/* Rating */}
              <div className="rating-row">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`star-icon ${i < Math.floor(product.rating) ? "star-filled" : "star-empty"}`}
                    />
                  ))}
                </div>
                <span className="rating-text">
                  {product.rating} ({product.soldCount} sold)
                </span>
              </div>

              {/* Price */}
              <div className="product-price">₱{product.price.toFixed(2)}</div>

              {/* Description */}
              <p className="product-description">{product.description}</p>

              {/* Stock */}
              <div className="stock-info">
                <span
                  className={`stock-text ${
                    product.stock > 10
                      ? "stock-in"
                      : product.stock > 0
                        ? "stock-low"
                        : "stock-out"
                  }`}
                >
                  {product.stock > 10
                    ? <><CheckCircle2 /> In Stock ({product.stock} available)</>
                    : product.stock > 0
                      ? <><AlertTriangle /> Low Stock ({product.stock} left)</>
                      : <><XCircle /> Out of Stock</>}
                </span>
              </div>

              {/* Quantity */}
              <div className="quantity-row">
                <span className="quantity-label">Quantity:</span>
                <div className="quantity-control">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="quantity-btn"
                    disabled={quantity <= 1 || product.stock === 0}
                  >
                    <Minus />
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    className="quantity-btn"
                    disabled={product.stock === 0 || quantity >= product.stock}
                  >
                    <Plus />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="actions">
                <button type="button" onClick={async () => {
                  if (actionBusy) return;
                  if (!user) {
                    navigate("/login");
                    return;
                  }
                  setActionBusy("buy");
                  try {
                    await addToCart(product, quantity);
                    navigate("/cart");
                  } catch (error) {
                    setToast(error instanceof Error ? error.message : "Unable to buy this item.");
                  } finally {
                    setActionBusy(null);
                  }
                }} disabled={product.stock === 0 || user?.isAdmin === true || Boolean(actionBusy)} className="buy-now-detail-btn">
                  <Zap /> {actionBusy === "buy" ? "Opening…" : "Buy Now"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (actionBusy) return;
                    if (!user) {
                      navigate("/login");
                      return;
                    }
                    setActionBusy("cart");
                    try {
                      await addToCart(product, quantity);
                    } catch (error) {
                      setToast(error instanceof Error ? error.message : "Unable to add this item.");
                    } finally { setActionBusy(null); }
                  }}
                  disabled={product.stock === 0 || user?.isAdmin === true || Boolean(actionBusy)}
                  className="add-to-cart-btn"
                >
                  <ShoppingCart /> {actionBusy === "cart" ? "Adding…" : user?.isAdmin ? "Admin view only" : "Add to Cart"}
                </button>
              </div>

              {/* Trust badges */}
              <div className="trust-badges">
                <div className="trust-item">
                  <Truck />
                  <span>Fast Delivery</span>
                </div>
                <div className="trust-item">
                  <Shield />
                  <span>Genuine Product</span>
                </div>
                <div className="trust-item">
                  <RotateCcw />
                  <span>Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="related-section">
            <span className="related-eyebrow">More equipment to consider</span>
            <h2 className="related-title">Related Products</h2>
            <div className="related-grid">
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
