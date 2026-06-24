import clsx from "clsx";

export default function Spinner({ size = "md", className = "", ...props }) {
  const sizes = {
    xs: "h-4 w-4",
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <svg
      className={clsx("animate-spin text-gold-500", sizes[size] || sizes.md, className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function LoadingOverlay({ children, loading = false }) {
  if (!loading) return children;
  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-navy-950/60 backdrop-blur-sm rounded-xl">
        <Spinner size="lg" />
      </div>
      <div className="opacity-30 pointer-events-none">{children}</div>
    </div>
  );
}