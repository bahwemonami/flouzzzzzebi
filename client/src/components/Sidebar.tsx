import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Home, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Receipt, 
  Settings, 
  LogOut, 
  ScanBarcode,
  Menu,
  X,
  Users,
  Tags,
  TrendingUp,
  Shield
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const navigation = [
  { name: "Tableau de bord", href: "/", icon: Home },
  { name: "Point de Vente", href: "/pos", icon: ShoppingCart },
  { name: "Produits", href: "/products", icon: Package },
  { name: "Catégories", href: "/categories", icon: Tags },
  { name: "Transactions", href: "/transactions", icon: Receipt },
];

const masterNavigation = [
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Gestion Utilisateurs", href: "/user-management", icon: Users },
];

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt sur FLOUZ !",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-72 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ backgroundColor: '#F9FAFB' }}>
        <Card className="h-full rounded-none border-r" style={{ borderColor: '#E0E0E0' }}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: '#E0E0E0' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2F80ED] to-[#56CCF2] rounded-lg flex items-center justify-center">
                    <ScanBarcode className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold" style={{ color: '#2F80ED' }}>
                      FLOUZ
                    </h1>
                    <p className="text-xs" style={{ color: '#666666' }}>
                      Version 1.0.0
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="lg:hidden"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* User Info */}
            <div className="p-4 border-b" style={{ borderColor: '#E0E0E0' }}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2F80ED] to-[#56CCF2] flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {(user as any)?.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#333333' }}>
                    {(user as any)?.firstName || 'Utilisateur'} {(user as any)?.lastName || ''}
                  </p>
                  <p className="text-xs truncate" style={{ color: '#666666' }}>
                    {(user as any)?.email}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {(user as any)?.isDemo && (
                    <span className="px-2 py-1 text-xs rounded-full bg-[#56CCF2] text-white">
                      DEMO
                    </span>
                  )}
                  {(user as any)?.isMaster && (
                    <span className="px-2 py-1 text-xs rounded-full bg-[#E74C3C] text-white flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      MASTER
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {/* Navigation principale */}
              {navigation.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start btn-touch ${isActive ? 'shadow-sm' : ''}`}
                    style={{ 
                      backgroundColor: isActive ? '#2F80ED' : 'transparent',
                      color: isActive ? 'white' : '#333333'
                    }}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </Button>
                );
              })}

              {/* Navigation master - uniquement pour les comptes master */}
              {(user as any)?.isMaster && (
                <>
                  <div className="pt-4 pb-2">
                    <div className="flex items-center gap-2 px-2">
                      <Shield className="w-4 h-4" style={{ color: '#E74C3C' }} />
                      <span className="text-xs font-semibold" style={{ color: '#E74C3C' }}>
                        ADMINISTRATION
                      </span>
                    </div>
                  </div>
                  {masterNavigation.map((item) => {
                    const isActive = location === item.href;
                    const Icon = item.icon;
                    
                    return (
                      <Button
                        key={item.name}
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start btn-touch ${isActive ? 'shadow-sm' : ''}`}
                        style={{ 
                          backgroundColor: isActive ? '#E74C3C' : 'transparent',
                          color: isActive ? 'white' : '#333333'
                        }}
                        onClick={() => handleNavigation(item.href)}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </Button>
                    );
                  })}
                </>
              )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t" style={{ borderColor: '#E0E0E0' }}>
              <Button
                variant="outline"
                className="w-full btn-touch"
                onClick={handleLogout}
                disabled={logout.isPending}
              >
                <LogOut className="w-4 h-4 mr-3" />
                {logout.isPending ? "Déconnexion..." : "Déconnexion"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}