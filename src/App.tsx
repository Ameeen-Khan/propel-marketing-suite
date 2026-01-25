import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { GuestGuard } from "@/components/guards/GuestGuard";

// Layouts
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { OrgLayout } from "@/components/layout/OrgLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { LoginPage } from "./pages/auth/LoginPage";

// Super Admin Pages
import { OrganizationsPage } from "./pages/super-admin/OrganizationsPage";
import { OrganizationDetailPage } from "./pages/super-admin/OrganizationDetailPage";
import { OrganizationAgentsPage } from "./pages/super-admin/OrganizationAgentsPage";

// Org Pages
import { ContactsPage } from "./pages/app/ContactsPage";
import { TemplatesPage } from "./pages/app/TemplatesPage";
import { CampaignsPage } from "./pages/app/CampaignsPage";
import { AudiencesPage } from "./pages/app/AudiencesPage";
import { NotificationsPage } from "./pages/app/NotificationsPage";
import { AgentsPage } from "./pages/app/AgentsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<Index />} />

            {/* Auth routes */}
            <Route
              path="/login"
              element={
                <GuestGuard>
                  <LoginPage />
                </GuestGuard>
              }
            />

            {/* Super Admin routes */}
            <Route
              path="/sa"
              element={
                <AuthGuard allowedRoles={["super_admin"]}>
                  <SuperAdminLayout />
                </AuthGuard>
              }
            >
              <Route index element={<Navigate to="/sa/organizations" replace />} />
              <Route path="organizations" element={<OrganizationsPage />} />
              <Route path="organizations/:id" element={<OrganizationDetailPage />} />
              <Route path="organizations/:id/agents" element={<OrganizationAgentsPage />} />
            </Route>

            {/* Org routes (admin and user) */}
            <Route
              path="/app"
              element={
                <AuthGuard allowedRoles={["org_admin", "org_user"]}>
                  <OrgLayout />
                </AuthGuard>
              }
            >
              <Route index element={<Navigate to="/app/contacts" replace />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="audiences" element={<AudiencesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              {/* Agents page only for org_admin - handled in component/layout */}
              <Route path="agents" element={<AgentsPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
