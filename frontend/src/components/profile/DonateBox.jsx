import { Heart } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "../../utils/formatters";
import AppButton from "../ui/AppButton";

const QUICK_AMOUNTS = [10, 25, 50, 100];

export default function DonateBox({ onDonate }) {
  const [amount, setAmount]   = useState("");
  const [quick, setQuick]     = useState(null);
  const [name, setName]       = useState("");
  const [message, setMessage] = useState("");

  const selected = quick !== null ? quick : parseFloat(amount);
  const isValid  = name.trim() && selected >= 1;

  const handleQuick = (val) => {
    setQuick(val);
    setAmount("");
  };

  const handleCustom = (e) => {
    setAmount(e.target.value);
    setQuick(null);
  };

  const handleSubmit = () => {
    if (!isValid) return;
    onDonate({ amount: selected, donor_name: name, message });
  };

  return (
    <div className="card card-body space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
          <Heart className="h-4 w-4 text-rose-500" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Make a donation</h3>
          <p className="text-xs text-gray-400">Support this creator's goal</p>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500">Select amount</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((val) => (
            <button
              key={val}
              onClick={() => handleQuick(val)}
              className={`py-2 rounded-lg text-sm font-semibold border transition-all duration-150
                ${quick === val
                  ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:border-sky-300 hover:text-sky-600"
                }`}
            >
              {formatCurrency(val)}
            </button>
          ))}
        </div>
      </div>

      {/* Custom amount */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-500">Or enter custom amount</p>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">
            GH₵
          </span>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={handleCustom}
            placeholder="0.00"
            className="input pl-12"
          />
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
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Leave an encouraging message..."
          rows={2}
          className="input resize-none"
        />
      </div>

      <AppButton
        onClick={handleSubmit}
        disabled={!isValid}
        size="lg"
        icon={Heart}
        className="w-full"
      >
        Donate {selected >= 1 ? formatCurrency(selected) : ""}
      </AppButton>
    </div>
  );
}