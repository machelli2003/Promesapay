import { useEffect, useCallback } from "react";
import { FiX } from "react-icons/fi";
import clsx from "clsx";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
}) {
  const handleEscape = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={clsx(
          "relative w-full bg-white dark:bg-navy-800 rounded-2xl shadow-xl animate-scale-in",
          sizes[size] || sizes.md,
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-navy-700">
            <h3 className="text-lg font-heading font-bold text-navy-900 dark:text-navy-50">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
              aria-label="Close modal"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}