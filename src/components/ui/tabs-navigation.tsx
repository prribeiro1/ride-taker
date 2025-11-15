import { cn } from "@/lib/utils";
import { MapPin, Users, Calendar, Settings, Route, AlertCircle } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: "routes", label: "Rotas", icon: Route },
  { id: "points", label: "Pontos", icon: MapPin },
  { id: "attendance", label: "Chamada", icon: Calendar },
  { id: "occurrences", label: "Ocorrências", icon: Users },
  { id: "reports", label: "Relatórios", icon: Users },
  { id: "settings", label: "Alunos", icon: Settings },
];

interface TabsNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/20 z-50 shadow-large">
      <div className="flex justify-around items-center px-2 py-3 max-w-screen-xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all min-w-0 flex-1 relative",
                isActive
                  ? "text-primary scale-110"
                  : "text-muted-foreground hover:text-accent hover:scale-105"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-2xl" />
              )}
              <div className={cn(
                "p-2 rounded-xl transition-all",
                isActive && "bg-gradient-primary shadow-medium"
              )}>
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform",
                  isActive && "text-primary-foreground scale-110"
                )} />
              </div>
              <span className={cn(
                "text-xs truncate transition-all relative z-10",
                isActive ? "font-bold" : "font-medium"
              )}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}