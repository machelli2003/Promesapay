const variants = {
  error:
    "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-900 dark:text-red-200",
  success:
    "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-200",
};

export default function MessageBox({ type = "error", message }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`mb-4 rounded-md border px-4 py-3 text-sm ${variants[type] || variants.error}`}
    >
      {message}
    </div>
  );
}
