import React, { useState } from "react";
import { TabsNavigation } from "@/components/ui/tabs-navigation";
import { RoutesTab } from "@/components/transport/routes-tab";
import { PointsTab } from "@/components/transport/points-tab";
import { AttendanceTab } from "@/components/transport/attendance-tab";
import { ReportsTab } from "@/components/transport/reports-tab";
import { SettingsTab } from "@/components/transport/settings-tab";
import { PWAStatus } from "@/components/ui/pwa-status";
import { PWAUpdatePrompt } from "@/components/pwa-update-prompt";
import { ForceUpdateChecker } from "@/components/force-update-checker";
import { SplashScreen } from "@/components/splash-screen";
import { Bus } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("routes");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "routes":
        return <RoutesTab />;
      case "points":
        return <PointsTab />;
      case "attendance":
        return <AttendanceTab />;
      case "reports":
        return <ReportsTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <RoutesTab />;
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <SplashScreen />
      <ForceUpdateChecker />
      <PWAStatus />
      <PWAUpdatePrompt />
      
      {/* Hero Header with Gradient */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-border/50">
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 animate-gradient">
          <div className="container mx-auto px-4 py-6 max-w-screen-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-medium">
                <Bus className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Monitor Escolar</h1>
                <p className="text-sm text-muted-foreground">Gestão de Transporte</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 max-w-screen-xl">
        {renderActiveTab()}
      </main>
      
      <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
