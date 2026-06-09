export default function DateRangeFilter({ startDate, endDate, onChange, onApply }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm theme-muted">
        From
        <input
          type="date"
          value={startDate}
          onChange={(e) => onChange({ startDate: e.target.value, endDate })}
          className="theme-input w-auto"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm theme-muted">
        To
        <input
          type="date"
          value={endDate}
          onChange={(e) => onChange({ startDate, endDate: e.target.value })}
          className="theme-input w-auto"
        />
      </label>
      <button
        type="button"
        onClick={onApply}
        className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 dark:bg-sky-500"
      >
        Apply
      </button>
    </div>
  );
}
