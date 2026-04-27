import { Link } from "react-router-dom";
import { Home, ArrowLeft, Coffee } from "lucide-react";
import AppButton from "../components/ui/AppButton";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center animate-fade-in">
      <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mb-6">
        <Coffee className="h-10 w-10 text-violet-600 dark:text-violet-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Page not found
      </h1>
      <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-8">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="btn-secondary btn-md"
        >
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
        <Link to="/">
          <AppButton icon={Home}>Home</AppButton>
        </Link>
      </div>
    </div>
  );
}