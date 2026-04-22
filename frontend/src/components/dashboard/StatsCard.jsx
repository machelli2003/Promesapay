import { TrendingUp } from "lucide-react";

export default function StatsCard({ title, value, subtitle, icon: Icon, color = "primary", trend }) {
  const colors = {
    primary: "from-primary-500 to-purple-600",
    coffee:  "from-amber-400 to-coffee-dark",
    green:   "from-emerald-400 to-teal-600",
    blue:    "from-blue-400 to-indigo-600",
  };

  return (
    <div className="card relative overflow-hidden group hover:shadow-md transition-all duration-300">
      {/* Background gradient blob */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${colors[color]} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          {trend !== undefined && (
            <div className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]} shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}