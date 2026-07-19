import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/Organizations";
import Workspaces from "./pages/Workspaces";
import Templates from "./pages/Templates";
import TemplateCreate from "./pages/TemplateCreate";
import TemplateDetail from "./pages/TemplateDetail";
import Credentials from "./pages/Credentials";
import CredentialCreate from "./pages/CredentialCreate";
import CredentialBatch from "./pages/CredentialBatch";
import CredentialDetail from "./pages/CredentialDetail";
import Files from "./pages/Files";
import Jobs from "./pages/Jobs";
import EmailLogs from "./pages/EmailLogs";
import Settings from "./pages/Settings";
import VerifyCredential from "./pages/VerifyCredential";
import Landing from "./pages/Landing";
import OnboardingPage from "./pages/OnboardingPage";
import Marketplace from "./pages/Marketplace";
import MarketplaceDetail from "./pages/MarketplaceDetail";
import useAuth from "./hooks/useAuth";
import { Outlet as RouterOutlet } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AppLayout from "./components/layout/AppLayout";
import OrgProvider from "./context/OrgContext";
import WorkspaceProvider from "./context/WorkspaceContext";
import { Toaster } from "react-hot-toast";

function MarketplaceLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <AppLayout /> : <RouterOutlet />;
}

function App() {
  return (
    <OrgProvider>
      <WorkspaceProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-lg)',
                maxWidth: '380px',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
                duration: 6000,
              },
            }}
          />
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Public Landing Page Route */}
            <Route path="/" element={<Landing />} />

            {/* Public Verification Route */}
            <Route path="/verify/:code?" element={<VerifyCredential />} />

            {/* Hybrid Community Marketplace Routes (Sidebar if logged in, standalone if public) */}
            <Route element={<MarketplaceLayout />}>
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:id" element={<MarketplaceDetail />} />
            </Route>

            {/* Onboarding — protected but outside AppLayout */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Protected SaaS App Layout & Sub-routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/organizations" element={<Organizations />} />
              <Route path="/workspaces" element={<Workspaces />} />

              {/* Templates */}
              <Route path="/templates" element={<Templates />} />
              <Route path="/templates/create" element={<TemplateCreate />} />
              <Route path="/templates/:id" element={<TemplateDetail />} />

              {/* Credentials */}
              <Route path="/credentials" element={<Credentials />} />
              <Route path="/credentials/create" element={<CredentialCreate />} />
              <Route path="/credentials/batch" element={<CredentialBatch />} />
              <Route path="/credentials/:id" element={<CredentialDetail />} />

              {/* Files, Jobs, Email Logs, Settings */}
              <Route path="/files" element={<Files />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/email-logs" element={<EmailLogs />} />
              <Route path="/settings" element={<Settings />} />

              {/* Redirect any other protected routes to Dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Route>

            {/* Fallback Catch-all for non-logged-in users */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </WorkspaceProvider>
    </OrgProvider>
  );
}

export default App;