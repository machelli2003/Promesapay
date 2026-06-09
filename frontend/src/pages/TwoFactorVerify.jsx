import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { FiShield, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { API_ORIGIN } from "../utils/constants";

export default function TwoFactorVerify() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const preAuthToken = location.state?.preAuthToken;
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [attempts, setAttempts] = useState(3);

  useEffect(() => {
    if (!preAuthToken) {
      toast.error("No pre-authentication token");
      navigate("/login");
    }
  }, [preAuthToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code) {
      toast.error("Please enter a code");
      return;
    }

    if (!useBackupCode && code.length < 6) {
      toast.error("Authenticator code must be 6 digits");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_ORIGIN}/api/auth/2fa/verify-login`,
        { code },
        {
          headers: { Authorization: `Bearer ${preAuthToken}` },
          withCredentials: true,
        }
      );

      const { token, user } = res.data;
      login(token, user);
      toast.success("Welcome!");
      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data?.message || "Invalid code";
      toast.error(message);

      const remainingAttempts = attempts - 1;
      setAttempts(remainingAttempts);

      if (remainingAttempts <= 0) {
        toast.error("Too many failed attempts. Please try again later.");
        navigate("/login");
      }

      setCode("");
    } finally {
      setLoading(false);
    }
  };

  if (!preAuthToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="mb-6 flex justify-center">
          <div className="bg-indigo-100 rounded-full p-4">
            <FiShield className="w-8 h-8 text-indigo-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Verify Identity
        </h1>
        <p className="text-gray-600 text-center mb-6">
          {useBackupCode
            ? "Enter one of your backup codes"
            : "Enter the 6-digit code from your authenticator app"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              {useBackupCode ? "Backup Code" : "Authentication Code"}
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) =>
                setCode(
                  useBackupCode
                    ? e.target.value.slice(0, 10)
                    : e.target.value.slice(0, 6)
                )
              }
              placeholder={useBackupCode ? "1234567890" : "000000"}
              maxLength={useBackupCode ? "10" : "6"}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-widest font-mono"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => setUseBackupCode(!useBackupCode)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {useBackupCode
              ? "Use authenticator code instead"
              : "Use backup code instead"}
          </button>
        </div>

        {attempts <= 1 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <FiAlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">
              You have {attempts} attempt{attempts !== 1 ? "s" : ""} remaining
            </p>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> If you've lost access to your authenticator,
            use one of your backup codes to regain access.
          </p>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="w-full mt-4 text-gray-600 hover:text-gray-700 font-medium py-2"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
