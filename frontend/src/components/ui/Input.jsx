import { forwardRef } from "react";
import clsx from "clsx";

const Input = forwardRef(
  (
    {
      label,
      error,
      hint,
      icon: Icon,
      className = "",
      wrapperClassName = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx("field-wrapper", wrapperClassName)}>
        {label && (
          <label className="field-label" htmlFor={props.id || props.name}>
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            id={props.id || props.name}
            className={clsx(
              "input",
              Icon && "pl-11",
              error && "input-error",
              props.disabled && "input-disabled",
              className
            )}
            {...props}
          />
        </div>
        {hint && !error && <p className="field-hint">{hint}</p>}
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;