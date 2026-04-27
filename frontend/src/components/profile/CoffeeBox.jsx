import { Coffee } from "lucide-react";
import { useState } from "react";
import { COFFEE_OPTIONS, COFFEE_PRICE } from "../../utils/constants";
import { formatCurrency } from "../../utils/formatters";
import AppButton from "../ui/AppButton";

export default function CoffeeBox({ onBuy }) {
  const [selected, setSelected] = useState(1);
  const [name, setName]         = useState("");
  const [message, setMessage]   = useState("");

  const total   = selected * COFFEE_PRICE;
  const isValid = name.trim();

  return (
    <div className="card card-body space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
          <Coffee className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Buy me a coffee</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">{formatCurrency(COFFEE_PRICE)} per coffee</p>
        </div>
      </div>

      {/* Coffee selector */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">How many coffees?</p>
        <div className="flex items-center gap-3">
          <span className="text-2xl">☕</span>
          <span className="text-slate-300 dark:text-slate-600">×</span>
          <div className="flex gap-2">
            {COFFEE_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setSelected(n)}
                className={`w-10 h-10 rounded-lg text-sm font-bold border transition-all duration-150
                  ${selected === n
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm scale-105"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600"
                  }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{formatCurrency(total)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{selected} coffee{selected > 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="field-label">Your name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          className="input"
        />
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label className="field-label">
          Message
          <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Say something nice..."
          rows={2}
          className="input resize-none"
        />
      </div>

      <AppButton
        onClick={() => isValid && onBuy({ cups: selected, amount: total, donor_name: name, message })}
        disabled={!isValid}
        size="lg"
        icon={Coffee}
        className="w-full bg-amber-500 hover:bg-amber-600 border-amber-500"
      >
        Send {selected} coffee{selected > 1 ? "s" : ""} · {formatCurrency(total)}
      </AppButton>
    </div>
  );
}