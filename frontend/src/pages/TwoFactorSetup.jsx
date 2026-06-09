import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { FiCopy, FiCheckCircle, FiAlertCircle, FiShield } from "react-icons/fi";

export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const token = localStorage.getItem("auth_token");

  const [step, setStep] = useState("start"); // start, qr, verify, success
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSetupStart = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/2fa/setup`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setQrCode(res.data.provisioning_uri);
      setSecret(res.data.secret);
      setStep("qr");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to setup 2FA";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/2fa/enable`,
        { code: verificationCode },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setBackupCodes(res.data.backup_codes);
      setStep("success");
      toast.success("2FA enabled successfully!");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to verify code";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === "start") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="mb-6 flex justify-center">
            <div className="bg-indigo-100 rounded-full p-4">
              <FiShield className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Enable 2FA
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Two-factor authentication adds an extra layer of security to your
            account.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-sm text-blue-900 mb-2">
              How it works:
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✓ Download an authenticator app (Google Authenticator, Authy)</li>
              <li>✓ Scan the QR code we provide</li>
              <li>✓ Enter the 6-digit code to verify</li>
              <li>✓ Save your backup codes in a safe place</li>
            </ul>
          </div>

          <button
            onClick={handleSetupStart}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Starting...
              </>
            ) : (
              "Get Started"
            )}
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full mt-3 text-gray-600 hover:text-gray-700 font-medium py-2"
          >
            Skip for Now
          </button>
        </div>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Scan QR Code
          </h1>

          {/* QR Code placeholder - in production, you'd render actual QR code */}
          <div className="bg-gray-100 rounded-lg p-8 mb-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Open your authenticator app</p>
              <p className="text-xs text-gray-500 mb-4">
                and scan this code or enter the key below
              </p>
              {/* QR code would go here using qr-code library */}
              <div className="bg-white rounded border-2 border-gray-300 p-4 inline-block">
                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">QR Code</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-600 mb-2">Manual Entry Key:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-white border border-gray-300 rounded px-3 py-2">
                {secret}
              </code>
              <button
                onClick={() => copyToClipboard(secret)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <FiCopy className="w-4 h-4" />
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-2">Copied!</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 6-digit code from authenticator
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-widest font-mono"
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || verificationCode.length < 6}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="mb-6 flex justify-center">
            <div className="bg-green-100 rounded-full p-4">
              <FiCheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            2FA Enabled!
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Your account is now protected with two-factor authentication.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-sm text-amber-900 mb-3 flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4" />
              Save Your Backup Codes
            </h3>
            <p className="text-xs text-amber-800 mb-3">
              If you lose access to your authenticator, you can use these codes
              to log in:
            </p>
            <div className="bg-white rounded p-3 mb-3 space-y-1">
              {backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="text-xs font-mono text-gray-700 flex items-center justify-between"
                >
                  <span>{code}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => copyToClipboard(backupCodes.join("\n"))}
              className="w-full text-sm bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium py-2 rounded transition-colors"
            >
              Copy Codes
            </button>
          </div>

          <p className="text-xs text-gray-500 bg-gray-50 rounded p-3 mb-6">
            <strong>Keep them safe:</strong> Store these codes somewhere secure.
            Each code can only be used once.
          </p>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
}
