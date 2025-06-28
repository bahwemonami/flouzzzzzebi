import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Welcome from "@/pages/welcome";
import Dashboard from "@/pages/dashboard";
import MasterDashboard from "@/pages/master-dashboard";
import POS from "@/pages/pos";
import Products from "@/pages/products";
import Categories from "@/pages/categories";
import Transactions from "@/pages/transactions";
import Analytics from "@/pages/analytics";
import UserManagement from "@/pages/user-management";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#2F80ED] to-[#56CCF2] rounded-2xl flex items-center justify-center shadow-lg mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded opacity-75"></div>
          </div>
          <p className="text-lg" style={{ color: '#666666' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Welcome} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/pos" component={POS} />
          <Route path="/products" component={Products} />
          <Route path="/categories" component={Categories} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/user-management" component={UserManagement} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
