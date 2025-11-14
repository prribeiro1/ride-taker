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
    <div className="min-h-screen bg-gradient-soft pb-20">
      <ForceUpdateChecker />
      <PWAStatus />
      <PWAUpdatePrompt />
      
      <main className="min-h-screen container mx-auto px-4 py-6 max-w-screen-xl">
        {renderActiveTab()}
      </main>
      
      <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
