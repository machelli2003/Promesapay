import clsx from "clsx";

export default function Tabs({ tabs, activeTab, onChange, className = "" }) {
  return (
    <div className={clsx("tabs-pill", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            "tab-pill",
            activeTab === tab.value && "active"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}