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
} from "lucide-react";
import { useStore } from "../../hooks/useStore";
import ProductCard from "../../components/ProductCard";
import "@/styles/user_css/productDetailPage.css";

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart, user } = useStore();
  const [quantity, setQuantity] = useState(1);

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
      <div className="product-detail-container">
        {/* Breadcrumb */}
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft /> Back
        </button>

        <div className="product-main">
          <div className="product-layout">
            {/* Image */}
            <div className="product-image-area">
              <img src={product.image} alt={product.name} />
              {product.featured && (
                <span className="featured-badge">Featured</span>
              )}
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
                    ? `✓ In Stock (${product.stock} available)`
                    : product.stock > 0
                      ? `⚠ Low Stock (${product.stock} left)`
                      : "✗ Out of Stock"}
                </span>
              </div>

              {/* Quantity */}
              <div className="quantity-row">
                <span className="quantity-label">Quantity:</span>
                <div className="quantity-control">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="quantity-btn"
                  >
                    <Minus />
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    className="quantity-btn"
                  >
                    <Plus />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="actions">
                <button
                  onClick={async () => {
                    try {
                      await addToCart(product, quantity);
                      navigate("/cart");
                    } catch (error) {
                      window.alert(error instanceof Error ? error.message : "Please sign in first.");
                    }
                  }}
                  disabled={product.stock === 0 || user?.isAdmin === true}
                  className="add-to-cart-btn"
                >
                  <ShoppingCart /> {user?.isAdmin ? "Admin view only" : "Add to Cart"}
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
