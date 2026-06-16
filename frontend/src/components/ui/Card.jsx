import clsx from "clsx";

export default function Card({
  children,
  className = "",
  hover = true,
  padding = "p-6",
  ...props
}) {
  return (
    <div
      className={clsx(
        "card",
        hover && "hover:shadow-card-hover",
        padding,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div
      className={clsx("card-header", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className = "", ...props }) {
  return (
    <div className={clsx("card-body", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...props }) {
  return (
    <div className={clsx("card-footer", className)} {...props}>
      {children}
    </div>
  );
}