import { useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import "../styles/toast.css";

export type ToastType = "success" | "error" | "info";
export default function Toast({ message, type = "info", onClose }: { message: string; type?: ToastType; onClose: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onClose, 4200); return () => window.clearTimeout(timer); }, [message, onClose]);
  if (!message) return null;
  return <div className={`app-toast app-toast-${type}`} role="status"><span className="app-toast-icon">{type === "success" ? <CheckCircle2 /> : <XCircle />}</span><span>{message}</span><button type="button" onClick={onClose} aria-label="Dismiss notification"><X /></button></div>;
}
