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
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-smooth min-w-0 flex-1",
                isActive
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs font-medium truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}