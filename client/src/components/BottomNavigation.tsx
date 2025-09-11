import { Button } from "@/components/ui/button";
import { Home, Map, Bell, User } from "lucide-react";

interface BottomNavigationProps {
  currentPath: string;
}

export default function BottomNavigation({ currentPath }: BottomNavigationProps) {
  const isActive = (path: string) => currentPath === path;

  return (
    <div className="bg-card border-t border-border px-4 py-2 sticky bottom-0">
      <div className="flex justify-around">
        <Button 
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center py-2 px-3 ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => window.location.href = '/'}
          data-testid="nav-home"
        >
          <Home className="h-5 w-5 mb-1" />
          <span className="text-xs">Home</span>
        </Button>
        
        <Button 
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center py-2 px-3 ${isActive('/map') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => window.location.href = '/map'}
          data-testid="nav-map"
        >
          <Map className="h-5 w-5 mb-1" />
          <span className="text-xs">Map</span>
        </Button>
        
        <Button 
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center py-2 px-3 ${isActive('/alerts') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          data-testid="nav-alerts"
        >
          <Bell className="h-5 w-5 mb-1" />
          <span className="text-xs">Alerts</span>
        </Button>
        
        <Button 
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center py-2 px-3 ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          data-testid="nav-profile"
        >
          <User className="h-5 w-5 mb-1" />
          <span className="text-xs">Profile</span>
        </Button>
      </div>
    </div>
  );
}
