// src/App.jsx

import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthLayout, GuestLayout } from "./pages/Layout";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import HomePage from "./pages/HomePage";
import BuilderPage from "./pages/BuilderPage";
import PreviewPage from "./pages/PreviewPage";
import PublishPage from "./pages/PublishPage";
import ProfilePage from "./pages/ProfilePage";
import PricingPage from "./pages/PricingPage";
import LandingPage from "./pages/LandingPage";
import MyProjects from "./pages/MyProjects";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import RefundPage from "./pages/RefundPage";
import ContactPage from "./pages/ContactPage";
import BuyCreditsHost from "./components/BuyCreditsHost";
import ScrollToTop from "./components/ScrollToTop";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import ManualPaymentHost from "./components/ManualPaymentHost";
import { getPaymentMethods } from "./utils/topup";
import { useEffect } from "react";
import WebPublicPage from "./pages/WebPublicPage";
import DynamicAppPage from "./pages/DynamicAppPage";

const App = () => {
  const location = useLocation();

  const hostname = window.location.hostname;
  const isDynamicSubdomain =
    hostname.endsWith("renscraft.cyou") &&
    hostname !== "renscraft.cyou" &&
    hostname !== "www.renscraft.cyou";

  useEffect(() => {
    getPaymentMethods();
  }, []);

  useEffect(() => {
    const badgeEl = document.getElementById("static-badges-for-bot");
    if (badgeEl) {
      // Cuma tampilin kalau di Landing Page asli (/),
      // BUKAN di dynamic subdomain, BUKAN di preview/publish page
      const isLanding =
        location.pathname === "/" &&
        !isDynamicSubdomain &&
        !location.pathname.startsWith("/app/") &&
        !location.pathname.startsWith("/publish/") &&
        !location.pathname.startsWith("/preview/");

      badgeEl.style.display = isLanding ? "block" : "none";
    }
  }, [location.pathname, isDynamicSubdomain]);

  return (
    <>
      <ScrollToTop />
      <Toaster />
      <BuyCreditsHost /> <ManualPaymentHost />
      <Routes>
        {/* Guest */}
        <Route element={<GuestLayout />}>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
        </Route>

        {/* Protected */}
        <Route element={<AuthLayout />}>
          <Route path="/chat" element={<HomePage />} />
          <Route path="/chat/:id" element={<BuilderPage />} />
          <Route path="/my-projects" element={<MyProjects />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/preview/:id" element={<PreviewPage />} />
        </Route>

        {/* Public */}
        <Route
          path="/"
          element={isDynamicSubdomain ? <DynamicAppPage /> : <LandingPage />}
        />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/publish/:name" element={<PublishPage />} />
        <Route path="/webpub" element={<WebPublicPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Dynamic App Public Route */}
        <Route path="/app/:slug" element={<DynamicAppPage />} />

        {/* Legal */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund" element={<RefundPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
