import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Coffee, ArrowRight, Check } from "lucide-react";
import { registerUser, googleLogin } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import InputField from "../components/ui/InputField";
import AppButton from "../components/ui/AppButton";

const perks = [
  "Free to set up — no monthly fees",
  "Accept donations & coffee tips",
  "Paystack-powered secure payments",
  "Your own shareable profile link",
];

export default function Register() {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [form, setForm] = useState({ full_name: "", username: "", email: "", password: "" });

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerUser(form);
      login(res.data.token, res.data.user);
      success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_480px]">
      {/* Left */}
      <div className="hidden lg:flex flex-col justify-between bg-violet-600 px-12 py-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <Coffee className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold text-sm">Promesapay</span>
        </Link>

        <div className="max-w-sm">
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Start receiving support from your audience today
          </h2>
          <p className="text-violet-100 text-sm leading-relaxed mb-8">
            Thousands of African creators use Promesapay to turn passion into income — music, art, podcasts, and more.
          </p>
          <ul className="space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-violet-50 text-sm">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-violet-200 text-xs">© {new Date().getFullYear()} Promesapay</p>
      </div>

      {/* Right */}
      <div className="flex items-center justify-center bg-white dark:bg-slate-950 px-6 py-12">
        <div className="w-full max-w-sm animate-slide-up">
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Coffee className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Promesapay</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Create your account</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Already signed up?{" "}
              <Link to="/login" className="btn-link">Sign in</Link>
            </p>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={googleLogin}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-slate-950 px-3 text-xs text-slate-400">or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField label="Full name" name="full_name" value={form.full_name}
              onChange={set} placeholder="John Doe" required />

            <InputField label="Username" name="username" value={form.username}
              onChange={set} placeholder="johndoe" required prefix="@"
              hint={form.username ? `fundme.app/u/${form.username}` : undefined} />

            <InputField label="Email" name="email" type="email" value={form.email}
              onChange={set} placeholder="you@example.com" required />

            <InputField label="Password" name="password"
              type={showPass ? "text" : "password"} value={form.password}
              onChange={set} placeholder="Min. 6 characters" required
              suffix={
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <AppButton type="submit" size="lg" loading={loading} iconRight={ArrowRight} className="w-full mt-1">
              Create account
            </AppButton>

            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
              By signing up you agree to our{" "}
              <a href="#" className="underline hover:text-slate-600 dark:hover:text-slate-300">Terms</a> and{" "}
              <a href="#" className="underline hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}