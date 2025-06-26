import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { LogOut, ScanBarcode, ShoppingCart, Package, BarChart3, Plus } from "lucide-react";
import { Link } from "wouter";
import type { Transaction, Product } from "@shared/schema";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Calculate stats
  const today = new Date().toDateString();
  const todayTransactions = transactions.filter(t => 
    new Date(t.createdAt || '').toDateString() === today
  );
  const todayTotal = todayTransactions.reduce((sum, t) => sum + Number(t.total), 0);
  const todayCount = todayTransactions.length;
  const totalProducts = products.filter(p => p.isActive).length;

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt sur FLOUZ !",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2F80ED] to-[#56CCF2] rounded-lg flex items-center justify-center">
              <ScanBarcode className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#2F80ED' }}>
                FLOUZ
              </h1>
              <p className="text-sm" style={{ color: '#666666' }}>
                Tableau de bord
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium" style={{ color: '#333333' }}>
                {user?.firstName || 'Utilisateur'} {user?.lastName || ''}
              </p>
              <p className="text-sm" style={{ color: '#666666' }}>
                {user?.email}
                {user?.isDemo && (
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-[#56CCF2] text-white">
                    DEMO
                  </span>
                )}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="btn-touch"
              disabled={logout.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logout.isPending ? "Déconnexion..." : "Déconnexion"}
            </Button>
          </div>
        </header>

        {/* Welcome Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle style={{ color: '#333333' }}>
              Bienvenue dans FLOUZ !
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base mb-4" style={{ color: '#666666' }}>
              Votre application de caisse est prête à l'emploi. Cette interface sera enrichie avec les fonctionnalités de point de vente.
            </p>
            {user?.isDemo && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#E3F2FD', borderColor: '#56CCF2', borderWidth: '1px' }}>
                <p className="text-sm font-medium" style={{ color: '#2F80ED' }}>
                  Mode démonstration activé
                </p>
                <p className="text-sm" style={{ color: '#666666' }}>
                  Vous utilisez actuellement la version de démonstration de FLOUZ.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Link href="/pos">
            <Card className="cursor-pointer transition-transform hover:scale-105 btn-touch">
              <CardContent className="p-6 text-center">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4" style={{ color: '#2F80ED' }} />
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#333333' }}>
                  Point de Vente
                </h3>
                <p className="text-sm" style={{ color: '#666666' }}>
                  Commencer une nouvelle vente
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/products">
            <Card className="cursor-pointer transition-transform hover:scale-105 btn-touch">
              <CardContent className="p-6 text-center">
                <Package className="w-12 h-12 mx-auto mb-4" style={{ color: '#27AE60' }} />
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#333333' }}>
                  Produits
                </h3>
                <p className="text-sm" style={{ color: '#666666' }}>
                  Gérer le catalogue
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#666666' }}>
                Ventes du jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#333333' }}>
                {todayTotal.toFixed(2)} €
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#666666' }}>
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#333333' }}>
                {todayCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium" style={{ color: '#666666' }}>
                Produits actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#333333' }}>
                {totalProducts}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
