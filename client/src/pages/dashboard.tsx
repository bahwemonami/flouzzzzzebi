import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Package, BarChart3, TrendingUp, Users, Receipt, Tag } from "lucide-react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import type { Transaction, Product } from "@shared/schema";

export default function Dashboard() {
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
  const lowStockProducts = products.filter(p => p.stock !== null && p.stock < 10).length;

  return (
    <Layout title="Tableau de bord">
      <div className="p-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/pos">
            <Card className="cursor-pointer transition-transform hover:scale-105 btn-touch">
              <CardContent className="p-6 text-center">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4" style={{ color: '#2F80ED' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#333333' }}>
                  Point de Vente
                </h3>
                <p className="text-sm" style={{ color: '#666666' }}>
                  Nouvelle vente
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/products">
            <Card className="cursor-pointer transition-transform hover:scale-105 btn-touch">
              <CardContent className="p-6 text-center">
                <Package className="w-12 h-12 mx-auto mb-4" style={{ color: '#27AE60' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#333333' }}>
                  Produits
                </h3>
                <p className="text-sm" style={{ color: '#666666' }}>
                  Gérer le catalogue
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/categories">
            <Card className="cursor-pointer transition-transform hover:scale-105 btn-touch">
              <CardContent className="p-6 text-center">
                <Tag className="w-12 h-12 mx-auto mb-4" style={{ color: '#56CCF2' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#333333' }}>
                  Catégories
                </h3>
                <p className="text-sm" style={{ color: '#666666' }}>
                  Organiser les produits
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/transactions">
            <Card className="cursor-pointer transition-transform hover:scale-105 btn-touch">
              <CardContent className="p-6 text-center">
                <Receipt className="w-12 h-12 mx-auto mb-4" style={{ color: '#F2994A' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#333333' }}>
                  Transactions
                </h3>
                <p className="text-sm" style={{ color: '#666666' }}>
                  Historique
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Daily Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#666666' }}>
                    Ventes du jour
                  </p>
                  <p className="text-3xl font-bold" style={{ color: '#333333' }}>
                    {todayTotal.toFixed(2)} €
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
                    Transactions
                  </p>
                  <p className="text-3xl font-bold" style={{ color: '#333333' }}>
                    {todayCount}
                  </p>
                </div>
                <Receipt className="w-8 h-8" style={{ color: '#2F80ED' }} />
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
                    {totalProducts}
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
                    Stock faible
                  </p>
                  <p className="text-3xl font-bold" style={{ color: '#333333' }}>
                    {lowStockProducts}
                  </p>
                </div>
                <Users className="w-8 h-8" style={{ color: '#F2994A' }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dernières transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {todayTransactions.length > 0 ? (
                <div className="space-y-3">
                  {todayTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#333333' }}>
                          Transaction #{transaction.id}
                        </p>
                        <p className="text-xs" style={{ color: '#666666' }}>
                          {new Date(transaction.createdAt || '').toLocaleTimeString('fr-FR')} - {
                            transaction.paymentMethod === 'cash' ? 'Espèces' :
                            transaction.paymentMethod === 'card' ? 'Carte' :
                            transaction.paymentMethod === 'check' ? 'Chèque' : transaction.paymentMethod
                          }
                        </p>
                      </div>
                      <p className="font-semibold" style={{ color: '#2F80ED' }}>
                        {Number(transaction.total).toFixed(2)} €
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-sm" style={{ color: '#666666' }}>
                  Aucune transaction aujourd'hui
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertes stock</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts > 0 ? (
                <div className="space-y-3">
                  {products.filter(p => p.stock !== null && p.stock < 10).slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#FFF3CD', borderColor: '#F2994A', borderWidth: '1px' }}>
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#333333' }}>
                          {product.name}
                        </p>
                        <p className="text-xs" style={{ color: '#F2994A' }}>
                          Stock critique: {product.stock} restant
                        </p>
                      </div>
                      <p className="font-semibold" style={{ color: '#F2994A' }}>
                        ⚠️ Stock faible
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-sm" style={{ color: '#27AE60' }}>
                  ✓ Tous les stocks sont corrects
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
