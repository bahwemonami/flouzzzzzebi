import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Plus, Tag, Palette, Package, Edit, Search, Trash2 } from "lucide-react";
import type { Category, InsertCategory, Product } from "@shared/schema";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(50, "Le nom ne peut pas dépasser 50 caractères"),
  color: z.string().min(1, "La couleur est requise"),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

export default function Categories() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const categoryData: InsertCategory = {
        name: data.name,
        color: data.color,
      };
      
      if (editingCategory) {
        return await apiRequest(`/api/categories/${editingCategory.id}`, "PUT", categoryData);
      } else {
        return await apiRequest("/api/categories", "POST", categoryData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDialogOpen(false);
      setEditingCategory(null);
      form.reset();
      toast({
        title: editingCategory ? "Catégorie modifiée" : "Catégorie créée",
        description: editingCategory ? "La catégorie a été modifiée avec succès" : "La catégorie a été créée avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/categories/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Catégorie supprimée",
        description: "La catégorie a été supprimée avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      color: "#2F80ED",
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    createCategoryMutation.mutate(data);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    form.setValue("name", category.name);
    form.setValue("color", category.color);
    setDialogOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    const productCount = getProductCountByCategory(category.id);
    if (productCount > 0) {
      toast({
        title: "Impossible de supprimer",
        description: `Cette catégorie contient ${productCount} produit${productCount > 1 ? 's' : ''}. Supprimez d'abord les produits associés.`,
        variant: "destructive",
      });
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  const getProductCountByCategory = (categoryId: number) => {
    return products.filter(p => p.categoryId === categoryId && p.isActive).length;
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const predefinedColors = [
    { name: "Bleu FLOUZ", value: "#2F80ED" },
    { name: "Vert", value: "#27AE60" },
    { name: "Bleu clair", value: "#56CCF2" },
    { name: "Orange", value: "#F2994A" },
    { name: "Rouge", value: "#EB5757" },
    { name: "Violet", value: "#9B59B6" },
    { name: "Jaune", value: "#F2C94C" },
    { name: "Rose", value: "#E91E63" },
    { name: "Indigo", value: "#3F51B5" },
    { name: "Teal", value: "#009688" },
    { name: "Gris", value: "#828282" },
    { name: "Marron", value: "#8D6E63" },
  ];

  if (isLoading) {
    return (
      <Layout title="Catégories">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Catégories">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Tag className="w-8 h-8" style={{ color: '#2F80ED' }} />
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#333333' }}>
                Catégories de Produits
              </h2>
              <p className="text-sm" style={{ color: '#666666' }}>
                {categories.length} catégorie{categories.length !== 1 ? 's' : ''} créée{categories.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher une catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingCategory(null);
                form.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="btn-touch whitespace-nowrap" style={{ backgroundColor: '#2F80ED' }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Catégorie
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Modifier la catégorie" : "Créer une nouvelle catégorie"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de la catégorie</FormLabel>
                          <FormControl>
                            <Input placeholder="ex: Boissons, Snacks, Plats..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Couleur d'identification</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir une couleur">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full border" 
                                      style={{ backgroundColor: field.value }}
                                    />
                                    {predefinedColors.find(c => c.value === field.value)?.name || "Couleur personnalisée"}
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {predefinedColors.map((color) => (
                                  <SelectItem key={color.value} value={color.value}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-4 h-4 rounded-full border" 
                                        style={{ backgroundColor: color.value }}
                                      />
                                      {color.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setDialogOpen(false);
                          setEditingCategory(null);
                        }}
                      >
                        Annuler
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createCategoryMutation.isPending}
                        style={{ backgroundColor: '#2F80ED' }}
                      >
                        {createCategoryMutation.isPending ? "En cours..." : editingCategory ? "Modifier" : "Créer"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#666666' }}>
                    Total catégories
                  </p>
                  <p className="text-3xl font-bold" style={{ color: '#333333' }}>
                    {categories.length}
                  </p>
                </div>
                <Tag className="w-8 h-8" style={{ color: '#2F80ED' }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#666666' }}>
                    Produits associés
                  </p>
                  <p className="text-3xl font-bold" style={{ color: '#333333' }}>
                    {products.filter(p => p.isActive).length}
                  </p>
                </div>
                <Package className="w-8 h-8" style={{ color: '#27AE60' }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#666666' }}>
                    Catégorie la plus utilisée
                  </p>
                  <p className="text-lg font-bold" style={{ color: '#333333' }}>
                    {categories.length > 0 ? 
                      categories.reduce((prev, current) => 
                        getProductCountByCategory(current.id) > getProductCountByCategory(prev.id) ? current : prev
                      ).name || "Aucune"
                      : "Aucune"
                    }
                  </p>
                </div>
                <Palette className="w-8 h-8" style={{ color: '#56CCF2' }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Tag className="w-16 h-16 mx-auto mb-4" style={{ color: '#666666' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#333333' }}>
                {searchTerm ? "Aucune catégorie trouvée" : "Aucune catégorie créée"}
              </h3>
              <p className="text-sm mb-4" style={{ color: '#666666' }}>
                {searchTerm 
                  ? "Essayez avec un autre terme de recherche"
                  : "Créez votre première catégorie pour organiser vos produits"
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setDialogOpen(true)}
                  style={{ backgroundColor: '#2F80ED' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une catégorie
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category) => {
              const productCount = getProductCountByCategory(category.id);
              
              return (
                <Card key={category.id} className="relative overflow-hidden hover:shadow-lg transition-shadow group">
                  <div 
                    className="absolute top-0 left-0 right-0 h-3"
                    style={{ backgroundColor: category.color }}
                  />
                  <CardHeader className="pt-6 pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div 
                          className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </CardTitle>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: '#666666' }}>
                          Produits associés
                        </span>
                        <Badge 
                          variant="secondary"
                          style={{ 
                            backgroundColor: category.color + '20',
                            color: category.color,
                            border: `1px solid ${category.color}40`
                          }}
                        >
                          {productCount}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: '#666666' }}>
                          Couleur
                        </span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-xs font-mono" style={{ color: '#666666' }}>
                            {category.color}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t" style={{ borderColor: '#E0E0E0' }}>
                        <p className="text-xs" style={{ color: '#666666' }}>
                          Créée le {new Date(category.createdAt || '').toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}