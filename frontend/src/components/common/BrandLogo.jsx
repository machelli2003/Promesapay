import { forwardRef } from "react";
import { Link } from "react-router-dom";
import logoImg from "/promesaLogo2.png";

const SIZES = {
  sm: 28,
  md: 36,
  lg: 48,
};

const BrandLogo = forwardRef(function BrandLogo(
  { size = "md", className = "", style, asLink = false, to = "/" },
  ref
) {
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
        textDecoration: "none",
        userSelect: "none",
        lineHeight: 1,
        ...style,
      }}
    >
      <img
        src={logoImg}
        alt="PromesaPay"
        width="200"
        height="auto"
        style={{
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />
    </Wrapper>
  );
});

export default BrandLogo;