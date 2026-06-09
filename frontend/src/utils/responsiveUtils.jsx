import React, { useEffect, useState } from "react";

/**
 * useResponsive - Hook to detect responsive breakpoints
 * Returns current screen size category
 */
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: typeof window !== "undefined" ? window.innerWidth : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setBreakpoint({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return breakpoint;
};

/**
 * ResponsiveGrid - Responsive grid component that adapts to screen size
 */
export const ResponsiveGrid = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "gap-4",
  className = "",
}) => {
  const { isMobile, isTablet } = useResponsive();

  const colCount = isMobile ? cols.mobile : isTablet ? cols.tablet : cols.desktop;

  return (
    <div
      className={`grid ${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveContainer - Responsive container with adaptive padding
 */
export const ResponsiveContainer = ({ children, className = "" }) => {
  const { isMobile } = useResponsive();

  return (
    <div
      className={`
        ${isMobile ? "px-4" : "px-6 md:px-8"}
        mx-auto max-w-7xl
        ${className}
      `}
    >
      {children}
    </div>
  );
};

/**
 * MobileMenu - Mobile-specific dropdown menu
 */
export const MobileMenu = ({ isOpen, onClose, children }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Menu */}
      <div
        className={`
          fixed left-0 right-0 top-16 bg-white dark:bg-gray-800 shadow-lg
          transform transition-transform duration-200 z-50
          ${isOpen ? "translate-y-0" : "-translate-y-full"}
        `}
      >
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
};

/**
 * ResponsiveTable - Mobile-friendly table that converts to cards on small screens
 */
export const ResponsiveTable = ({ headers, rows, className = "" }) => {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return (
      <div className="space-y-4">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            {headers.map((header, headerIdx) => (
              <div key={headerIdx} className="flex justify-between mb-2 last:mb-0">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {header}
                </span>
                <span className="text-gray-600 dark:text-gray-400">{row[headerIdx]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm text-gray-600 dark:text-gray-400">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="text-left px-4 py-2 font-semibold text-gray-700 dark:text-gray-300"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * ResponsiveForm - Mobile-optimized form layout
 */
export const ResponsiveForm = ({ children, className = "" }) => {
  return (
    <form
      className={`
        max-w-2xl mx-auto
        px-4 sm:px-6 md:px-8
        ${className}
      `}
    >
      {children}
    </form>
  );
};

/**
 * ResponsiveButton - Mobile-optimized button with touch-friendly sizing
 */
export const ResponsiveButton = ({
  children,
  mobile = true,
  className = "",
  ...props
}) => {
  return (
    <button
      className={`
        ${mobile ? "py-3 px-4 sm:py-2 sm:px-3" : "py-2 px-3"}
        transition-colors duration-200
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
