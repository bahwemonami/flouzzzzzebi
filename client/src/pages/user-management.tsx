import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { 
  Users, 
  UserPlus, 
  Edit, 
  UserCheck, 
  UserX, 
  Search,
  Mail,
  Calendar,
  Shield,
  Trash2
} from "lucide-react";

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isDemo: boolean;
  isMaster: boolean;
  isActive: boolean;
  telegramChatId: string | null;
  telegramBotToken: string | null;
  createdAt: Date;
}

const userFormSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isDemo: z.boolean().default(false),
  isMaster: z.boolean().default(false),
  isActive: z.boolean().default(true),
  telegramChatId: z.string().optional(),
  telegramBotToken: z.string().optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

export default function UserManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/master/users"],
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      isDemo: false,
      isMaster: false,
      isActive: true,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (editingUser) {
        const { password, ...updateData } = data;
        const payload = password ? data : updateData;
        return await apiRequest("PUT", `/api/master/users/${editingUser.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/master/users", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master/users"] });
      setDialogOpen(false);
      setEditingUser(null);
      form.reset();
      toast({
        title: editingUser ? "Utilisateur modifié" : "Utilisateur créé",
        description: editingUser ? "L'utilisateur a été modifié avec succès" : "L'utilisateur a été créé avec succès",
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

  const toggleUserMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PUT", `/api/master/users/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master/users"] });
      toast({
        title: "Statut modifié",
        description: "Le statut de l'utilisateur a été modifié avec succès",
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

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/master/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master/users"] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé définitivement",
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

  const onSubmit = (data: UserFormData) => {
    createUserMutation.mutate(data);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setValue("email", user.email);
    form.setValue("firstName", user.firstName || "");
    form.setValue("lastName", user.lastName || "");
    form.setValue("isDemo", user.isDemo);
    form.setValue("isMaster", user.isMaster);
    form.setValue("isActive", user.isActive);
    form.setValue("password", ""); // Don't prefill password
    setDialogOpen(true);
  };

  const handleToggleUser = (user: User) => {
    if (user.isMaster) {
      toast({
        title: "Impossible de modifier",
        description: "Le statut d'un compte master ne peut pas être modifié",
        variant: "destructive",
      });
      return;
    }
    
    toggleUserMutation.mutate(user.id);
  };

  const handleDeleteUser = (user: User) => {
    if (user.isMaster) {
      toast({
        title: "Suppression interdite",
        description: "Le compte master ne peut pas être supprimé",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur "${user.email}" ?\n\nCette action est irréversible et supprimera toutes ses données.`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeUsers = users.filter(u => u.isActive).length;
  const totalUsers = users.length;

  if (isLoading) {
    return (
      <Layout title="Gestion des Utilisateurs">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestion des Utilisateurs">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: "#2F80ED", color: "white" }}
            >
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#2F80ED" }}>
                Gestion des Utilisateurs
              </h1>
              <p style={{ color: "#666666" }}>
                Gérez les comptes utilisateurs de votre plateforme
              </p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingUser(null);
                  form.reset();
                }}
                style={{ backgroundColor: "#2F80ED", color: "white" }}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Nouvel Utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Modifier l'utilisateur" : "Créer un utilisateur"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="utilisateur@email.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {editingUser ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password" 
                            placeholder={editingUser ? "Laisser vide pour ne pas changer" : "Mot de passe"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Prénom" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nom" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Compte actif</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isDemo"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Compte démo</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isMaster"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Compte master</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Configuration Telegram</h3>
                    <FormField
                      control={form.control}
                      name="telegramChatId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chat ID Telegram</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: -1001234567890" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telegramBotToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Bot Telegram</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ex: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={createUserMutation.isPending}
                      style={{ backgroundColor: "#2F80ED", color: "white" }}
                      className="flex-1"
                    >
                      {createUserMutation.isPending ? "..." : editingUser ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium" style={{ color: "#666666" }}>
                Total Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: "#333333" }}>
                {totalUsers}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium" style={{ color: "#666666" }}>
                Utilisateurs Actifs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: "#27AE60" }}>
                {activeUsers}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium" style={{ color: "#666666" }}>
                Taux d'Activité
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: "#2F80ED" }}>
                {totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "#666666" }} />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: user.isMaster ? "#E74C3C" : "#2F80ED" }}
                    >
                      {user.isMaster ? <Shield className="w-6 h-6" /> : (user.firstName?.[0] || user.email[0]).toUpperCase()}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium" style={{ color: "#333333" }}>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.email
                          }
                        </span>
                        <div className="flex gap-1">
                          {user.isMaster && (
                            <Badge variant="destructive" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Master
                            </Badge>
                          )}
                          {user.isDemo && (
                            <Badge variant="secondary" className="text-xs">
                              Démo
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm" style={{ color: "#666666" }}>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={user.isActive ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {user.isActive ? "Actif" : "Inactif"}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleUser(user)}
                      disabled={user.isMaster}
                      className={`h-8 w-8 p-0 ${user.isActive ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-green-50 hover:text-green-600'}`}
                    >
                      {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      disabled={user.isMaster}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4" style={{ color: "#CCCCCC" }} />
              <p style={{ color: "#666666" }}>
                {searchTerm ? "Aucun utilisateur trouvé" : "Aucun utilisateur"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}