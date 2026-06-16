import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import AuthLayout from "../layouts/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import axios from "axios";
import { API_ORIGIN } from "../utils/constants";
import { useToast } from "../hooks/useToast";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const { error: toastError, success: toastSuccess } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!token) {
      toastError("Invalid reset link");
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const validatePassword = (pwd) => {
    const newErrors = {};
    if (pwd.length < 10) newErrors.length = "At least 10 characters";
    if (!/[A-Z]/.test(pwd)) newErrors.uppercase = "One uppercase letter";
    if (!/[a-z]/.test(pwd)) newErrors.lowercase = "One lowercase letter";
    if (!/[0-9]/.test(pwd)) newErrors.number = "One number";
    if (!/[!@#$%^&*]/.test(pwd)) newErrors.special = "One special character (!@#$%^&*)";
    return newErrors;
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setErrors(validatePassword(pwd));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toastError("Please fill in all fields");
      return;
    }
    if (Object.keys(errors).length > 0) {
      toastError("Password does not meet requirements");
      return;
    }
    if (password !== confirmPassword) {
      toastError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_ORIGIN}/api/auth/reset-password`,
        { token, new_password: password },
        { withCredentials: true }
      );
      toastSuccess("Password reset successfully!");
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to reset password";
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = Object.keys(errors).length === 0 && password.length > 0;

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-navy-900 dark:text-navy-50 mb-2">
            Password Reset Successful!
          </h2>
          <p className="text-muted text-sm mb-6">
            Your password has been reset. You can now log in with your new password.
          </p>
          <Button variant="primary" onClick={() => navigate("/login")} className="w-full">
            Go to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (!token) return null;

  const reqs = [
    { key: "length", label: "At least 10 characters" },
    { key: "uppercase", label: "One uppercase letter (A-Z)" },
    { key: "lowercase", label: "One lowercase letter (a-z)" },
    { key: "number", label: "One number (0-9)" },
    { key: "special", label: "One special character (!@#$%^&*)" },
  ];

  return (
    <AuthLayout title="Set New Password" subtitle="Create a strong password to secure your account.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Password Field */}
        <div className="relative">
          <Input
            label="New Password"
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter new password"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-muted hover:text-navy-700 dark:hover:text-navy-200 transition-colors"
          >
            {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
          </button>
        </div>

        {/* Password Requirements */}
        {password && (
          <div className="bg-navy-50 dark:bg-navy-800/50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-navy-700 dark:text-navy-200 mb-2">Password requirements:</p>
            {reqs.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                {errors[key] ? (
                  <FiAlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                ) : (
                  <FiCheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                )}
                <span className={`text-xs ${errors[key] ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Confirm Password */}
        <div className="relative">
          <Input
            label="Confirm Password"
            id="confirm"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-[38px] text-muted hover:text-navy-700 dark:hover:text-navy-200 transition-colors"
          >
            {showConfirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
          </button>
        </div>

        {/* Match Indicator */}
        {confirmPassword && (
          <div className="flex items-center gap-2 text-xs">
            {password === confirmPassword ? (
              <>
                <FiCheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Passwords match</span>
              </>
            ) : (
              <>
                <FiAlertCircle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-red-600 dark:text-red-400">Passwords do not match</span>
              </>
            )}
          </div>
        )}

        <Button
          type="submit"
          variant="secondary"
          size="xl"
          loading={loading}
          disabled={!isPasswordValid || password !== confirmPassword}
          className="w-full"
        >
          Reset Password
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-navy-700 text-center">
        <Link to="/login" className="text-sm text-gold-500 hover:text-gold-600 font-semibold transition-colors">
          Back to Sign In
        </Link>
      </div>

      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
        <p className="text-xs text-muted">
          <strong>Note:</strong> This link is valid for 1 hour. If it expires, request a new one.
        </p>
      </div>
    </AuthLayout>
  );
}