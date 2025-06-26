import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Layout from "@/components/Layout";
import { 
  Search, 
  Receipt, 
  CreditCard, 
  Banknote, 
  FileCheck, 
  Calendar, 
  Filter, 
  Eye,
  TrendingUp,
  BarChart3,
  Download,
  RefreshCw
} from "lucide-react";
import type { Transaction, TransactionItem, Product } from "@shared/schema";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash": return <Banknote className="w-4 h-4" />;
      case "card": return <CreditCard className="w-4 h-4" />;
      case "check": return <FileCheck className="w-4 h-4" />;
      default: return <Receipt className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash": return "Espèces";
      case "card": return "Carte bancaire";
      case "check": return "Chèque";
      default: return method;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "cash": return "#27AE60";
      case "card": return "#2F80ED";
      case "check": return "#56CCF2";
      default: return "#666666";
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by payment method
    if (paymentFilter !== "all") {
      filtered = filtered.filter(t => t.paymentMethod === paymentFilter);
    }

    // Filter by date
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    switch (dateFilter) {
      case "today":
        filtered = filtered.filter(t => new Date(t.createdAt || '').toDateString() === today);
        break;
      case "yesterday":
        filtered = filtered.filter(t => new Date(t.createdAt || '').toDateString() === yesterday);
        break;
      case "week":
        filtered = filtered.filter(t => new Date(t.createdAt || '') >= weekAgo);
        break;
      case "month":
        filtered = filtered.filter(t => new Date(t.createdAt || '') >= monthAgo);
        break;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.id.toString().includes(searchTerm) ||
        Number(t.total).toFixed(2).includes(searchTerm) ||
        getPaymentMethodLabel(t.paymentMethod).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  };

  const filteredTransactions = filterTransactions();
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + Number(t.total), 0);
  const averageTicket = filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0;

  // Payment method breakdown
  const paymentBreakdown = filteredTransactions.reduce((acc, t) => {
    acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + Number(t.total);
    return acc;
  }, {} as Record<string, number>);

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setPaymentFilter("all");
    setDateFilter("today");
  };

  const getDateRangeLabel = () => {
    switch (dateFilter) {
      case "today": return "Aujourd'hui";
      case "yesterday": return "Hier";
      case "week": return "Cette semaine";
      case "month": return "Ce mois";
      default: return "Toutes les données";
    }
  };

  return (
    <Layout title="Transactions">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Receipt className="w-8 h-8" style={{ color: '#2F80ED' }} />
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#333333' }}>
                Historique des Transactions
              </h2>
              <p className="text-sm" style={{ color: '#666666' }}>
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} - {getDateRangeLabel()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#666666' }}>
                    Chiffre d'affaires
                  </p>
                  <p className="text-2xl font-bold" style={{ color: '#333333' }}>
                    {totalAmount.toFixed(2)} €
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#27AE60' }}>
                    {getDateRangeLabel()}
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
                    Nombre de ventes
                  </p>
                  <p className="text-2xl font-bold" style={{ color: '#333333' }}>
                    {filteredTransactions.length}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#2F80ED' }}>
                    Transactions
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
                    Panier moyen
                  </p>
                  <p className="text-2xl font-bold" style={{ color: '#333333' }}>
                    {averageTicket.toFixed(2)} €
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#56CCF2' }}>
                    Par transaction
                  </p>
                </div>
                <BarChart3 className="w-8 h-8" style={{ color: '#56CCF2' }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#666666' }}>
                    Paiements espèces
                  </p>
                  <p className="text-2xl font-bold" style={{ color: '#333333' }}>
                    {(paymentBreakdown.cash || 0).toFixed(2)} €
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#F2994A' }}>
                    {totalAmount > 0 ? ((paymentBreakdown.cash || 0) / totalAmount * 100).toFixed(1) : '0'}% du total
                  </p>
                </div>
                <Banknote className="w-8 h-8" style={{ color: '#F2994A' }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4" style={{ color: '#666666' }} />
                <Input
                  placeholder="Rechercher par ID, montant ou mode de paiement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80"
                />
              </div>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Mode de paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modes</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                  <SelectItem value="check">Chèque</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="yesterday">Hier</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="all">Toutes</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={resetFilters}
                className="whitespace-nowrap"
              >
                <Filter className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {Object.entries(paymentBreakdown).map(([method, amount]) => {
            const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
            const count = filteredTransactions.filter(t => t.paymentMethod === method).length;
            
            return (
              <Card key={method}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: getPaymentMethodColor(method) + '20' }}
                      >
                        <div style={{ color: getPaymentMethodColor(method) }}>
                          {getPaymentMethodIcon(method)}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: '#333333' }}>
                          {getPaymentMethodLabel(method)}
                        </h3>
                        <p className="text-sm" style={{ color: '#666666' }}>
                          {count} transaction{count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#666666' }}>
                        Montant total
                      </span>
                      <span className="font-semibold" style={{ color: '#333333' }}>
                        {amount.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#666666' }}>
                        Part du CA
                      </span>
                      <Badge 
                        style={{ 
                          backgroundColor: getPaymentMethodColor(method) + '20',
                          color: getPaymentMethodColor(method)
                        }}
                      >
                        {percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Liste des transactions
              <Badge variant="secondary" className="ml-auto">
                {filteredTransactions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 mx-auto mb-4" style={{ color: '#666666' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#333333' }}>
                  Aucune transaction trouvée
                </h3>
                <p className="text-sm" style={{ color: '#666666' }}>
                  {searchTerm || paymentFilter !== "all" || dateFilter !== "all" 
                    ? "Essayez de modifier vos filtres de recherche"
                    : "Les transactions apparaîtront ici après vos premières ventes"
                  }
                </p>
                {(searchTerm || paymentFilter !== "all" || dateFilter !== "all") && (
                  <Button 
                    onClick={resetFilters}
                    className="mt-4"
                    variant="outline"
                  >
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow"
                    style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: getPaymentMethodColor(transaction.paymentMethod) + '20' }}
                      >
                        <div style={{ color: getPaymentMethodColor(transaction.paymentMethod) }}>
                          {getPaymentMethodIcon(transaction.paymentMethod)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="font-semibold text-lg" style={{ color: '#333333' }}>
                            Transaction #{transaction.id}
                          </h4>
                          <Badge 
                            style={{ 
                              backgroundColor: getPaymentMethodColor(transaction.paymentMethod) + '20',
                              color: getPaymentMethodColor(transaction.paymentMethod),
                              border: `1px solid ${getPaymentMethodColor(transaction.paymentMethod)}40`
                            }}
                          >
                            {getPaymentMethodLabel(transaction.paymentMethod)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm" style={{ color: '#666666' }}>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(transaction.createdAt || '').toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </div>
                          <span>•</span>
                          <span>
                            {new Date(transaction.createdAt || '').toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: '#2F80ED' }}>
                          {Number(transaction.total).toFixed(2)} €
                        </p>
                        <p className="text-sm" style={{ color: '#666666' }}>
                          Total TTC
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewDetails(transaction)}
                        className="btn-touch"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Détails
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Détails de la transaction #{selectedTransaction?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: '#333333' }}>
                      Informations générales
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: '#666666' }}>ID Transaction:</span>
                        <span style={{ color: '#333333' }}>#{selectedTransaction.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#666666' }}>Date:</span>
                        <span style={{ color: '#333333' }}>
                          {new Date(selectedTransaction.createdAt || '').toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#666666' }}>Heure:</span>
                        <span style={{ color: '#333333' }}>
                          {new Date(selectedTransaction.createdAt || '').toLocaleTimeString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#666666' }}>Mode de paiement:</span>
                        <Badge 
                          style={{ 
                            backgroundColor: getPaymentMethodColor(selectedTransaction.paymentMethod) + '20',
                            color: getPaymentMethodColor(selectedTransaction.paymentMethod)
                          }}
                        >
                          {getPaymentMethodLabel(selectedTransaction.paymentMethod)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: '#333333' }}>
                      Montants
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: '#666666' }}>Sous-total:</span>
                        <span style={{ color: '#333333' }}>
                          {(Number(selectedTransaction.total) / 1.20).toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#666666' }}>TVA (20%):</span>
                        <span style={{ color: '#333333' }}>
                          {(Number(selectedTransaction.total) - Number(selectedTransaction.total) / 1.20).toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2" style={{ borderColor: '#E0E0E0' }}>
                        <span style={{ color: '#333333' }}>Total TTC:</span>
                        <span style={{ color: '#2F80ED' }}>
                          {Number(selectedTransaction.total).toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3" style={{ color: '#333333' }}>
                    Articles vendus
                  </h4>
                  <div className="text-center py-8" style={{ color: '#666666' }}>
                    <Package className="w-12 h-12 mx-auto mb-2" />
                    <p>Détail des articles non disponible</p>
                    <p className="text-sm">Cette fonctionnalité sera ajoutée prochainement</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}