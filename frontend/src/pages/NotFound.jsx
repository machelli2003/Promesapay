import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import AppButton from "../components/ui/AppButton";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center
                    px-4 text-center animate-fade-in">
      <p className="text-8xl font-black text-gray-100 select-none leading-none mb-2">
        404
      </p>
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        Page not found
      </h1>
      <p className="text-sm text-gray-500 max-w-xs mb-8">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="flex items-center gap-3">
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