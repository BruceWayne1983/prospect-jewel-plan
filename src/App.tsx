import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import ProspectFinder from "@/pages/ProspectFinder";
import Pipeline from "@/pages/Pipeline";
import TerritoryMap from "@/pages/TerritoryMap";
import RetailerProfile from "@/pages/RetailerProfile";
import AccountPlanner from "@/pages/AccountPlanner";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/prospects" element={<ProspectFinder />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/map" element={<TerritoryMap />} />
            <Route path="/retailer/:id" element={<RetailerProfile />} />
            <Route path="/planner" element={<AccountPlanner />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
