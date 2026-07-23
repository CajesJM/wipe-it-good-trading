import React, { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Grid3X3, LayoutList, PackageSearch, Search, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES } from "../../utils/constants";
import { useStore } from "../../hooks/useStore";
import ProductCard from "../../components/ProductCard";
import "@/styles/user_css/productsPage.css";

const ProductsPage: React.FC = () => {
  const PAGE_SIZE = 8;
  const { products } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [grid, setGrid] = useState(true);
  const [page, setPage] = useState(1);

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
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleProducts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, category, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setSort("default");
  };

  return (
    <div className="products-page">
      <div className="products-container">
        {/* Header */}
        <div className="products-header">
          <div className="products-header-copy">
            <span className="products-eyebrow">Wipe It Good Trading catalog</span>
            <h1 className="products-title">Find equipment built for the job</h1>
            <p className="products-subtitle">
              Compare generators, industrial equipment, hoses, pumps, vacuums, and job-ready tools.
            </p>
          </div>
          <div className="products-header-mark" aria-hidden="true">
            <PackageSearch />
            <span>Reliable equipment</span>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-block">
          <div className="filters-row">
            {/* Search */}
            <div className="search-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search by product name or use..."
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
                type="button"
                onClick={() => setGrid(true)}
                className={`view-btn ${grid ? "active" : ""}`}
                aria-label="Grid view"
                aria-pressed={grid}
              >
                <Grid3X3 />
              </button>
              <button
                type="button"
                onClick={() => setGrid(false)}
                className={`view-btn ${!grid ? "active" : ""}`}
                aria-label="List view"
                aria-pressed={!grid}
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
                type="button"
                onClick={() => setCategory(cat)}
                className={`pill ${category === cat ? "pill-active" : "pill-default"}`}
                aria-pressed={category === cat}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="results-toolbar">
          <p className="results-count">
            <strong>{filtered.length}</strong> product{filtered.length !== 1 ? "s" : ""} found
            {category !== "All" && <span> in {category}</span>}
          </p>
          {(search || category !== "All" || sort !== "default") && (
            <button type="button" className="clear-filters-btn" onClick={clearFilters}>
              <X /> Clear filters
            </button>
          )}
        </div>

        {/* Products */}
        {filtered.length > 0 ? (
          <div
            key={`${category}-${search}-${sort}-${grid}-${page}`}
            className={`${grid ? "product-grid" : "product-list"} catalog-results-enter`}
          >
            {visibleProducts.map((product, i) => (
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

        {filtered.length > PAGE_SIZE && (
          <nav className="catalog-pagination" aria-label="Product pages">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page">
              <ChevronLeft />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                className={page === pageNumber ? "active" : ""}
                aria-current={page === pageNumber ? "page" : undefined}
              >
                {pageNumber}
              </button>
            ))}
            <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} aria-label="Next page">
              <ChevronRight />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
