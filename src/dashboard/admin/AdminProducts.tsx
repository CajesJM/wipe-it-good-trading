import React, { useState, useRef, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Star, Upload } from "lucide-react";
import { useStore } from "../../hooks/useStore";
import { CATEGORIES } from "../../utils/constants";
import Modal from "../../components/Modal";
import type { Product } from "../../utils/types";
import AdminPagination from "./AdminPagination";
import "@/styles/admin_css/adminProducts.css";

const emptyForm = {
  name: "",
  price: 0,
  description: "",
  image: "",
  category: "Silent Inverter Generator",
  stock: 0,
  featured: false,
  topSelling: false,
  rating: 4.5,
  soldCount: 0,
};

const AdminProducts: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = products.filter((p) => {
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || p.category.trim().toLowerCase() === catFilter.trim().toLowerCase();
    return matchSearch && matchCat;
  });
  useEffect(() => setPage(1), [search, catFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedProducts = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAddModal = () => {
    setEditId(null);
    setForm(emptyForm);
    setImagePreview("");
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditId(product.id);
    setForm({
      name: product.name || "",
      price: product.price ?? 0,
      description: product.description || "",
      image: product.image || "",
      category: product.category || "Silent Inverter Generator",
      stock: Math.max(0, product.stock ?? 0),
      featured: product.featured ?? false,
      topSelling: product.topSelling ?? false,
      rating: product.rating ?? 4.5,
      soldCount: product.soldCount ?? 0,
    });
    setImagePreview(product.image || "");
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      const reader = new FileReader();
      reader.onload = () => {
        setForm((current) => ({ ...current, image: String(reader.result ?? "") }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      alert("Please fill name and price");
      return;
    }
    setLoading(true);
    try {
      const normalizedForm = {
        ...form,
        stock: Math.max(0, Math.trunc(Number(form.stock) || 0)),
      };

      if (editId) {
        // Update: send updates and optional new image
        await updateProduct(editId, normalizedForm);
      } else {
        // Add new product
        await addProduct({
          ...normalizedForm,
          image: normalizedForm.image || "/images/equipment-hero.png",
        });
      }
      setShowModal(false);
      setForm(emptyForm);
      setImagePreview("");
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save product. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
    setDeleteConfirm(null);
  };

  // Helper to get full image URL (for existing images)
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/") || imagePath.startsWith("data:")) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  return (
    <div className="admin-products">
      <div className="product-header">
        <div className="header-titles">
          <h1 className="title">Product Management</h1>
          <p className="subtitle">Add, edit, and manage your products</p>
        </div>
        <button onClick={openAddModal} className="btn-add">
          <Plus /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="filter-select"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.filter((c) => c !== "All").map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      <div className="product-grid">
        {pagedProducts.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-card-image">
              <img src={getImageUrl(product.image)} alt={product.name} />
              <div className="overlay">
                <button
                  onClick={() => openEditModal(product)}
                  className="overlay-btn"
                >
                  <Edit />
                </button>
                <button
                  onClick={() => setDeleteConfirm(product.id)}
                  className="overlay-btn danger"
                >
                  <Trash2 />
                </button>
              </div>
              {product.stock < 10 && (
                <span className="low-stock-badge">Low Stock</span>
              )}
            </div>
            <div className="product-card-body">
              <span className="product-category">{product.category}</span>
              <h3 className="product-name">{product.name}</h3>
              <div className="product-price-row">
                <span className="product-price">
                  ₱{product.price.toFixed(2)}
                </span>
                <span className="product-rating">
                  <span className="admin-rating-stars">
                    {[...Array(5)].map((_, i) => {
                      const ratingValue = Math.min(5, Math.max(0, Number(product.rating) || 0));
                      const fillPercent = Math.min(100, Math.max(0, (ratingValue - i) * 100));
                      return (
                        <span className="admin-star-shell" key={i}>
                          <Star className="admin-star-empty" fill="none" />
                          <span className="admin-star-fill" style={{ width: `${fillPercent}%` }}>
                            <Star className="admin-star-filled" fill="currentColor" />
                          </span>
                        </span>
                      );
                    })}
                  </span>
                  {Number(product.rating || 0).toFixed(1)}
                </span>
              </div>
              <div className="product-stats">
                <span>Stock: {product.stock}</span>
                <span>{product.soldCount} sold</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p className="empty-message">No products found</p>
        </div>
      )}
      <AdminPagination page={page} pageCount={pageCount} total={filtered.length} pageSize={pageSize} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? "Edit Product" : "Add New Product"}
        maxWidth="max-w-xl"
      >
        <div className="form-content">
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="form-input"
              placeholder="Enter product name"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (₱)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                }
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stock</label>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.stock}
                onKeyDown={(e) => {
                  if (["-", "+", "e", "E", "."].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  const stock = Number.parseInt(e.target.value, 10);
                  setForm({
                    ...form,
                    stock: Number.isFinite(stock) ? Math.max(0, stock) : 0,
                  });
                }}
                onBlur={() =>
                  setForm((current) => ({
                    ...current,
                    stock: Math.max(
                      0,
                      Math.trunc(Number(current.stock) || 0),
                    ),
                  }))
                }
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="form-select"
            >
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Image Upload (replaces URL input) */}
          <div className="form-group">
            <label className="form-label">Product Image</label>
            <div className="image-upload-area">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("");
                      setForm((current) => ({ ...current, image: "" }));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="remove-image"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="upload-placeholder"
                >
                  <Upload /> Click to upload image
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="form-textarea"
              placeholder="Product description"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Rating</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={(e) =>
                  setForm({ ...form, rating: parseFloat(e.target.value) || 0 })
                }
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sold Count</label>
              <input
                type="number"
                min="0"
                value={form.soldCount}
                onChange={(e) => setForm({ ...form, soldCount: parseInt(e.target.value) || 0 })}
                className="form-input"
              />
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm({ ...form, featured: e.target.checked })
                  }
                />
                Featured
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.topSelling}
                  onChange={(e) =>
                    setForm({ ...form, topSelling: e.target.checked })
                  }
                />
                Top Selling
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button onClick={() => setShowModal(false)} className="btn-cancel">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-save"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editId
                  ? "Update Product"
                  : "Add Product"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Product"
        maxWidth="max-w-sm"
      >
        <div className="delete-confirm">
          <div className="delete-icon">
            <Trash2 />
          </div>
          <p className="delete-text">
            Are you sure you want to delete this product? This action cannot be
            undone.
          </p>
          <div className="form-actions">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="btn-delete"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProducts;
