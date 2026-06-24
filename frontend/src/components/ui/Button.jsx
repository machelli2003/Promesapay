import { forwardRef } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

const variants = {
  primary:
    "bg-gold-500 text-navy-950 hover:bg-gold-400 shadow-gold/20 hover:shadow-lg",
  secondary:
    "bg-navy-700 text-gold-500 hover:bg-navy-600 shadow-glow hover:shadow-none",
  outline:
    "border-2 border-navy-700/20 text-navy-700 bg-transparent hover:border-navy-700 dark:border-navy-300/30 dark:text-navy-200 dark:hover:border-navy-300",
  ghost:
    "bg-transparent text-navy-700 hover:bg-navy-100 dark:text-navy-200 dark:hover:bg-navy-800",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-xs",
  hero:
    "bg-navy-700 text-gold-500 hover:bg-navy-600 font-semibold shadow-glow",
  heroOutline:
    "bg-transparent text-navy-700 border-2 border-navy-700/20 hover:border-navy-700 font-medium dark:text-navy-200",
  cta:
    "bg-gold-500 text-navy-950 hover:bg-gold-400 font-bold",
};

const sizes = {
  xs: "px-3 py-1.5 text-xs rounded-full",
  sm: "px-4 py-2 text-sm rounded-full",
  md: "px-5 py-2.5 text-sm rounded-full",
  lg: "px-6 py-3 text-base rounded-full",
  xl: "px-8 py-4 text-base rounded-full",
};

const Button = forwardRef(
  (
    {
      variant = "primary",
      size = "md",
      className = "",
      children,
      loading = false,
      disabled = false,
      icon: Icon,
      iconPosition = "left",
      type = "button",
      to,
      onClick,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap";

    const classes = clsx(
      baseClasses,
      variants[variant] || variants.primary,
      sizes[size] || sizes.md,
      loading && "opacity-80 cursor-wait",
      className
    );

    const content = (
      <>
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
        )}
        {!loading && Icon && iconPosition === "left" && <Icon className="w-4 h-4" />}
        {children}
        {!loading && Icon && iconPosition === "right" && <Icon className="w-4 h-4" />}
      </>
    );

    if (to) {
      return (
        <Link to={to} className={classes} {...props}>
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={classes}
        onClick={onClick}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;