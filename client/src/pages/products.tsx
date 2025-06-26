import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Plus, Package, Edit, Trash2, AlertTriangle } from "lucide-react";
import { insertProductSchema } from "@shared/schema";
import type { Product, Category, InsertProduct } from "@shared/schema";
import { z } from "zod";

const productFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  price: z.string().min(1, "Le prix est requis"),
  categoryId: z.string().optional(),
  stock: z.string().optional(),
  barcode: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function Products() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      price: "",
      categoryId: "",
      stock: "",
      barcode: "",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const productData: InsertProduct = {
        name: data.name,
        price: data.price,
        categoryId: data.categoryId ? Number(data.categoryId) : null,
        stock: data.stock ? Number(data.stock) : null,
        barcode: data.barcode || null,
      };
      if (editingProduct) {
        return await apiRequest(`/api/products/${editingProduct.id}`, "PUT", productData);
      } else {
        return await apiRequest("/api/products", "POST", productData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: editingProduct ? "Produit modifié" : "Produit créé",
        description: editingProduct ? "Le produit a été modifié avec succès" : "Le produit a été ajouté avec succès",
      });
      setIsDialogOpen(false);
      setEditingProduct(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: editingProduct ? "Impossible de modifier le produit" : "Impossible de créer le produit",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/products/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      price: product.price.toString(),
      categoryId: product.categoryId?.toString() || "",
      stock: product.stock?.toString() || "",
      barcode: product.barcode || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode && product.barcode.includes(searchTerm));
    
    if (selectedCategory === "all") return matchesSearch;
    if (selectedCategory === "no-category") return matchesSearch && !product.categoryId;
    return matchesSearch && product.categoryId === parseInt(selectedCategory);
  });

  const isLoading = productsLoading || categoriesLoading;

  if (isLoading) {
    return (
      <Layout title="Gestion des Produits">
        <div className="p-6">
          <div className="text-center">Chargement...</div>
        </div>
      </Layout>
    );
  }

  const getCategoryColor = (categoryId: number | null) => {
    if (!categoryId) return "#666666";
    const category = categories.find(c => c.id === categoryId);
    return category?.color || "#666666";
  };

  return (
    <Layout title="Gestion des Produits">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8" style={{ color: '#27AE60' }} />
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#333333' }}>
                Catalogue de Produits
              </h2>
              <p className="text-sm" style={{ color: '#666666' }}>
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-touch" style={{ backgroundColor: '#27AE60' }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Produit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Modifier le Produit" : "Nouveau Produit"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du produit</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Café Espresso" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix (€)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="Ex: 2.50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock initial (optionnel)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ex: 50" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code-barres (optionnel)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 1234567890123" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={createProductMutation.isPending} className="flex-1">
                      {createProductMutation.isPending ? "Création..." : "Créer"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                size="sm"
                style={{ 
                  backgroundColor: selectedCategory === "all" ? '#2F80ED' : 'transparent'
                }}
              >
                Tous ({products.length})
              </Button>
              <Button
                variant={selectedCategory === "no-category" ? "default" : "outline"}
                onClick={() => setSelectedCategory("no-category")}
                size="sm"
                style={{ 
                  backgroundColor: selectedCategory === "no-category" ? '#2F80ED' : 'transparent'
                }}
              >
                Sans catégorie
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id.toString())}
                  size="sm"
                  style={{ 
                    backgroundColor: selectedCategory === category.id.toString() ? category.color : 'transparent',
                    borderColor: category.color
                  }}
                >
                  {category.name} ({products.filter(p => p.categoryId === category.id).length})
                </Button>
              ))}
            </div>
            
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge 
                    style={{ 
                      backgroundColor: getCategoryColor(product.categoryId),
                      color: 'white'
                    }}
                  >
                    {product.categoryId ? 
                      categories.find(c => c.id === product.categoryId)?.name || 'Sans catégorie' : 
                      'Sans catégorie'
                    }
                  </Badge>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteProduct(product)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <h3 className="font-semibold text-lg leading-tight flex-1" style={{ color: '#333333' }}>
                    {product.name}
                  </h3>
                  {product.stock !== null && product.stock < 10 && (
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" title="Stock faible" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#666666' }}>Prix:</span>
                    <span className="font-bold" style={{ color: '#2F80ED' }}>
                      {Number(product.price).toFixed(2)} €
                    </span>
                  </div>

                  {product.stock !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: '#666666' }}>Stock:</span>
                      <Badge 
                        variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                      >
                        {product.stock}
                      </Badge>
                    </div>
                  )}

                  {product.barcode && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: '#666666' }}>Code-barres:</span>
                      <span className="text-xs font-mono" style={{ color: '#666666' }}>
                        {product.barcode}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 mx-auto mb-4" style={{ color: '#666666' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#333333' }}>
                Aucun produit trouvé
              </h3>
              <p className="text-sm mb-4" style={{ color: '#666666' }}>
                Commencez par ajouter des produits à votre catalogue
              </p>
              <Button onClick={() => setIsDialogOpen(true)} style={{ backgroundColor: '#27AE60' }}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter le premier produit
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}