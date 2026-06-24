import { lazy, Suspense, useEffect } from "react";
import { refreshCsrfToken } from "./api/auth";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { EnhancedErrorBoundary } from "./components/common/EnhancedErrorBoundary";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import Spinner from "./components/common/Spinner";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import TwoFactorSetup from "./pages/TwoFactorSetup";
import TwoFactorVerify from "./pages/TwoFactorVerify";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import EditProfile from "./pages/EditProfile";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import BuyCoffee from "./pages/BuyCoffee";
import PaymentVerify from "./pages/PaymentVerify";
import Funding from "./pages/Funding";
import BrowseCampaigns from "./pages/BrowseCampaigns";
import CampaignPage from "./pages/CampaignPage";
import CreateCampaign from "./pages/CreateCampaign";
import WalletPage from "./pages/WalletPage";

const FinancialDashboard = lazy(() => import("./pages/FinancialDashboard"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const AdminFinanceDashboard = lazy(() => import("./pages/admin/AdminFinanceDashboard"));
const AdminPayoutQueue = lazy(() => import("./pages/admin/AdminPayoutQueue"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const ReportDispute = lazy(() => import("./pages/Disputes/ReportDispute"));
const MyDisputes = lazy(() => import("./pages/Disputes/MyDisputes"));
const DisputeResolution = lazy(() => import("./pages/admin/DisputeResolution"));
const SystemMonitoring = lazy(() => import("./pages/admin/SystemMonitoring"));
const NotificationCenter = lazy(() => import("./pages/Notifications/NotificationCenter"));
const NotificationPreferences = lazy(() => import("./pages/Notifications/NotificationPreferences"));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <EnhancedErrorBoundary>
      <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/buy-coffee" element={<BuyCoffee />} />
            <Route path="/funding" element={<Funding />} />
            <Route path="/campaigns" element={<BrowseCampaigns />} />
            <Route path="/c/:slug" element={<CampaignPage />} />
            <Route path="/payment/verify" element={<PaymentVerify />} />
            <Route path="/campaigns/new" element={<ProtectedRoute><CreateCampaign /></ProtectedRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/2fa-setup" element={<ProtectedRoute><TwoFactorSetup /></ProtectedRoute>} />
            <Route path="/2fa-verify" element={<TwoFactorVerify />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/u/:username" element={<ProfilePage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<NotFound />} />
            <Route
              path="/financial"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
                    <FinancialDashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
                    <AdminHome />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/finance"
              element={
                <AdminRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
                    <AdminFinanceDashboard />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/payouts"
              element={
                <AdminRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
                    <AdminPayoutQueue />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
                    <UserManagement />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/disputes/report"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
                    <ReportDispute />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/disputes/my-disputes"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
                    <MyDisputes />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/disputes"
              element={
                <AdminRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
                    <DisputeResolution />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/monitoring"
              element={
                <AdminRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
                    <SystemMonitoring />
                  </Suspense>
                </AdminRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
                    <NotificationCenter />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications/preferences"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
                    <NotificationPreferences />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </EnhancedErrorBoundary>
  );
}

export default function App() {
  useEffect(() => {
    refreshCsrfToken().catch(() => {});
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}