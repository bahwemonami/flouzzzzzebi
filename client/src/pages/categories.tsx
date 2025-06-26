import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Plus, Tags, Edit, Palette } from "lucide-react";
import { insertCategorySchema } from "@shared/schema";
import type { Category, InsertCategory } from "@shared/schema";
import { z } from "zod";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  color: z.string().min(1, "Couleur requise"),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

const predefinedColors = [
  "#2F80ED", "#56CCF2", "#27AE60", "#F2994A",
  "#EB5757", "#BB6BD9", "#219653", "#F2C94C",
  "#6FCF97", "#56CCF2", "#9B51E0", "#FF6B35"
];

export default function Categories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      color: "#2F80ED",
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const categoryData: InsertCategory = {
        name: data.name,
        color: data.color,
      };
      const res = await apiRequest("POST", "/api/categories", categoryData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Catégorie créée",
        description: "La catégorie a été ajoutée avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer la catégorie",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    createCategoryMutation.mutate(data);
  };

  const getCategoryProductCount = (categoryId: number) => {
    return products.filter((p: any) => p.categoryId === categoryId).length;
  };

  return (
    <Layout title="Catégories">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Tags className="w-8 h-8" style={{ color: '#2F80ED' }} />
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#333333' }}>
                Gestion des Catégories
              </h2>
              <p className="text-sm" style={{ color: '#666666' }}>
                {categories.length} catégorie{categories.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-touch" style={{ backgroundColor: '#2F80ED' }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Catégorie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter une catégorie</DialogTitle>
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
                          <Input placeholder="Ex: Boissons" {...field} />
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
                        <FormLabel>Couleur</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <Input type="color" {...field} className="w-full h-12" />
                            <div className="grid grid-cols-6 gap-2">
                              {predefinedColors.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className="w-8 h-8 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform"
                                  style={{ backgroundColor: color }}
                                  onClick={() => field.onChange(color)}
                                />
                              ))}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={createCategoryMutation.isPending} className="flex-1">
                      {createCategoryMutation.isPending ? "Création..." : "Créer"}
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

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Tags className="w-16 h-16 mx-auto mb-4" style={{ color: '#666666' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#333333' }}>
                Aucune catégorie
              </h3>
              <p className="text-sm mb-4" style={{ color: '#666666' }}>
                Organisez vos produits en créant des catégories
              </p>
              <Button onClick={() => setIsDialogOpen(true)} style={{ backgroundColor: '#2F80ED' }}>
                <Plus className="w-4 h-4 mr-2" />
                Créer la première catégorie
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => {
              const productCount = getCategoryProductCount(category.id);
              return (
                <Card key={category.id} className="transition-transform hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: category.color + '20' }}
                      >
                        <Tags className="w-6 h-6" style={{ color: category.color }} />
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>

                    <h3 className="font-semibold text-lg mb-2" style={{ color: '#333333' }}>
                      {category.name}
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: '#666666' }}>Produits:</span>
                        <Badge variant="secondary">
                          {productCount}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: '#666666' }}>Couleur:</span>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-xs font-mono" style={{ color: '#666666' }}>
                            {category.color}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t" style={{ borderColor: '#E0E0E0' }}>
                        <p className="text-xs" style={{ color: '#666666' }}>
                          Créée le {new Date(category.createdAt || '').toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Color Usage Stats */}
        {categories.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Répartition des couleurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="text-center">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <Tags className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#333333' }}>
                      {category.name}
                    </p>
                    <p className="text-xs" style={{ color: '#666666' }}>
                      {getCategoryProductCount(category.id)} produits
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}