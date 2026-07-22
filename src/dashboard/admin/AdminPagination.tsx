import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = { page: number; pageCount: number; total: number; pageSize: number; onPageChange: (page: number) => void };

const AdminPagination: React.FC<Props> = ({ page, pageCount, total, pageSize, onPageChange }) => {
  if (pageCount <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <div className="admin-pagination" aria-label="Pagination">
      <span className="pagination-summary">Showing {start}–{end} of {total}</span>
      <div className="pagination-controls">
        <button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page"><ChevronLeft /></button>
        {pages.map((number) => <button type="button" key={number} className={number === page ? "active" : ""} onClick={() => onPageChange(number)} aria-current={number === page ? "page" : undefined}>{number}</button>)}
        <button type="button" disabled={page === pageCount} onClick={() => onPageChange(page + 1)} aria-label="Next page"><ChevronRight /></button>
      </div>
    </div>
  );
};

export default AdminPagination;
