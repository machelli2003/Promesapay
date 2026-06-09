import { Link } from "react-router-dom";
import { FiHome, FiArrowLeft, FiCoffee } from "react-icons/fi";
import AppButton from "../components/ui/AppButton";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center animate-fade-in">
      <div className="w-20 h-20 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mb-6">
        <FiCoffee className="h-10 w-10 text-sky-600 dark:text-sky-400" />
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
          <FiArrowLeft className="h-4 w-4" /> Go back
        </button>
        <Link to="/">
          <AppButton icon={FiHome}>Home</AppButton>
        </Link>
      </div>
    </div>
  );
}