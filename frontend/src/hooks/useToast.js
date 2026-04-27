import toast from "react-hot-toast";

export function useToast() {
  const success = (msg) =>
    toast.success(msg, {
      duration: 3500,
      style: {
        borderRadius: "12px",
        background: document.documentElement.classList.contains('dark')
          ? "#064e3b"
          : "#f0fdf4",
        color: document.documentElement.classList.contains('dark')
          ? "#86efac"
          : "#166534",
        border: document.documentElement.classList.contains('dark')
          ? "#059669"
          : "#bbf7d0",
        fontWeight: "500",
      },
    });

  const error = (msg) =>
    toast.error(msg, {
      duration: 4000,
      style: {
        borderRadius: "12px",
        background: document.documentElement.classList.contains('dark')
          ? "#7f1d1d"
          : "#fef2f2",
        color: document.documentElement.classList.contains('dark')
          ? "#fca5a5"
          : "#991b1b",
        border: document.documentElement.classList.contains('dark')
          ? "#991b1b"
          : "#fecaca",
        fontWeight: "500",
      },
    });

  const loading = (msg) => toast.loading(msg, {
      style: {
        borderRadius: "12px",
        background: document.documentElement.classList.contains('dark')
          ? "#475467"
          : "#e2e8f0",
        color: document.documentElement.classList.contains('dark')
          ? "#f8fafc"
          : "#1e293b",
      }
    });
  const dismiss = (id) => toast.dismiss(id);

  return { success, error, loading, dismiss };
}