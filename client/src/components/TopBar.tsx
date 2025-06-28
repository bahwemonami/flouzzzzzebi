import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Bell, Search, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface TopBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  title: string;
}

export default function TopBar({ sidebarOpen, setSidebarOpen, title }: TopBarProps) {
  const [closeRegisterDialogOpen, setCloseRegisterDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isMaster } = useAuth();

  const closeRegisterMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/close-register", {});
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
        window.location.href = "/";
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

  return (
    <>
      <div className="h-16 border-b flex items-center justify-between px-4 lg:px-6" style={{ borderColor: '#E0E0E0', backgroundColor: 'white' }}>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold" style={{ color: '#333333' }}>
            {title}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#666666' }} />
              <Input
                placeholder="Recherche rapide..."
                className="pl-10 w-64"
                style={{ borderColor: '#E0E0E0' }}
              />
            </div>
          </div>
          
          {/* Bouton de clôture de caisse - uniquement pour les comptes non-master */}
          {!isMaster && (
            <Button
              onClick={() => setCloseRegisterDialogOpen(true)}
              variant="destructive"
              size="sm"
              className="btn-touch"
              style={{ backgroundColor: '#E74C3C' }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Clôturer la caisse</span>
            </Button>
          )}
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" style={{ color: '#666666' }} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
          </Button>
        </div>
      </div>

      {/* Modal de clôture de caisse */}
      <Dialog open={closeRegisterDialogOpen} onOpenChange={setCloseRegisterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clôturer la caisse</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de clôturer votre caisse. Un rapport sera envoyé via Telegram et vous serez automatiquement déconnecté.
              Cette action marque la fin de votre journée de travail.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCloseRegisterDialogOpen(false)}
              disabled={closeRegisterMutation.isPending}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={() => closeRegisterMutation.mutate()}
              disabled={closeRegisterMutation.isPending}
              style={{ backgroundColor: '#E74C3C' }}
            >
              {closeRegisterMutation.isPending ? "Clôture en cours..." : "OK, clôturer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}