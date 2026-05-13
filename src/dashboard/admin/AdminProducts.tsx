import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, Star } from "lucide-react";
import { useStore } from "../../hooks/useStore";
import { CATEGORIES } from "../../utils/constants";
import Modal from "../../components/Modal";
import type { Product } from "../../utils/types";
import "@/styles/admin_css/adminProducts.css";

const emptyForm = {
  name: "",
  price: 0,
  description: "",
  image: "",
  category: "Surface Cleaners",
  stock: 0,
  featured: false,
  topSelling: false,
  rating: 4.5,
};

const AdminProducts: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const openAddModal = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditId(product.id);
    setForm({
      name: product.name,
      price: product.price,
      description: product.description,
      image: product.image,
      category: product.category,
      stock: product.stock,
      featured: product.featured,
      topSelling: product.topSelling,
      rating: product.rating,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) return;
    if (editId) {
      updateProduct(editId, form);
    } else {
      addProduct(form);
    }
    setShowModal(false);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setDeleteConfirm(null);
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
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      <div className="product-grid">
        {filtered.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-card-image">
              <img src={product.image} alt={product.name} />
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
                  <Star /> {product.rating}
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
                value={form.stock}
                onChange={(e) =>
                  setForm({ ...form, stock: parseInt(e.target.value) || 0 })
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
          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              type="text"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="form-input"
              placeholder="https://example.com/image.jpg"
            />
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
            <button onClick={handleSave} className="btn-save">
              {editId ? "Update Product" : "Add Product"}
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
