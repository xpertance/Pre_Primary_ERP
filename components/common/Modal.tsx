"use client";
import React, { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100] p-4 animate-modal-backdrop overflow-y-auto"
      style={{
        background: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onClick={(e) => {
        // Close modal when clicking outside the content area
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-2xl ${sizeClasses[size]} w-full mx-auto relative animate-modal-content mb-auto mt-auto`}
        style={{
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white/50">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all text-2xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        <div className="px-6 py-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
