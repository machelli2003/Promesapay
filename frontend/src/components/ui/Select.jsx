import { forwardRef } from "react";
import clsx from "clsx";

const Select = forwardRef(
  (
    {
      label,
      error,
      hint,
      options = [],
      placeholder = "Select...",
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
        <select
          ref={ref}
          id={props.id || props.name}
          className={clsx(
            "input appearance-none bg-no-repeat",
            "bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7A99%22%20stroke-width%3D%222%22%3e%3cpath%20d%3D%22m6%209%206%206%206-6%22%2f%3e%3c%2fsvg%3e')]",
            "bg-[length:1.25rem] bg-[right_0.75rem_center] pr-10",
            error && "input-error",
            props.disabled && "input-disabled",
            !props.value && "text-slate-400",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && !error && <p className="field-hint">{hint}</p>}
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;