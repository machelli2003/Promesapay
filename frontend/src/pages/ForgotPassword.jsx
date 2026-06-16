import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import AuthLayout from "../layouts/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import axios from "axios";
import { API_ORIGIN } from "../utils/constants";
import { useToast } from "../hooks/useToast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { error: toastError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toastError("Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_ORIGIN}/api/auth/forgot-password`,
        { email: email.trim().toLowerCase() },
        { withCredentials: true }
      );
      setSubmitted(true);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to send reset email";
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-navy-900 dark:text-navy-50 mb-2">
            Check Your Email
          </h2>
          <p className="text-muted text-sm mb-6">
            We've sent a password reset link to <strong className="text-navy-700 dark:text-navy-200">{email}</strong>
          </p>
          <div className="bg-gold-50 dark:bg-gold-900/10 border border-gold-200 dark:border-gold-800 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-navy-600 dark:text-navy-300">
              <strong>Didn't receive the email?</strong>
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted">
              <li>• Check your spam folder</li>
              <li>• The link expires in 1 hour</li>
              <li>• You can request another link if needed</li>
            </ul>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-gold-500 hover:text-gold-600 font-medium transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          icon={FiMail}
          disabled={loading}
        />

        <Button
          type="submit"
          variant="secondary"
          size="xl"
          loading={loading}
          icon={FiMail}
          className="w-full"
        >
          Send Reset Link
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-navy-700 text-center">
        <p className="text-sm text-muted">
          Remember your password?{" "}
          <Link to="/login" className="text-gold-500 hover:text-gold-600 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-4 p-4 bg-navy-50 dark:bg-navy-800/50 border border-navy-100 dark:border-navy-700 rounded-xl">
        <p className="text-xs text-muted">
          <strong>Security tip:</strong> Never share your password reset link with anyone. Promesapay staff will never ask for it.
        </p>
      </div>
    </AuthLayout>
  );
}