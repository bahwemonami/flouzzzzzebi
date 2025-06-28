import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield,
  TrendingUp,
  Activity,
  Clock,
  Settings
} from "lucide-react";
import { useLocation } from "wouter";

interface AnalyticsData {
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalTransactions: number;
    totalRevenue: number;
    totalProducts: number;
    totalCategories: number;
  };
  transactionsByDay: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
  recentUsers: Array<{
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    isDemo: boolean;
    isActive: boolean;
    createdAt: Date;
  }>;
}

export default function MasterDashboard() {
  const [, navigate] = useLocation();
  
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/master/analytics"],
  });

  if (isLoading) {
    return (
      <Layout title="Dashboard Master">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!analytics) return null;

  const inactiveUsers = analytics.summary.totalUsers - analytics.summary.activeUsers;
  const activationRate = analytics.summary.totalUsers > 0 
    ? Math.round((analytics.summary.activeUsers / analytics.summary.totalUsers) * 100) 
    : 0;

  return (
    <Layout title="Dashboard Master">
      <div className="space-y-6">
        {/* En-tête avec bienvenue */}
        <div className="bg-gradient-to-r from-[#E74C3C] to-[#C0392B] rounded-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Dashboard Master</h1>
              <p className="text-red-100">
                Interface d'administration FLOUZ - Gestion complète des utilisateurs
              </p>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/user-management")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#E74C3C]">
                <Users className="w-5 h-5" />
                Gestion des Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ color: "#666666" }}>
                Créer, modifier et gérer les comptes utilisateurs de la plateforme
              </p>
              <Button 
                className="mt-4 w-full"
                style={{ backgroundColor: "#E74C3C", color: "white" }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/user-management");
                }}
              >
                Accéder à la gestion
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/analytics")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#E74C3C]">
                <TrendingUp className="w-5 h-5" />
                Analytics Détaillées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ color: "#666666" }}>
                Statistiques avancées et analyses des performances de la plateforme
              </p>
              <Button 
                className="mt-4 w-full"
                style={{ backgroundColor: "#E74C3C", color: "white" }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/analytics");
                }}
              >
                Voir les analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium" style={{ color: "#666666" }}>
                  Total Utilisateurs
                </CardTitle>
                <Users className="w-4 h-4" style={{ color: "#E74C3C" }} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: "#333333" }}>
                {analytics.summary.totalUsers}
              </div>
              <p className="text-xs mt-1" style={{ color: "#666666" }}>
                Comptes enregistrés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium" style={{ color: "#666666" }}>
                  Utilisateurs Actifs
                </CardTitle>
                <UserCheck className="w-4 h-4" style={{ color: "#27AE60" }} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: "#27AE60" }}>
                {analytics.summary.activeUsers}
              </div>
              <p className="text-xs mt-1" style={{ color: "#666666" }}>
                Comptes actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium" style={{ color: "#666666" }}>
                  Comptes Gelés
                </CardTitle>
                <UserX className="w-4 h-4" style={{ color: "#E74C3C" }} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: "#E74C3C" }}>
                {inactiveUsers}
              </div>
              <p className="text-xs mt-1" style={{ color: "#666666" }}>
                Comptes suspendus
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium" style={{ color: "#666666" }}>
                  Taux d'Activation
                </CardTitle>
                <Activity className="w-4 h-4" style={{ color: "#2F80ED" }} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: "#2F80ED" }}>
                {activationRate}%
              </div>
              <p className="text-xs mt-1" style={{ color: "#666666" }}>
                Comptes actifs/total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Activité récente et utilisateurs récents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activité des transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" style={{ color: "#2F80ED" }} />
                Activité Plateforme (7 derniers jours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold" style={{ color: "#2F80ED" }}>
                      {analytics.summary.totalTransactions}
                    </div>
                    <div className="text-xs" style={{ color: "#666666" }}>
                      Transactions totales
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold" style={{ color: "#27AE60" }}>
                      {analytics.summary.totalRevenue.toFixed(2)}€
                    </div>
                    <div className="text-xs" style={{ color: "#666666" }}>
                      Chiffre d'affaires
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center">
                  {analytics.transactionsByDay.map((day, index) => (
                    <div key={index} className="space-y-1">
                      <div className="text-xs" style={{ color: "#666666" }}>
                        {new Date(day.date).toLocaleDateString('fr-FR', { 
                          weekday: 'short' 
                        })}
                      </div>
                      <div 
                        className="h-12 rounded flex items-end justify-center"
                        style={{ backgroundColor: "#F8F9FA" }}
                      >
                        <div 
                          className="w-4 rounded-t"
                          style={{ 
                            height: `${Math.max(4, (day.count / Math.max(...analytics.transactionsByDay.map(d => d.count))) * 40)}px`,
                            backgroundColor: "#2F80ED"
                          }}
                        />
                      </div>
                      <div className="text-xs font-bold" style={{ color: "#333333" }}>
                        {day.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Derniers utilisateurs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: "#E74C3C" }} />
                Derniers Utilisateurs Inscrits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: "#F8F9FA" }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: "#E74C3C" }}
                      >
                        {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm" style={{ color: "#333333" }}>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.email
                          }
                        </div>
                        <div className="text-xs" style={{ color: "#666666" }}>
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {user.isDemo && (
                        <Badge variant="secondary" className="text-xs">
                          Démo
                        </Badge>
                      )}
                      <Badge 
                        variant={user.isActive ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {user.isActive ? "Actif" : "Gelé"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>


      </div>
    </Layout>
  );
}