import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import ProspectFinder from "@/pages/ProspectFinder";
import Pipeline from "@/pages/Pipeline";
import TerritoryMap from "@/pages/TerritoryMap";
import RetailerProfile from "@/pages/RetailerProfile";
import AccountPlanner from "@/pages/AccountPlanner";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import IntelligenceDashboard from "@/pages/IntelligenceDashboard";
import ProspectDiscovery from "@/pages/ProspectDiscovery";
import TerritorySimulator from "@/pages/TerritorySimulator";
import SalesCalendar from "@/pages/SalesCalendar";
import SalesForecast from "@/pages/SalesForecast";
import DataHub from "@/pages/DataHub";
import CurrentAccounts from "@/pages/CurrentAccounts";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/prospects" element={<ProspectFinder />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/map" element={<TerritoryMap />} />
        <Route path="/retailer/:id" element={<RetailerProfile />} />
        <Route path="/planner" element={<AccountPlanner />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/intelligence" element={<IntelligenceDashboard />} />
        <Route path="/discovery" element={<ProspectDiscovery />} />
        <Route path="/simulator" element={<TerritorySimulator />} />
        <Route path="/calendar" element={<SalesCalendar />} />
        <Route path="/forecast" element={<SalesForecast />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/data-hub" element={<DataHub />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
