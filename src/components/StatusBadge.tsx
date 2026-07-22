import React from 'react';
import type { OrderStatus } from '../utils/constants';

const statusConfig: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
  Pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  Confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  Packed: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-400' },
  Shipped: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
  Delivered: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400' },
  Cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
};

interface StatusBadgeProps {
  status: OrderStatus | string;
  large?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, large = false }) => {
  const safeStatus = typeof status === "string" && status in statusConfig ? status : "Pending";
  const config = statusConfig[safeStatus as OrderStatus] ?? statusConfig.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 ${config.bg} ${config.text} ${large ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'} font-semibold rounded-full`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status || "Pending"}
    </span>
  );
};

export default StatusBadge;
