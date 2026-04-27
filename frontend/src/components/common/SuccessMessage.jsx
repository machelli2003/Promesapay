import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import AppButton from "../ui/AppButton";

export default function SuccessMessage({
  title = "Success!",
  message = "Your action was completed successfully.",
  actionText = "Continue",
  actionTo = "/dashboard",
  showIcon = true
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      {showIcon && (
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 animate-scale-in">
          <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
      )}
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        {message}
      </p>
      <Link to={actionTo}>
        <AppButton iconRight={ArrowRight}>
          {actionText}
        </AppButton>
      </Link>
    </div>
  );
}