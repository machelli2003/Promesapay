import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import AuthLayout from "../layouts/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { loginUser, googleLogin } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";

export default function Login() {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});

  const set = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorCode = params.get("error");
    const reason = params.get("reason");
    const decodedReason = reason ? decodeURIComponent(reason.replace(/\+/g, " ")) : "";
    if (errorCode) {
      error(decodedReason ? `${errorCode}: ${decodedReason}` : errorCode);
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.identifier.trim()) newErrors.identifier = "Email or username is required";
    if (!form.password) newErrors.password = "Password is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser(form);
      if (res.data.requires_2fa) {
        navigate("/2fa-verify", {
          state: { preAuthToken: res.data.pre_auth_token },
        });
        return;
      }
      login(res.data.token, res.data.user);
      success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      error(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back to Promesapay">
      {/* Google Button */}
      <button
        type="button"
        onClick={googleLogin}
        className="w-full flex items-center justify-center gap-3 border border-slate-200 dark:border-navy-700 rounded-xl py-3 text-sm font-medium text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800/50 transition-colors mb-4"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-navy-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-navy-900 px-3 text-xs text-muted">or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email or username"
          name="identifier"
          value={form.identifier}
          onChange={set}
          placeholder="you@example.com"
          autoComplete="username"
          required
          error={errors.identifier}
        />
        <div>
          <Input
            label="Password"
            name="password"
            type={showPass ? "text" : "password"}
            value={form.password}
            onChange={set}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            error={errors.password}
          />
          <div className="text-right mt-1.5">
            <Link to="/forgot-password" className="text-xs text-gold-500 hover:text-gold-600 font-medium transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="secondary"
          size="xl"
          loading={loading}
          icon={FiArrowRight}
          iconPosition="right"
          className="w-full mt-2"
        >
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        No account?{" "}
        <Link to="/register" className="text-gold-500 hover:text-gold-600 font-semibold transition-colors">
          Create one free
        </Link>
      </p>
    </AuthLayout>
  );
}