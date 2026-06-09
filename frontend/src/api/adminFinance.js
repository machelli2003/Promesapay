import client from "./client";

export const getAdminOverview = (params) =>
  client.get("/admin/finance/overview", { params });

export const getAdminTrends = (params) =>
  client.get("/admin/finance/trends", { params });

export const getAdminTransactions = (params) =>
  client.get("/admin/finance/transactions", { params });

export const getPaystackSplitConfig = () =>
  client.get("/admin/finance/paystack-splits");

export const updatePaystackSplitConfig = (data) =>
  client.put("/admin/finance/paystack-splits", data);

const downloadExport = async (path, params, filenameFallback) => {
  const res = await client.get(path, {
    params,
    responseType: "blob",
  });
  const disposition = res.headers["content-disposition"] || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : filenameFallback;
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadCsvReport = (params) =>
  downloadExport("/admin/finance/export/csv", params, "promesapay-report.csv");

export const downloadPdfReport = (params) =>
  downloadExport("/admin/finance/export/pdf", params, "promesapay-report.pdf");
