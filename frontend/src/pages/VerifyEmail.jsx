import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { FiCheckCircle, FiAlertCircle, FiMail, FiLoader } from "react-icons/fi";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    verifyEmail();
  }, [token]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const verifyEmail = async () => {
    try {
      setStatus("verifying");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/verify-email`,
        { token },
        { withCredentials: true }
      );

      setStatus("success");
      setMessage("Your email has been verified successfully!");
      toast.success("Email verified!");

      // Redirect to dashboard after 3 seconds
      setTimeout(() => navigate("/dashboard"), 3000);
    } catch (error) {
      setStatus("error");
      const errorMsg =
        error.response?.data?.message ||
        "Failed to verify email. The link may have expired.";
      setMessage(errorMsg);
      setCanResend(true);
      toast.error(errorMsg);
    }
  };

  const handleResend = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/send-verification-email`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      toast.success("Verification email sent! Check your inbox.");
      setResendCooldown(60); // 60 second cooldown
      setMessage("New verification email sent. Check your inbox.");
    } catch (error) {
      toast.error("Failed to resend verification email");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {status === "verifying" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="bg-blue-100 rounded-full p-4 animate-spin">
                <FiLoader className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Email
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="bg-green-100 rounded-full p-4">
                <FiCheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting to dashboard in a few seconds...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="bg-red-100 rounded-full p-4">
                <FiAlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>

            {canResend && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  The verification link may have expired. Request a new one:
                </p>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-colors ${
                    resendCooldown > 0
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  <FiMail className="w-4 h-4" />
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend Verification Email"}
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <a
                  href="/login"
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Back to login
                </a>
              </p>
            </div>
          </>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> Verification links expire in 1 hour.
          </p>
        </div>
      </div>
    </div>
  );
}
