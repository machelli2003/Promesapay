import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { API_ORIGIN } from "../utils/constants";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link");
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const validatePassword = (pwd) => {
    const newErrors = {};
    
    if (pwd.length < 10) {
      newErrors.length = "At least 10 characters";
    }
    if (!/[A-Z]/.test(pwd)) {
      newErrors.uppercase = "One uppercase letter";
    }
    if (!/[a-z]/.test(pwd)) {
      newErrors.lowercase = "One lowercase letter";
    }
    if (!/[0-9]/.test(pwd)) {
      newErrors.number = "One number";
    }
    if (!/[!@#$%^&*]/.test(pwd)) {
      newErrors.special = "One special character (!@#$%^&*)";
    }

    return newErrors;
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setErrors(validatePassword(pwd));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (Object.keys(errors).length > 0) {
      toast.error("Password does not meet requirements");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_ORIGIN}/api/auth/reset-password`,
        {
          token,
          new_password: password,
        },
        { withCredentials: true }
      );

      toast.success("Password reset successfully!");
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to reset password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-green-100 rounded-full p-4">
              <FiCheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your password has been reset. You can now log in with your new password.
          </p>

          <p className="text-sm text-gray-500 mb-4">
            Redirecting to login in a few seconds...
          </p>

          <Link
            to="/login"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  const isPasswordValid = Object.keys(errors).length === 0 && password.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h1>
          <p className="text-gray-600">
            Create a strong password to secure your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Requirements */}
            {password && (
              <div className="mt-3 space-y-1">
                <div className="text-xs font-medium text-gray-700 mb-2">Password requirements:</div>
                {[
                  { key: "length", label: "At least 10 characters" },
                  { key: "uppercase", label: "One uppercase letter (A-Z)" },
                  { key: "lowercase", label: "One lowercase letter (a-z)" },
                  { key: "number", label: "One number (0-9)" },
                  { key: "special", label: "One special character (!@#$%^&*)" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    {errors[key] ? (
                      <FiAlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <FiCheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <span className={errors[key] ? "text-red-600 text-xs" : "text-green-600 text-xs"}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>

            {/* Match Indicator */}
            {confirmPassword && (
              <div className="mt-2 flex items-center gap-2">
                {password === confirmPassword ? (
                  <>
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <FiAlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-600">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid || password !== confirmPassword}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Back to Sign In
            </Link>
          </p>
        </div>

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> This link is valid for 1 hour. If it expires, request a new one.
          </p>
        </div>
      </div>
    </div>
  );
}
