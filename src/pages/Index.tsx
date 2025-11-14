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
      <ForceUpdateChecker />
      <PWAStatus />
      <PWAUpdatePrompt />
      
      {/* Hero Header with Gradient */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-border/50">
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 animate-gradient">
          <div className="container mx-auto px-4 py-6 max-w-screen-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-medium">
                <svg className="h-8 w-8 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
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
