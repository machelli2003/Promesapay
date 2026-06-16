import { forwardRef } from "react";
import clsx from "clsx";

const Textarea = forwardRef(
  (
    {
      label,
      error,
      hint,
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
        <textarea
          ref={ref}
          id={props.id || props.name}
          className={clsx(
            "input resize-y min-h-[100px]",
            error && "input-error",
            props.disabled && "input-disabled",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="field-hint">{hint}</p>}
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;