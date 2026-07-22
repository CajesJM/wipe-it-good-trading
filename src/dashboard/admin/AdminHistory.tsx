import React, { useState } from "react";
import { Clock3, PackageCheck, UserRound } from "lucide-react";
import { useStore } from "../../hooks/useStore";
import StatusBadge from "../../components/StatusBadge";
import AdminPagination from "./AdminPagination";
import "@/styles/admin_css/adminHistory.css";

const AdminHistory: React.FC = () => {
  const { orders } = useStore();
  const events = orders.flatMap((order) => {
    const history = order.statusEvents?.length
      ? order.statusEvents
      : [{ status: order.status, note: "Order placed", createdAt: order.createdAt }];
    return history.map((event) => ({ ...event, order }));
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const pageCount = Math.max(1, Math.ceil(events.length / pageSize));
  const pagedEvents = events.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="admin-history">
      <div className="page-header">
        <h1 className="page-title">Order History</h1>
        <p className="page-subtitle">A timeline of customer orders and status changes</p>
      </div>
      {events.length === 0 ? (
        <div className="history-empty"><Clock3 /><p>No order activity yet.</p></div>
      ) : (
        <>
          <div className="history-list">
            {pagedEvents.map((event, index) => (
              <article className="history-item" key={`${event.order.id}-${event.createdAt}-${index}`}>
                <div className="history-icon"><PackageCheck /></div>
                <div className="history-content">
                  <div className="history-topline">
                    <div>
                      <strong>{event.order.id}</strong>
                      <span className="history-customer"><UserRound /> {event.order.userName}</span>
                    </div>
                    <StatusBadge status={event.status} />
                  </div>
                  <p className="history-note">{event.note || `Order status changed to ${event.status}.`}</p>
                  <time>{new Date(event.createdAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</time>
                </div>
              </article>
            ))}
          </div>
          <AdminPagination page={page} pageCount={pageCount} total={events.length} pageSize={pageSize} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default AdminHistory;
