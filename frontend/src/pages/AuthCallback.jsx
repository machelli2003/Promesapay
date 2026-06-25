import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMe } from "../api/auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const error = params.get("error");
    const tokenFromUrl = params.get("token");

    if (error) {
      navigate("/login?error=auth_failed");
      return;
    }

    if (status === "success") {
      if (!tokenFromUrl) {
        navigate("/login?error=auth_failed");
        return;
      }

      localStorage.setItem("token", tokenFromUrl);
      getMe()
        .then((userRes) => {
          login(tokenFromUrl, userRes.data.user);
          navigate("/dashboard");
        })
        .catch(() => navigate("/login?error=auth_failed"));
    } else {
      navigate("/login?error=auth_failed");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
      <p className="text-slate-500 dark:text-slate-400 text-sm">Signing you in...</p>
    </div>
  );
}