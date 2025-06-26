import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/Layout";
import { Search, Receipt, CreditCard, Banknote, FileCheck, Calendar, Filter } from "lucide-react";
import type { Transaction } from "@shared/schema";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
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
      case "card": return "Carte";
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
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.id.toString().includes(searchTerm) ||
        Number(t.total).toFixed(2).includes(searchTerm)
      );
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  };

  const filteredTransactions = filterTransactions();
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + Number(t.total), 0);

  return (
    <Layout title="Transactions">
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#666666' }}>
                    Total des ventes
                  </p>
                  <p className="text-2xl font-bold" style={{ color: '#333333' }}>
                    {totalAmount.toFixed(2)} €
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
                    Nombre de transactions
                  </p>
                  <p className="text-2xl font-bold" style={{ color: '#333333' }}>
                    {filteredTransactions.length}
                  </p>
                </div>
                <Calendar className="w-8 h-8" style={{ color: '#27AE60' }} />
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
                  <p className="text-2xl font-bold" style={{ color: '#333333' }}>
                    {filteredTransactions.length > 0 ? (totalAmount / filteredTransactions.length).toFixed(2) : '0.00'} €
                  </p>
                </div>
                <CreditCard className="w-8 h-8" style={{ color: '#56CCF2' }} />
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
                  <p className="text-2xl font-bold" style={{ color: '#333333' }}>
                    {filteredTransactions
                      .filter(t => t.paymentMethod === 'cash')
                      .reduce((sum, t) => sum + Number(t.total), 0)
                      .toFixed(2)} €
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
                  placeholder="Rechercher par ID ou montant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Mode de paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modes</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="card">Carte</SelectItem>
                  <SelectItem value="check">Chèque</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="yesterday">Hier</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="all">Toutes</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setPaymentFilter("all");
                  setDateFilter("today");
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Historique des transactions
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
                    ? "Essayez de modifier vos filtres"
                    : "Les transactions apparaîtront ici après vos premières ventes"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: getPaymentMethodColor(transaction.paymentMethod) + '20' }}
                      >
                        <div style={{ color: getPaymentMethodColor(transaction.paymentMethod) }}>
                          {getPaymentMethodIcon(transaction.paymentMethod)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold" style={{ color: '#333333' }}>
                            Transaction #{transaction.id}
                          </h4>
                          <Badge 
                            style={{ 
                              backgroundColor: getPaymentMethodColor(transaction.paymentMethod) + '20',
                              color: getPaymentMethodColor(transaction.paymentMethod)
                            }}
                          >
                            {getPaymentMethodLabel(transaction.paymentMethod)}
                          </Badge>
                        </div>
                        <p className="text-sm" style={{ color: '#666666' }}>
                          {new Date(transaction.createdAt || '').toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold" style={{ color: '#2F80ED' }}>
                        {Number(transaction.total).toFixed(2)} €
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Détails
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}