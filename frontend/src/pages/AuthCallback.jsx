import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMe } from "../api/auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error || !token) {
      navigate("/login?error=auth_failed");
      return;
    }

    // Store token first, then fetch user info
    localStorage.setItem("token", token);

    getMe()
      .then((res) => {
        login(token, res.data.user);
        navigate("/dashboard");
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login?error=auth_failed");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-sm">Signing you in...</p>
    </div>
  );
}