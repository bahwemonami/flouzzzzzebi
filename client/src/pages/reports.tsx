import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/Layout";
import { BarChart3, TrendingUp, DollarSign, Package, Calendar, Download, Filter } from "lucide-react";
import type { Transaction, Product } from "@shared/schema";

export default function Reports() {
  const [timeRange, setTimeRange] = useState("today");

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filterByTimeRange = (transactions: Transaction[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return transactions.filter(t => {
      const transactionDate = new Date(t.createdAt || '');
      switch (timeRange) {
        case "today": return transactionDate >= today;
        case "yesterday": return transactionDate >= yesterday && transactionDate < today;
        case "week": return transactionDate >= weekAgo;
        case "month": return transactionDate >= monthAgo;
        default: return true;
      }
    });
  };

  const filteredTransactions = filterByTimeRange(transactions);
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + Number(t.total), 0);
  const averageTicket = filteredTransactions.length > 0 ? totalRevenue / filteredTransactions.length : 0;

  // Payment method breakdown
  const paymentMethods = filteredTransactions.reduce((acc, t) => {
    acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + Number(t.total);
    return acc;
  }, {} as Record<string, number>);

  // Hourly sales data (for today only)
  const hourlyData = timeRange === "today" ? (() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, revenue: 0, count: 0 }));
    filteredTransactions.forEach(t => {
      const hour = new Date(t.createdAt || '').getHours();
      hours[hour].revenue += Number(t.total);
      hours[hour].count += 1;
    });
    return hours.filter(h => h.revenue > 0);
  })() : [];

  // Top products (simplified - would need transaction items in real app)
  const activeProducts = products.filter(p => p.isActive);
  const lowStockProducts = activeProducts.filter(p => p.stock !== null && p.stock < 10);

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "today": return "Aujourd'hui";
      case "yesterday": return "Hier";
      case "week": return "Cette semaine";
      case "month": return "Ce mois";
      default: return "Toutes les données";
    }
  };

  return (
    <Layout title="Rapports">
      <div className="p-6">
        {/* Header with filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8" style={{ color: '#2F80ED' }} />
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#333333' }}>
                Rapports de Vente
              </h2>
              <p className="text-sm" style={{ color: '#666666' }}>
                Analyse des performances - {getTimeRangeLabel()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="yesterday">Hier</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="all">Tout</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#666666' }}>
                    Chiffre d'affaires
                  </p>
                  <p className="text-3xl font-bold" style={{ color: '#333333' }}>
                    {totalRevenue.toFixed(2)} €
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#27AE60' }}>
                    {filteredTransactions.length} transactions
                  </p>
                </div>
                <DollarSign className="w-8 h-8" style={{ color: '#2F80ED' }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#666666' }}>
                    Ticket moyen
                  </p>
                  <p className="text-3xl font-bold" style={{ color: '#333333' }}>
                    {averageTicket.toFixed(2)} €
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#56CCF2' }}>
                    Par transaction
                  </p>
                </div>
                <TrendingUp className="w-8 h-8" style={{ color: '#27AE60' }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#666666' }}>
                    Produits actifs
                  </p>
                  <p className="text-3xl font-bold" style={{ color: '#333333' }}>
                    {activeProducts.length}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#F2994A' }}>
                    {lowStockProducts.length} en rupture
                  </p>
                </div>
                <Package className="w-8 h-8" style={{ color: '#56CCF2' }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#666666' }}>
                    Espèces
                  </p>
                  <p className="text-3xl font-bold" style={{ color: '#333333' }}>
                    {(paymentMethods.cash || 0).toFixed(2)} €
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#27AE60' }}>
                    {totalRevenue > 0 ? ((paymentMethods.cash || 0) / totalRevenue * 100).toFixed(1) : '0'}% du total
                  </p>
                </div>
                <Calendar className="w-8 h-8" style={{ color: '#F2994A' }} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition des paiements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(paymentMethods).map(([method, amount]) => {
                  const percentage = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
                  const methodLabel = {
                    cash: "Espèces",
                    card: "Carte",
                    check: "Chèque"
                  }[method] || method;
                  
                  const color = {
                    cash: "#27AE60",
                    card: "#2F80ED", 
                    check: "#56CCF2"
                  }[method] || "#666666";

                  return (
                    <div key={method} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-medium" style={{ color: '#333333' }}>
                          {methodLabel}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: '#333333' }}>
                          {amount.toFixed(2)} €
                        </p>
                        <p className="text-xs" style={{ color: '#666666' }}>
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {Object.keys(paymentMethods).length === 0 && (
                  <p className="text-center py-8 text-sm" style={{ color: '#666666' }}>
                    Aucune transaction pour cette période
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hourly Sales (Today only) */}
          <Card>
            <CardHeader>
              <CardTitle>
                {timeRange === "today" ? "Ventes par heure" : "Alertes stock"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeRange === "today" ? (
                <div className="space-y-3">
                  {hourlyData.length > 0 ? hourlyData.map(({ hour, revenue, count }) => (
                    <div key={hour} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#666666' }}>
                        {hour}h - {hour + 1}h
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: '#333333' }}>
                          {revenue.toFixed(2)} €
                        </p>
                        <p className="text-xs" style={{ color: '#666666' }}>
                          {count} vente{count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-8 text-sm" style={{ color: '#666666' }}>
                      Aucune vente aujourd'hui
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.length > 0 ? lowStockProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#FFF3CD', borderColor: '#F2994A', borderWidth: '1px' }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#333333' }}>
                          {product.name}
                        </p>
                        <p className="text-xs" style={{ color: '#666666' }}>
                          Stock restant: {product.stock}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: '#F2994A' }}>
                          Stock faible
                        </p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-8 text-sm" style={{ color: '#27AE60' }}>
                      Tous les stocks sont corrects
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé de la période</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <p className="text-2xl font-bold mb-2" style={{ color: '#2F80ED' }}>
                  {filteredTransactions.length}
                </p>
                <p className="text-sm" style={{ color: '#666666' }}>
                  Transactions totales
                </p>
              </div>
              
              <div className="text-center p-4">
                <p className="text-2xl font-bold mb-2" style={{ color: '#27AE60' }}>
                  {totalRevenue.toFixed(2)} €
                </p>
                <p className="text-sm" style={{ color: '#666666' }}>
                  Chiffre d'affaires
                </p>
              </div>
              
              <div className="text-center p-4">
                <p className="text-2xl font-bold mb-2" style={{ color: '#56CCF2' }}>
                  {activeProducts.length}
                </p>
                <p className="text-sm" style={{ color: '#666666' }}>
                  Produits en catalogue
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}