import toast from "react-hot-toast";

export function useToast() {
  const success = (msg) =>
    toast.success(msg, {
      duration: 3500,
      style: {
        borderRadius: "12px",
        background: "#f0fdf4",
        color: "#166534",
        border: "1px solid #bbf7d0",
        fontWeight: "500",
      },
    });

  const error = (msg) =>
    toast.error(msg, {
      duration: 4000,
      style: {
        borderRadius: "12px",
        background: "#fef2f2",
        color: "#991b1b",
        border: "1px solid #fecaca",
        fontWeight: "500",
      },
    });

  const loading = (msg) => toast.loading(msg, { style: { borderRadius: "12px" } });
  const dismiss = (id) => toast.dismiss(id);

  return { success, error, loading, dismiss };
}