import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { 
  Users, 
  UserCheck, 
  CreditCard, 
  Euro, 
  Package, 
  Tag,
  TrendingUp,
  Calendar 
} from "lucide-react";

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

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/master/analytics"],
  });

  if (isLoading) {
    return (
      <Layout title="Analytics">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
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

  const statsCards = [
    {
      title: "Utilisateurs Total",
      value: analytics.summary.totalUsers,
      icon: Users,
      color: "#2F80ED"
    },
    {
      title: "Utilisateurs Actifs",
      value: analytics.summary.activeUsers,
      icon: UserCheck,
      color: "#27AE60"
    },
    {
      title: "Transactions",
      value: analytics.summary.totalTransactions,
      icon: CreditCard,
      color: "#56CCF2"
    },
    {
      title: "Chiffre d'Affaires",
      value: `${analytics.summary.totalRevenue.toFixed(2)} €`,
      icon: Euro,
      color: "#F2994A"
    },
    {
      title: "Produits",
      value: analytics.summary.totalProducts,
      icon: Package,
      color: "#9B59B6"
    },
    {
      title: "Catégories",
      value: analytics.summary.totalCategories,
      icon: Tag,
      color: "#E74C3C"
    }
  ];

  return (
    <Layout title="Analytics Master">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-lg"
            style={{ backgroundColor: "#2F80ED", color: "white" }}
          >
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#2F80ED" }}>
              Analytics Master
            </h1>
            <p style={{ color: "#666666" }}>
              Vue d'ensemble de votre plateforme FLOUZ
            </p>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statsCards.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: stat.color }}
              />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium" style={{ color: "#666666" }}>
                    {stat.title}
                  </CardTitle>
                  <stat.icon 
                    className="w-5 h-5" 
                    style={{ color: stat.color }}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" style={{ color: "#333333" }}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Graphique des transactions par jour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" style={{ color: "#2F80ED" }} />
              Transactions des 7 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-center">
              {analytics.transactionsByDay.map((day, index) => (
                <div key={index} className="space-y-2">
                  <div className="text-xs font-medium" style={{ color: "#666666" }}>
                    {new Date(day.date).toLocaleDateString('fr-FR', { 
                      weekday: 'short' 
                    })}
                  </div>
                  <div 
                    className="h-20 rounded flex items-end justify-center p-2"
                    style={{ 
                      backgroundColor: "#F8F9FA",
                      border: "1px solid #E0E0E0"
                    }}
                  >
                    <div 
                      className="w-8 rounded-t transition-all duration-300"
                      style={{ 
                        height: `${Math.max(10, (day.count / Math.max(...analytics.transactionsByDay.map(d => d.count))) * 60)}px`,
                        backgroundColor: "#2F80ED"
                      }}
                    />
                  </div>
                  <div className="text-sm font-bold" style={{ color: "#333333" }}>
                    {day.count}
                  </div>
                  <div className="text-xs" style={{ color: "#666666" }}>
                    {day.revenue.toFixed(2)}€
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Utilisateurs récents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: "#2F80ED" }} />
              Derniers utilisateurs inscrits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: "#F8F9FA", border: "1px solid #E0E0E0" }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: "#2F80ED" }}
                    >
                      {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: "#333333" }}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.email
                        }
                      </div>
                      <div className="text-sm" style={{ color: "#666666" }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.isDemo && (
                      <Badge variant="secondary" className="text-xs">
                        Démo
                      </Badge>
                    )}
                    <Badge 
                      variant={user.isActive ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {user.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}