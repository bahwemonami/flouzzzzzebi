import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Calendar,
  Trash2
} from "lucide-react";

interface User {
  id: number;
  accountId: number;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
}

interface Account {
  id: number;
  email: string;
  isDemo: boolean;
  isMaster: boolean;
  isActive: boolean;
  createdAt: Date;
}

const userFormSchema = z.object({
  accountId: z.number().min(1, "Veuillez sélectionner un compte"),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  isActive: z.boolean().default(true),
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

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/master/accounts"],
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      accountId: 0,
      firstName: "",
      lastName: "",
      isActive: true,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const res = await apiRequest("POST", "/api/master/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master/users"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Employé créé",
        description: "L'employé a été créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: Partial<UserFormData> }) => {
      const res = await apiRequest("PUT", `/api/master/users/${data.id}`, data.userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master/users"] });
      setDialogOpen(false);
      setEditingUser(null);
      form.reset();
      toast({
        title: "Employé modifié",
        description: "L'employé a été modifié avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const toggleUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/master/users/${id}/toggle`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master/users"] });
      toast({
        title: "Statut modifié",
        description: "Le statut de l'employé a été modifié",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/master/users/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master/users"] });
      toast({
        title: "Employé supprimé",
        description: "L'employé a été supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, userData: data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    form.reset({
      accountId: user.accountId,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    form.reset();
  };

  const getAccountEmail = (accountId: number) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.email || 'Compte introuvable';
  };

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getAccountEmail(user.accountId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Layout title="Gestion des Employés">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
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

  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.length - activeUsers;

  return (
    <Layout title="Gestion des Employés">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold" style={{ color: '#2F80ED' }}>
              Gestion des Employés
            </h2>
            <p className="text-sm mt-1" style={{ color: '#666666' }}>
              Créer, modifier et gérer les employés des comptes de la plateforme
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="btn-touch font-semibold"
                style={{ backgroundColor: '#27AE60', borderColor: '#27AE60' }}
                onClick={() => {
                  setEditingUser(null);
                  form.reset();
                }}
              >
                <UserPlus className="mr-2 w-4 h-4" />
                Nouvel Employé
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Modifier l\'employé' : 'Nouvel employé'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compte</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un compte" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id.toString()}>
                                {account.email} {account.isDemo && '(DEMO)'} {account.isMaster && '(MASTER)'}
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
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input placeholder="Prénom de l'employé" {...field} />
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
                          <Input placeholder="Nom de l'employé" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Statut actif</FormLabel>
                          <div className="text-sm text-gray-600">
                            L'employé peut se connecter et utiliser l'application
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={closeDialog}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      style={{ backgroundColor: '#27AE60', borderColor: '#27AE60' }}
                      disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    >
                      {editingUser ? 'Modifier' : 'Créer'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium" style={{ color: '#666666' }}>
                  Total Employés
                </CardTitle>
                <Users className="w-4 h-4" style={{ color: '#2F80ED' }} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: '#333333' }}>
                {users.length}
              </div>
              <p className="text-xs mt-1" style={{ color: '#666666' }}>
                Employés enregistrés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium" style={{ color: '#666666' }}>
                  Employés Actifs
                </CardTitle>
                <UserCheck className="w-4 h-4" style={{ color: '#27AE60' }} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: '#27AE60' }}>
                {activeUsers}
              </div>
              <p className="text-xs mt-1" style={{ color: '#666666' }}>
                Employés actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium" style={{ color: '#666666' }}>
                  Employés Inactifs
                </CardTitle>
                <UserX className="w-4 h-4" style={{ color: '#E74C3C' }} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: '#E74C3C' }}>
                {inactiveUsers}
              </div>
              <p className="text-xs mt-1" style={{ color: '#666666' }}>
                Employés inactifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium" style={{ color: '#666666' }}>
                  Comptes Liés
                </CardTitle>
                <Calendar className="w-4 h-4" style={{ color: '#56CCF2' }} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: '#56CCF2' }}>
                {accounts.length}
              </div>
              <p className="text-xs mt-1" style={{ color: '#666666' }}>
                Comptes disponibles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#666666' }} />
              <Input
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: '#2F80ED' }} />
              Liste des Employés ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#E0E0E0' }} />
                <p className="text-lg font-medium" style={{ color: '#666666' }}>
                  Aucun employé trouvé
                </p>
                <p className="text-sm mt-1" style={{ color: '#999999' }}>
                  {searchTerm ? 'Essayez une autre recherche' : 'Commencez par créer un employé'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-4 rounded-lg border" 
                    style={{ borderColor: '#E0E0E0' }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2F80ED] to-[#56CCF2] flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium" style={{ color: '#333333' }}>
                            {user.firstName} {user.lastName}
                          </p>
                          <Badge 
                            variant={user.isActive ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-sm" style={{ color: '#666666' }}>
                          Compte: {getAccountEmail(user.accountId)}
                        </p>
                        <p className="text-xs" style={{ color: '#999999' }}>
                          Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        className="btn-touch"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleUserMutation.mutate(user.id)}
                        className="btn-touch"
                        style={{ 
                          borderColor: user.isActive ? '#E74C3C' : '#27AE60',
                          color: user.isActive ? '#E74C3C' : '#27AE60'
                        }}
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUserMutation.mutate(user.id)}
                        className="btn-touch"
                        style={{ borderColor: '#E74C3C', color: '#E74C3C' }}
                      >
                        <Trash2 className="w-4 h-4" />
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