import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 admin-modal-backdrop">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-scale-in admin-modal`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 admin-modal-header">
          <h3 className="font-display font-bold text-lg text-gray-900 admin-modal-title">{title}</h3>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close dialog"
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 admin-modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
