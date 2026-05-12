import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMe, getOAuthToken, getCsrfToken } from "../api/auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const error = params.get("error");

    if (error) {
      navigate("/login?error=auth_failed");
      return;
    }

    if (status === "success") {
      // Retrieve CSRF token and auth token from secure session cookie
      getCsrfToken()
        .then((csrfRes) => {
          localStorage.setItem("csrf_token", csrfRes.data.csrf_token);
          return getOAuthToken();
        })
        .then((res) => {
          const token = res.data.token;
          localStorage.setItem("token", token);

          // Fetch user info
          return getMe().then((userRes) => ({
            token,
            user: userRes.data.user
          }));
        })
        .then(({ token, user }) => {
          login(token, user);
          navigate("/dashboard");
        })
        .catch((err) => {
          console.error("OAuth callback error:", err);
          localStorage.removeItem("token");
          navigate("/login?error=auth_failed");
        });
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