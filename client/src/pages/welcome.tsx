import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginData } from "@shared/schema";
import { ScanBarcode, Mail, Lock, LogIn, Eye, UserPlus } from "lucide-react";

export default function Welcome() {
  const { toast } = useToast();
  const { login } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
    try {
      await login.mutateAsync(data);
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur FLOUZ !",
      });
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleDemoLogin = async () => {
    try {
      await login.mutateAsync({
        email: "demo@flouz.com",
        password: "demo123"
      });
      toast({
        title: "Mode démonstration",
        description: "Bienvenue dans l'interface de démonstration !",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au mode démonstration",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-8" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Logo Section */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#2F80ED] to-[#56CCF2] rounded-2xl flex items-center justify-center shadow-lg">
            <ScanBarcode className="text-white text-3xl w-8 h-8" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ color: '#2F80ED' }}>
          FLOUZ
        </h1>
        <p className="text-lg md:text-xl animate-fade-in-delay" style={{ color: '#666666' }}>
          Votre caisse, simple et efficace
        </p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md animate-fade-in-delay">
        <Card className="shadow-sm" style={{ borderColor: '#E0E0E0' }}>
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-6 text-center" style={{ color: '#333333' }}>
              Connexion
            </h2>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#333333' }}>
                  Adresse e-mail
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@exemple.com"
                    className="pl-4 pr-10 py-3 transition-colors"
                    style={{ borderColor: '#E0E0E0', color: '#333333' }}
                    {...form.register("email")}
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#666666' }} />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#333333' }}>
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-4 pr-10 py-3 transition-colors"
                    style={{ borderColor: '#E0E0E0', color: '#333333' }}
                    {...form.register("password")}
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#666666' }} />
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm" style={{ color: '#666666' }}>
                    Se souvenir de moi
                  </Label>
                </div>
                <button 
                  type="button"
                  className="text-sm transition-colors"
                  style={{ color: '#2F80ED' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#56CCF2'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#2F80ED'}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full btn-touch font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                style={{ backgroundColor: '#2F80ED' }}
                disabled={login.isPending}
              >
                <LogIn className="mr-2 w-4 h-4" />
                {login.isPending ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t" style={{ borderColor: '#E0E0E0' }}></div>
              <span className="px-4 text-sm" style={{ color: '#666666' }}>ou</span>
              <div className="flex-1 border-t" style={{ borderColor: '#E0E0E0' }}></div>
            </div>

            {/* Quick Access */}
            <div className="space-y-3">
              <Button 
                type="button"
                variant="outline"
                className="w-full btn-touch font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                style={{ borderColor: '#E0E0E0', color: '#333333' }}
                onClick={handleDemoLogin}
                disabled={login.isPending}
              >
                <Eye className="mr-2 w-4 h-4" style={{ color: '#56CCF2' }} />
                {login.isPending ? "Chargement..." : "Mode démonstration"}
              </Button>
              
              <Button 
                type="button"
                className="w-full btn-touch font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                style={{ backgroundColor: '#27AE60' }}
                onClick={() => setShowRegister(true)}
              >
                <UserPlus className="mr-2 w-4 h-4" />
                Créer un compte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center animate-fade-in-delay">
        <p className="text-sm" style={{ color: '#666666' }}>
          Version 1.0.0 • 
          <button className="ml-1 transition-colors" style={{ color: '#2F80ED' }}>Support</button> • 
          <button className="ml-1 transition-colors" style={{ color: '#2F80ED' }}>Confidentialité</button>
        </p>
      </div>
    </div>
  );
}
