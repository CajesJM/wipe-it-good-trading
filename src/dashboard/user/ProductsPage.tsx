import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Grid3X3, LayoutList } from "lucide-react";
import { CATEGORIES } from "../../utils/constants";
import { useStore } from "../../hooks/useStore";
import ProductCard from "../../components/ProductCard";
import "@/styles/user_css/productsPage.css";

const ProductsPage: React.FC = () => {
  const { products } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [grid, setGrid] = useState(true);

  const filtered = useMemo(() => {
    let result = [...products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }
    if (category !== "All") {
      const selectedCategory = category.trim().toLowerCase();
      result = result.filter((p) => p.category.trim().toLowerCase() === selectedCategory);
    }
    switch (sort) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "popular":
        result.sort((a, b) => b.soldCount - a.soldCount);
        break;
    }
    return result;
  }, [products, search, category, sort]);

  return (
    <div className="products-page">
      <div className="products-container">
        {/* Header */}
        <div className="products-header">
          <h1 className="products-title">Our Products</h1>
          <p className="products-subtitle">
            Generators, equipment, hoses, and job-ready tools for every project
          </p>
        </div>

        {/* Filters */}
        <div className="filters-block">
          <div className="filters-row">
            {/* Search */}
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

            {/* Category select */}
            <div className="select-wrapper">
              <SlidersHorizontal className="filter-icon" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="filter-select"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="filter-select"
            >
              <option value="default">Sort by: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
            </select>

            {/* View Toggle */}
            <div className="view-toggle">
              <button
                onClick={() => setGrid(true)}
                className={`view-btn ${grid ? "active" : ""}`}
              >
                <Grid3X3 />
              </button>
              <button
                onClick={() => setGrid(false)}
                className={`view-btn ${!grid ? "active" : ""}`}
              >
                <LayoutList />
              </button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="category-pills">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`pill ${category === cat ? "pill-active" : "pill-default"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="results-count">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
        </p>

        {/* Products */}
        {filtered.length > 0 ? (
          <div className={grid ? "product-grid" : "product-list"}>
            {filtered.map((product, i) => (
              <div
                key={product.id}
                className="product-item"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Search />
            </div>
            <h3 className="empty-title">No products found</h3>
            <p className="empty-subtitle">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
