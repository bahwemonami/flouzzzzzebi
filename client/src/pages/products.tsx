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
import { Plus, Package, Edit } from "lucide-react";
import { insertProductSchema } from "@shared/schema";
import type { Product, Category, InsertProduct } from "@shared/schema";
import { z } from "zod";

const productFormSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  price: z.string().min(1, "Prix requis"),
  categoryId: z.string().optional(),
  barcode: z.string().optional(),
  stock: z.string().optional(),
  isActive: z.boolean().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function Products() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      price: "",
      categoryId: "",
      barcode: "",
      stock: "",
      isActive: true,
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const productData: InsertProduct = {
        ...data,
        price: data.price,
        categoryId: data.categoryId ? Number(data.categoryId) : null,
        stock: data.stock ? Number(data.stock) : null,
      };
      const res = await apiRequest("POST", "/api/products", productData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Produit créé",
        description: "Le produit a été ajouté avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le produit",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter(product => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "no-category") return product.categoryId === null;
    return product.categoryId === Number(selectedCategory);
  });

  const onSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "Sans catégorie";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Catégorie inconnue";
  };

  const getCategoryColor = (categoryId: number | null) => {
    if (!categoryId) return "#666666";
    const category = categories.find(c => c.id === categoryId);
    return category?.color || "#666666";
  };

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8" style={{ color: '#27AE60' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#333333' }}>
                  Gestion des Produits
                </h1>
                <p className="text-sm" style={{ color: '#666666' }}>
                  {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-touch" style={{ backgroundColor: '#27AE60' }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un produit</DialogTitle>
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
                          <Input placeholder="Ex: Coca-Cola" {...field} />
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
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Sans catégorie</SelectItem>
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
                          <Input type="number" placeholder="0" {...field} />
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
                          <Input placeholder="Ex: 1234567890123" {...field} />
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
            <div className="flex flex-wrap gap-2">
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
                  backgroundColor: selectedCategory === "no-category" ? '#666666' : 'transparent'
                }}
              >
                Sans catégorie ({products.filter(p => !p.categoryId).length})
              </Button>
              {categories.map((category) => {
                const count = products.filter(p => p.categoryId === category.id).length;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id.toString())}
                    size="sm"
                    style={{ 
                      backgroundColor: selectedCategory === category.id.toString() ? category.color : 'transparent'
                    }}
                  >
                    {category.name} ({count})
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="transition-transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <Badge 
                    variant="secondary"
                    style={{ 
                      backgroundColor: getCategoryColor(product.categoryId) + '20',
                      color: getCategoryColor(product.categoryId)
                    }}
                  >
                    {getCategoryName(product.categoryId)}
                  </Badge>
                  {!product.isActive && (
                    <Badge variant="destructive">Inactif</Badge>
                  )}
                </div>

                <h3 className="font-semibold mb-2" style={{ color: '#333333' }}>
                  {product.name}
                </h3>

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
                    <div className="text-xs" style={{ color: '#666666' }}>
                      Code: {product.barcode}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t" style={{ borderColor: '#E0E0E0' }}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="w-3 h-3 mr-2" />
                    Modifier
                  </Button>
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
    </div>
  );
}