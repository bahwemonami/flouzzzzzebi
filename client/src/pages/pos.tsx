import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Minus, ShoppingCart, CreditCard, Banknote, Receipt } from "lucide-react";
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

  const filteredProducts = products.filter(product =>
    product.isActive &&
    (selectedCategory === null || product.categoryId === selectedCategory) &&
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
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
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
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

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

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
    <div className="min-h-screen p-4" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle style={{ color: '#333333' }}>Point de Vente</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="mb-6">
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                    style={{ borderColor: '#E0E0E0' }}
                  />
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

                    {/* Total */}
                    <div className="border-t pt-4 mb-6" style={{ borderColor: '#E0E0E0' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold" style={{ color: '#333333' }}>
                          Total:
                        </span>
                        <span className="text-2xl font-bold" style={{ color: '#2F80ED' }}>
                          {cartTotal.toFixed(2)} €
                        </span>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3">
                      <Button
                        className="w-full btn-touch"
                        style={{ backgroundColor: '#27AE60' }}
                        onClick={() => handleCheckout("cash")}
                        disabled={checkoutMutation.isPending}
                      >
                        <Banknote className="w-4 h-4 mr-2" />
                        Espèces
                      </Button>
                      <Button
                        className="w-full btn-touch"
                        style={{ backgroundColor: '#2F80ED' }}
                        onClick={() => handleCheckout("card")}
                        disabled={checkoutMutation.isPending}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Carte
                      </Button>
                      <Button
                        className="w-full btn-touch"
                        style={{ backgroundColor: '#56CCF2' }}
                        onClick={() => handleCheckout("check")}
                        disabled={checkoutMutation.isPending}
                      >
                        <Receipt className="w-4 h-4 mr-2" />
                        Chèque
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}