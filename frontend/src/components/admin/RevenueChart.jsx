/** Simple bar chart for revenue trends (no external chart library). */

export default function RevenueChart({ series = [], valueKey = "platform_revenue", label = "Platform revenue" }) {
  if (!series.length) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280", fontSize: "0.875rem" }}>
        No data for this period
      </div>
    );
  }

  const max = Math.max(...series.map((d) => d[valueKey] || 0), 1);
  const chartHeight = 200;

  return (
    <div>
      <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "#6b7280" }}>{label}</p>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "4px",
          height: chartHeight,
          padding: "0 0.5rem",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {series.map((point) => {
          const value = point[valueKey] || 0;
          const h = Math.max(4, (value / max) * (chartHeight - 24));
          return (
            <div
              key={point.period}
              title={`${point.period}: GH₵${value.toFixed(2)}`}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 32,
                  height: h,
                  background: "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)",
                  borderRadius: "4px 4px 0 0",
                }}
              />
              <span
                style={{
                  fontSize: "9px",
                  color: "#9ca3af",
                  transform: "rotate(-45deg)",
                  whiteSpace: "nowrap",
                  marginTop: 4,
                }}
              >
                {point.period.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
