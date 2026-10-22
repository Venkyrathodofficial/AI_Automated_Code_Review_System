import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Core Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import EmailVerified from "./pages/EmailVerified";
import Index from "./pages/Index";
import Repositories from "./pages/Repositories";
import Issues from "./pages/Issues";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import Leaderboard from "./pages/Leaderboard";
import ReportShare from "./pages/ReportShare";

// Security Engines
import CodeSecurity from "./pages/CodeSecurity";
import SupplyChain from "./pages/SupplyChain";
import SecretsSecurity from "./pages/SecretsSecurity";
import ContainerSecurity from "./pages/ContainerSecurity";
import CloudSecurity from "./pages/CloudSecurity";
import ApiSecurity from "./pages/ApiSecurity";

// AI & Developer Workflows
import AiSecurity from "./pages/AiSecurity";
import Workflows from "./pages/Workflows";
import Policies from "./pages/Policies";

// Insights & Administration
import Reports from "./pages/Reports";
import Organization from "./pages/Organization";
import Integrations from "./pages/Integrations";
import CustomerIncidents from "./pages/CustomerIncidents";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/verified" element={<EmailVerified />} />
            <Route path="/verify-email" element={<EmailVerified />} />
            <Route path="/verified" element={<EmailVerified />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/report/:scanId" element={<ReportShare />} />

            {/* Workspace Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/repositories" element={<ProtectedRoute><Repositories /></ProtectedRoute>} />
            <Route path="/issues" element={<ProtectedRoute><Issues /></ProtectedRoute>} />

            {/* Security Engines (Canonical and Engine paths) */}
            <Route path="/engines/code" element={<ProtectedRoute><CodeSecurity /></ProtectedRoute>} />
            <Route path="/code-security" element={<ProtectedRoute><CodeSecurity /></ProtectedRoute>} />
            <Route path="/engines/supply-chain" element={<ProtectedRoute><SupplyChain /></ProtectedRoute>} />
            <Route path="/supply-chain" element={<ProtectedRoute><SupplyChain /></ProtectedRoute>} />
            <Route path="/engines/secrets" element={<ProtectedRoute><SecretsSecurity /></ProtectedRoute>} />
            <Route path="/secrets-security" element={<ProtectedRoute><SecretsSecurity /></ProtectedRoute>} />
            <Route path="/engines/containers" element={<ProtectedRoute><ContainerSecurity /></ProtectedRoute>} />
            <Route path="/container-security" element={<ProtectedRoute><ContainerSecurity /></ProtectedRoute>} />
            <Route path="/engines/cloud" element={<ProtectedRoute><CloudSecurity /></ProtectedRoute>} />
            <Route path="/cloud-security" element={<ProtectedRoute><CloudSecurity /></ProtectedRoute>} />
            <Route path="/engines/api-security" element={<ProtectedRoute><ApiSecurity /></ProtectedRoute>} />
            <Route path="/api-security" element={<ProtectedRoute><ApiSecurity /></ProtectedRoute>} />

            {/* AI & Developer Workflows */}
            <Route path="/workflows/ai-security" element={<ProtectedRoute><AiSecurity /></ProtectedRoute>} />
            <Route path="/workflows/pull-requests" element={<ProtectedRoute><Workflows /></ProtectedRoute>} />
            <Route path="/workflows" element={<ProtectedRoute><Workflows /></ProtectedRoute>} />
            <Route path="/workflows/policies" element={<ProtectedRoute><Policies /></ProtectedRoute>} />
            <Route path="/policies" element={<ProtectedRoute><Policies /></ProtectedRoute>} />

            {/* Insights & Support */}
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/incidents" element={<ProtectedRoute><CustomerIncidents /></ProtectedRoute>} />

            {/* Administration & Operations */}
            <Route path="/organization" element={<ProtectedRoute><Organization /></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/operations" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
