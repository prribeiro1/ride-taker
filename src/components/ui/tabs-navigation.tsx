import { cn } from "@/lib/utils";
import { MapPin, Users, Calendar, Settings, Route } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: "routes", label: "Rotas", icon: Route },
  { id: "points", label: "Pontos", icon: MapPin },
  { id: "attendance", label: "Chamada", icon: Calendar },
  { id: "reports", label: "Relatórios", icon: Users },
  { id: "settings", label: "Config", icon: Settings },
];

interface TabsNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 shadow-large">
      <div className="flex justify-around items-center px-3 py-3 max-w-screen-xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all min-w-0 flex-1",
                isActive
                  ? "bg-primary text-primary-foreground shadow-medium scale-105"
                  : "text-muted-foreground hover:bg-accent-light hover:text-accent hover:scale-102"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-xs truncate transition-all",
                isActive ? "font-semibold" : "font-medium"
              )}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}