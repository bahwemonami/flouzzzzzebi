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
  Building2, 
  UserPlus, 
  Edit, 
  UserCheck, 
  UserX, 
  Search,
  Mail,
  Calendar,
  Shield,
  Trash2,
  MessageCircle,
  Users
} from "lucide-react";

interface Account {
  id: number;
  email: string;
  isDemo: boolean;
  isMaster: boolean;
  isActive: boolean;
  telegramChatId: string | null;
  telegramBotToken: string | null;
  createdAt: Date;
}

interface User {
  id: number;
  accountId: number;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
}

const employeeSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  isActive: z.boolean().default(true),
});

const accountFormSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  isDemo: z.boolean().default(false),
  isMaster: z.boolean().default(false),
  isActive: z.boolean().default(true),
  telegramChatId: z.string().optional(),
  telegramBotToken: z.string().optional(),
  employees: z.array(employeeSchema).optional().default([]),
});

type AccountFormData = z.infer<typeof accountFormSchema>;

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function UserManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState<EmployeeFormData[]>([]);
  const [editingEmployeeIndex, setEditingEmployeeIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ["/api/master/accounts"],
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/master/users"],
  });

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      email: "",
      password: "",
      isDemo: false,
      isMaster: false,
      isActive: true,
      telegramChatId: "",
      telegramBotToken: "",
      employees: [],
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: AccountFormData) => {
      const payload = {
        ...data,
        employees: employees
      };
      const res = await apiRequest("POST", "/api/master/accounts", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/master/users"] });
      setDialogOpen(false);
      form.reset();
      setEmployees([]);
      toast({
        title: "Entreprise créée",
        description: `L'entreprise a été créée avec ${employees.length} employé(s)`,
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

  const updateAccountMutation = useMutation({
    mutationFn: async (data: { id: number; accountData: Partial<AccountFormData> }) => {
      const res = await apiRequest("PUT", `/api/master/accounts/${data.id}`, data.accountData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master/accounts"] });
      setDialogOpen(false);
      setEditingAccount(null);
      form.reset();
      toast({
        title: "Entreprise modifiée",
        description: "L'entreprise a été modifiée avec succès",
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

  const toggleAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/master/accounts/${id}/toggle`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master/accounts"] });
      toast({
        title: "Statut modifié",
        description: "Le statut de l'entreprise a été modifié",
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

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/master/accounts/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master/accounts"] });
      toast({
        title: "Entreprise supprimée",
        description: "L'entreprise a été supprimée avec succès",
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

  const onSubmit = (data: AccountFormData) => {
    if (editingAccount) {
      updateAccountMutation.mutate({ id: editingAccount.id, accountData: data });
    } else {
      createAccountMutation.mutate(data);
    }
  };

  const openEditDialog = (account: Account) => {
    setEditingAccount(account);
    form.reset({
      email: account.email,
      password: "", // Ne pas pré-remplir le mot de passe
      isDemo: account.isDemo,
      isMaster: account.isMaster,
      isActive: account.isActive,
      telegramChatId: account.telegramChatId || "",
      telegramBotToken: account.telegramBotToken || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    setEmployees([]);
    setEditingEmployeeIndex(null);
    form.reset();
  };

  const addEmployee = () => {
    setEmployees([...employees, { firstName: "", lastName: "", isActive: true }]);
  };

  const updateEmployee = (index: number, employee: EmployeeFormData) => {
    const newEmployees = [...employees];
    newEmployees[index] = employee;
    setEmployees(newEmployees);
  };

  const removeEmployee = (index: number) => {
    setEmployees(employees.filter((_, i) => i !== index));
  };

  const getEmployeeCount = (accountId: number) => {
    return allUsers.filter(user => user.accountId === accountId).length;
  };

  const filteredAccounts = accounts.filter(account =>
    account.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Layout title="Gestion des Entreprises">
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

  const activeAccounts = accounts.filter(a => a.isActive).length;
  const inactiveAccounts = accounts.length - activeAccounts;
  const demoAccounts = accounts.filter(a => a.isDemo).length;
  const masterAccounts = accounts.filter(a => a.isMaster).length;

  return (
    <Layout title="Gestion des Entreprises">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold" style={{ color: '#2F80ED' }}>
              Gestion des Entreprises
            </h2>
            <p className="text-sm mt-1" style={{ color: '#666666' }}>
              Créer, modifier et gérer les comptes entreprises de la plateforme
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="btn-touch font-semibold"
                style={{ backgroundColor: '#27AE60', borderColor: '#27AE60' }}
                onClick={() => {
                  setEditingAccount(null);
                  setEmployees([]);
                  form.reset();
                }}
              >
                <UserPlus className="mr-2 w-4 h-4" />
                Nouvelle Entreprise
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAccount ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
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
                          <Input type="email" placeholder="email@entreprise.com" {...field} />
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
                          {editingAccount ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder={editingAccount ? 'Laisser vide pour conserver' : 'Mot de passe'} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telegramChatId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telegram Chat ID (optionnel)</FormLabel>
                        <FormControl>
                          <Input placeholder="ID du chat Telegram" {...field} />
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
                        <FormLabel>Telegram Bot Token (optionnel)</FormLabel>
                        <FormControl>
                          <Input placeholder="Token du bot Telegram" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isDemo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Mode Démo</FormLabel>
                          <div className="text-sm text-gray-600">
                            Compte de démonstration avec données pré-remplies
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

                  <FormField
                    control={form.control}
                    name="isMaster"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Compte Master</FormLabel>
                          <div className="text-sm text-gray-600">
                            Accès aux fonctions d'administration de la plateforme
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

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Compte actif</FormLabel>
                          <div className="text-sm text-gray-600">
                            L'entreprise peut se connecter et utiliser l'application
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

                  {/* Section de gestion des employés - seulement pour les nouveaux comptes */}
                  {!editingAccount && (
                    <div className="space-y-4 border-t pt-4" style={{ borderColor: '#E0E0E0' }}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold" style={{ color: '#333333' }}>
                          Employés de l'entreprise
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addEmployee}
                          className="btn-touch"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Ajouter
                        </Button>
                      </div>
                      
                      {employees.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed rounded-lg" style={{ borderColor: '#E0E0E0' }}>
                          <Users className="w-8 h-8 mx-auto mb-2" style={{ color: '#999999' }} />
                          <p className="text-sm" style={{ color: '#666666' }}>
                            Aucun employé ajouté. Cliquez sur "Ajouter" pour commencer.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {employees.map((employee, index) => (
                            <div 
                              key={index} 
                              className="p-3 border rounded-lg"
                              style={{ borderColor: '#E0E0E0' }}
                            >
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-medium" style={{ color: '#666666' }}>
                                    Prénom
                                  </label>
                                  <Input
                                    placeholder="Prénom"
                                    value={employee.firstName}
                                    onChange={(e) => updateEmployee(index, { ...employee, firstName: e.target.value })}
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium" style={{ color: '#666666' }}>
                                    Nom
                                  </label>
                                  <Input
                                    placeholder="Nom"
                                    value={employee.lastName}
                                    onChange={(e) => updateEmployee(index, { ...employee, lastName: e.target.value })}
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={employee.isActive}
                                    onCheckedChange={(checked) => updateEmployee(index, { ...employee, isActive: checked })}
                                  />
                                  <span className="text-xs" style={{ color: '#666666' }}>
                                    Actif
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeEmployee(index)}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs" style={{ color: '#999999' }}>
                        💡 Les employés pourront être sélectionnés lors de la connexion au compte
                      </p>
                    </div>
                  )}

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
                      disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
                    >
                      {editingAccount ? 'Modifier' : 'Créer'}
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
                  Total Entreprises
                </CardTitle>
                <Building2 className="w-4 h-4" style={{ color: '#2F80ED' }} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: '#333333' }}>
                {accounts.length}
              </div>
              <p className="text-xs mt-1" style={{ color: '#666666' }}>
                Entreprises enregistrées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium" style={{ color: '#666666' }}>
                  Entreprises Actives
                </CardTitle>
                <UserCheck className="w-4 h-4" style={{ color: '#27AE60' }} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: '#27AE60' }}>
                {activeAccounts}
              </div>
              <p className="text-xs mt-1" style={{ color: '#666666' }}>
                Entreprises actives
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium" style={{ color: '#666666' }}>
                  Comptes Démo
                </CardTitle>
                <UserX className="w-4 h-4" style={{ color: '#56CCF2' }} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: '#56CCF2' }}>
                {demoAccounts}
              </div>
              <p className="text-xs mt-1" style={{ color: '#666666' }}>
                Comptes de démonstration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium" style={{ color: '#666666' }}>
                  Comptes Master
                </CardTitle>
                <Shield className="w-4 h-4" style={{ color: '#E74C3C' }} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold" style={{ color: '#E74C3C' }}>
                {masterAccounts}
              </div>
              <p className="text-xs mt-1" style={{ color: '#666666' }}>
                Comptes administrateurs
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
                placeholder="Rechercher une entreprise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Accounts List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" style={{ color: '#2F80ED' }} />
              Liste des Entreprises ({filteredAccounts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAccounts.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#E0E0E0' }} />
                <p className="text-lg font-medium" style={{ color: '#666666' }}>
                  Aucune entreprise trouvée
                </p>
                <p className="text-sm mt-1" style={{ color: '#999999' }}>
                  {searchTerm ? 'Essayez une autre recherche' : 'Commencez par créer une entreprise'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAccounts.map((account) => (
                  <div 
                    key={account.id} 
                    className="flex items-center justify-between p-4 rounded-lg border" 
                    style={{ borderColor: '#E0E0E0' }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2F80ED] to-[#56CCF2] flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium" style={{ color: '#333333' }}>
                            {account.email}
                          </p>
                          <div className="flex gap-1">
                            {account.isMaster && (
                              <Badge variant="destructive" className="text-xs">
                                Master
                              </Badge>
                            )}
                            {account.isDemo && (
                              <Badge variant="secondary" className="text-xs">
                                Démo
                              </Badge>
                            )}
                            <Badge 
                              variant={account.isActive ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {account.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm" style={{ color: '#666666' }}>
                            <Users className="w-3 h-3 inline mr-1" />
                            {getEmployeeCount(account.id)} employé(s)
                          </p>
                          {account.telegramChatId && (
                            <p className="text-sm" style={{ color: '#666666' }}>
                              <MessageCircle className="w-3 h-3 inline mr-1" />
                              Telegram configuré
                            </p>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: '#999999' }}>
                          Créé le {new Date(account.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(account)}
                        className="btn-touch"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAccountMutation.mutate(account.id)}
                        className="btn-touch"
                        style={{ 
                          borderColor: account.isActive ? '#E74C3C' : '#27AE60',
                          color: account.isActive ? '#E74C3C' : '#27AE60'
                        }}
                      >
                        {account.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAccountMutation.mutate(account.id)}
                        className="btn-touch"
                        style={{ borderColor: '#E74C3C', color: '#E74C3C' }}
                        disabled={account.isMaster}
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