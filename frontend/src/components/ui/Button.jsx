export default function Button({ children, className = '', style, ...props }) {
  return (
    <button
      type="button"
      className={className}
      style={{
        fontWeight: 500,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
