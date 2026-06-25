// Loading spinner uses a teddy emoji now

export default function Loading({ size = "md", text = "Loading..." }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizes[size]} rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center animate-pulse`}>
        <span className={`${iconSizes[size]} text-sky-600 dark:text-sky-400 animate-spin`} style={{ fontSize: '1.25rem' }}>🧸</span>
      </div>
      {text && (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{text}</p>
      )}
    </div>
  );
}