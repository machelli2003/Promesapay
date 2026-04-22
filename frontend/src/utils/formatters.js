export const formatCurrency = (amount, currency = "GHS") =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency }).format(amount);

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

export const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export const calcProgress = (raised, goal) =>
  goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0;