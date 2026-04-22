import clsx from "clsx";

export default function InputField({
  label,
  hint,
  error,
  prefix,
  suffix,
  disabled = false,
  className = "",
  inputClassName = "",
  ...props
}) {
  return (
    <div className={clsx("field-wrapper", className)}>
      {label && <label className="field-label">{label}</label>}
      <div className="relative">
        {prefix && <span className="input-prefix">{prefix}</span>}
        <input
          className={clsx(
            "input",
            prefix && "pl-11",
            suffix && "pr-11",
            error && "input-error",
            disabled && "input-disabled",
            inputClassName
          )}
          disabled={disabled}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {suffix}
          </span>
        )}
      </div>
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}