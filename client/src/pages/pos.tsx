import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Plus, Minus, ShoppingCart, CreditCard, Banknote, Receipt, Search, ScanBarcode, Calculator, Trash2, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Product, Category, CartItem, CheckoutData } from "@shared/schema";

interface CartItemWithProduct extends CartItem {
  product: Product;
  totalPrice: number;
}

export default function POS() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItemWithProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "check">("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [discount, setDiscount] = useState(0);
  const [closeRegisterDialogOpen, setCloseRegisterDialogOpen] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: selectedCategory ? ["/api/products", selectedCategory] : ["/api/products"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: CheckoutData) => {
      const res = await apiRequest("POST", "/api/checkout", data);
      return res.json();
    },
    onSuccess: () => {
      setCart([]);
      toast({
        title: "Transaction réussie",
        description: "La vente a été enregistrée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur de transaction",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const closeRegisterMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/close-register");
      return res.json();
    },
    onSuccess: () => {
      setCloseRegisterDialogOpen(false);
      
      toast({
        title: "Caisse clôturée",
        description: "Un rapport a été envoyé via Telegram. Vous allez être déconnecté.",
      });

      // Déconnexion après 2 secondes
      setTimeout(() => {
        window.location.href = "/api/auth/logout";
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter(product =>
    product.isActive &&
    (selectedCategory === null || product.categoryId === selectedCategory) &&
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (product.barcode && product.barcode.includes(barcodeSearch)))
  );

  // Fonction de recherche par code-barres
  const handleBarcodeSearch = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
      setBarcodeSearch("");
      toast({
        title: "Produit scanné",
        description: `${product.name} ajouté au panier`,
      });
    } else {
      toast({
        title: "Produit non trouvé",
        description: "Code-barres non reconnu",
        variant: "destructive",
      });
    }
  };

  const addToCart = (product: Product) => {
    // Vérifier le stock disponible
    if (product.stock !== null && product.stock <= 0) {
      toast({
        title: "Stock insuffisant",
        description: `${product.name} n'est plus en stock`,
        variant: "destructive",
      });
      return;
    }

    const currentQuantityInCart = cart.find(item => item.productId === product.id)?.quantity || 0;
    
    if (product.stock !== null && currentQuantityInCart >= product.stock) {
      toast({
        title: "Stock insuffisant", 
        description: `Stock disponible: ${product.stock}`,
        variant: "destructive",
      });
      return;
    }

    setCart(current => {
      const existingItem = current.find(item => item.productId === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        return current.map(item =>
          item.productId === product.id
            ? { 
                ...item, 
                quantity: newQuantity,
                totalPrice: Number(product.price) * newQuantity
              }
            : item
        );
      } else {
        return [...current, {
          productId: product.id,
          quantity: 1,
          product,
          totalPrice: Number(product.price),
        }];
      }
    });

    toast({
      title: "Produit ajouté",
      description: `${product.name} ajouté au panier`,
    });
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Vérifier le stock disponible
    const product = products.find(p => p.id === productId);
    if (product && product.stock !== null && newQuantity > product.stock) {
      toast({
        title: "Stock insuffisant",
        description: `Stock disponible: ${product.stock}`,
        variant: "destructive",
      });
      return;
    }
    
    setCart(current =>
      current.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQuantity,
              totalPrice: Number(item.product.price) * newQuantity
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(current => current.filter(item => item.productId !== productId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = (cartSubtotal * discount) / 100;
  const cartTotal = cartSubtotal - discountAmount;
  const taxAmount = cartTotal * 0.20; // TVA 20%
  const finalTotal = cartTotal + taxAmount;

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setAmountReceived("");
  };

  const calculateChange = () => {
    const received = parseFloat(amountReceived) || 0;
    return received - finalTotal;
  };

  const handleCheckout = (paymentMethod: "cash" | "card" | "check") => {
    if (cart.length === 0) {
      toast({
        title: "Panier vide",
        description: "Ajoutez des produits avant de finaliser la vente",
        variant: "destructive",
      });
      return;
    }

    const checkoutData: CheckoutData = {
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      paymentMethod,
    };

    checkoutMutation.mutate(checkoutData);
  };

  return (
    <Layout title="Point de Vente">
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle style={{ color: '#333333' }}>Point de Vente</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search and Barcode */}
                <div className="mb-6 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher un produit..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        style={{ borderColor: '#E0E0E0' }}
                      />
                    </div>
                    <div className="relative">
                      <ScanBarcode className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Scanner code-barres..."
                        value={barcodeSearch}
                        onChange={(e) => setBarcodeSearch(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && barcodeSearch) {
                            handleBarcodeSearch(barcodeSearch);
                          }
                        }}
                        className="pl-10"
                        style={{ borderColor: '#E0E0E0' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedCategory === null ? "default" : "outline"}
                      onClick={() => setSelectedCategory(null)}
                      className="btn-touch"
                      style={{ 
                        backgroundColor: selectedCategory === null ? '#2F80ED' : 'transparent',
                        borderColor: '#E0E0E0'
                      }}
                    >
                      Tous
                    </Button>
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category.id)}
                        className="btn-touch"
                        style={{ 
                          backgroundColor: selectedCategory === category.id ? category.color : 'transparent',
                          borderColor: '#E0E0E0'
                        }}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer transition-transform hover:scale-105 btn-touch"
                      onClick={() => addToCart(product)}
                      style={{ borderColor: '#E0E0E0' }}
                    >
                      <CardContent className="p-4 text-center">
                        <h3 className="font-semibold mb-2 text-sm" style={{ color: '#333333' }}>
                          {product.name}
                        </h3>
                        <p className="text-xl font-bold mb-2" style={{ color: '#2F80ED' }}>
                          {Number(product.price).toFixed(2)} €
                        </p>
                        {product.stock !== null && (
                          <Badge variant="secondary" className="text-xs">
                            Stock: {product.stock}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: '#333333' }}>
                  <ShoppingCart className="w-5 h-5" />
                  Panier ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-center py-8" style={{ color: '#666666' }}>
                    Votre panier est vide
                  </p>
                ) : (
                  <>
                    <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', borderColor: '#E0E0E0', borderWidth: '1px' }}>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm" style={{ color: '#333333' }}>
                              {item.product.name}
                            </h4>
                            <p className="text-sm" style={{ color: '#666666' }}>
                              {Number(item.product.price).toFixed(2)} € × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-8 h-8 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium" style={{ color: '#333333' }}>
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-8 h-8 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="font-semibold text-sm ml-2" style={{ color: '#2F80ED' }}>
                            {item.totalPrice.toFixed(2)} €
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Discount */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium" style={{ color: '#333333' }}>
                          Remise (%)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          className="w-20 text-center"
                          style={{ borderColor: '#E0E0E0' }}
                        />
                      </div>
                    </div>

                    {/* Totals Breakdown */}
                    <div className="border-t pt-4 mb-6 space-y-2" style={{ borderColor: '#E0E0E0' }}>
                      <div className="flex justify-between">
                        <span style={{ color: '#666666' }}>Sous-total:</span>
                        <span style={{ color: '#333333' }}>{cartSubtotal.toFixed(2)} €</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between">
                          <span style={{ color: '#666666' }}>Remise ({discount}%):</span>
                          <span style={{ color: '#27AE60' }}>-{discountAmount.toFixed(2)} €</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span style={{ color: '#666666' }}>Après remise:</span>
                        <span style={{ color: '#333333' }}>{cartTotal.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#666666' }}>TVA (20%):</span>
                        <span style={{ color: '#333333' }}>{taxAmount.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: '#E0E0E0' }}>
                        <span className="text-lg font-semibold" style={{ color: '#333333' }}>
                          Total TTC:
                        </span>
                        <span className="text-2xl font-bold" style={{ color: '#2F80ED' }}>
                          {finalTotal.toFixed(2)} €
                        </span>
                      </div>
                    </div>

                    {/* Cash Payment */}
                    {paymentMethod === "cash" && (
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium" style={{ color: '#333333' }}>
                            Montant reçu (€)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={amountReceived}
                            onChange={(e) => setAmountReceived(e.target.value)}
                            className="w-24 text-center"
                            style={{ borderColor: '#E0E0E0' }}
                          />
                        </div>
                        {amountReceived && (
                          <div className="flex justify-between">
                            <span style={{ color: '#666666' }}>Monnaie à rendre:</span>
                            <span className={`font-semibold ${calculateChange() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {calculateChange().toFixed(2)} €
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment Method Selection */}
                    <div className="mb-4">
                      <label className="text-sm font-medium mb-2 block" style={{ color: '#333333' }}>
                        Mode de paiement
                      </label>
                      <Select value={paymentMethod} onValueChange={(value: "cash" | "card" | "check") => setPaymentMethod(value)}>
                        <SelectTrigger style={{ borderColor: '#E0E0E0' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">
                            <div className="flex items-center gap-2">
                              <Banknote className="w-4 h-4" />
                              Espèces
                            </div>
                          </SelectItem>
                          <SelectItem value="card">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Carte bancaire
                            </div>
                          </SelectItem>
                          <SelectItem value="check">
                            <div className="flex items-center gap-2">
                              <Receipt className="w-4 h-4" />
                              Chèque
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        onClick={() => handleCheckout(paymentMethod)}
                        disabled={cart.length === 0 || (paymentMethod === "cash" && calculateChange() < 0) || checkoutMutation.isPending}
                        className="w-full btn-touch"
                        style={{ backgroundColor: '#27AE60' }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Calculator className="w-5 h-5" />
                          <span>Finaliser la vente - {finalTotal.toFixed(2)} €</span>
                        </div>
                      </Button>

                      <Button
                        onClick={clearCart}
                        disabled={cart.length === 0}
                        variant="outline"
                        className="w-full btn-touch"
                        style={{ borderColor: '#E0E0E0' }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          <span>Vider le panier</span>
                        </div>
                      </Button>

                      <Button
                        onClick={() => setCloseRegisterDialogOpen(true)}
                        variant="destructive"
                        className="w-full btn-touch"
                        style={{ backgroundColor: '#E74C3C' }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <LogOut className="w-5 h-5" />
                          <span>Clôturer la caisse</span>
                        </div>
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}