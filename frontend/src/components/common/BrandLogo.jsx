import { forwardRef } from "react";
import { Link } from "react-router-dom";

/**
 * BrandLogo — inline JSX recreation of the PromesaPay logo.
 * No image file → no white background box.
 *
 * Props:
 *   size      "sm" | "md" | "lg"   (default "md")
 *   className string
 *   asLink    boolean  (render as react-router Link)
 *   to        string   (href for Link)
 */
const SIZES = {
  sm: { icon: 22, text: 17, pay: 19, gap: 5 },
  md: { icon: 26, text: 20, pay: 23, gap: 6 },
  lg: { icon: 32, text: 25, pay: 28, gap: 7 },
};

const BrandLogo = forwardRef(function BrandLogo({ size = "md", className = "", style, asLink = false, to = "/" }, ref) {
  const s = SIZES[size] ?? SIZES.md;
  const Wrapper = asLink ? Link : "span";

  return (
    <Wrapper
      ref={ref}
      to={asLink ? to : undefined}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        textDecoration: "none",
        userSelect: "none",
        lineHeight: 1,
        ...style,
      }}
    >
      {/* ── Icon mark ── */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Hand / cupped palm */}
        <path
          d="M6 28 C8 34 14 38 20 38 C26 38 33 34 35 28 L30 20 C28 16 24 14 20 14 C16 14 12 16 10 20 Z"
          fill="#2BAAE1"
          opacity="0.9"
        />
        {/* Heart */}
        <path
          d="M20 24 C20 24 13 19 13 15 C13 12.8 14.8 11 17 11 C18.3 11 19.4 11.7 20 12.7 C20.6 11.7 21.7 11 23 11 C25.2 11 27 12.8 27 15 C27 19 20 24 20 24Z"
          fill="#E53E3E"
        />
        {/* Dollar sign inside heart */}
        <text
          x="20"
          y="18"
          textAnchor="middle"
          fontSize="7"
          fontWeight="700"
          fill="white"
          fontFamily="sans-serif"
        >
          $
        </text>
      </svg>

      {/* ── Wordmark ── */}
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 1 }}>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: s.text,
            fontWeight: 700,
            color: "#2BAAE1",
            letterSpacing: "-0.02em",
          }}
        >
          Promesa
        </span>
        <span
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontStyle: "italic",
            fontSize: s.pay,
            fontWeight: 400,
            color: "#F5931E",
            letterSpacing: "-0.01em",
          }}
        >
          Pay
        </span>
      </span>
    </Wrapper>
  );
});

export default BrandLogo;
