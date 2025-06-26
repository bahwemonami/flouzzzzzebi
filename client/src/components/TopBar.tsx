import { Button } from "@/components/ui/button";
import { Menu, Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  title: string;
}

export default function TopBar({ sidebarOpen, setSidebarOpen, title }: TopBarProps) {
  return (
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
        
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" style={{ color: '#666666' }} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
        </Button>
      </div>
    </div>
  );
}