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

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AppLayout from "./components/layout/AppLayout";
import OrgProvider from "./context/OrgContext";
import WorkspaceProvider from "./context/WorkspaceContext";

function App() {
  return (
    <OrgProvider>
      <WorkspaceProvider>
        <BrowserRouter>
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

            {/* Public Verification Route */}
            <Route path="/verify/:code?" element={<VerifyCredential />} />

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

              {/* Root Redirect to Dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Route>

            {/* Fallback Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </WorkspaceProvider>
    </OrgProvider>
  );
}

export default App;