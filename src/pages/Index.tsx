import { useState } from "react";
import { TabsNavigation } from "@/components/ui/tabs-navigation";
import { PointsTab } from "@/components/transport/points-tab";
import { AttendanceTab } from "@/components/transport/attendance-tab";
import { ReportsTab } from "@/components/transport/reports-tab";
import { SettingsTab } from "@/components/transport/settings-tab";
import { PWAStatus } from "@/components/ui/pwa-status";

const Index = () => {
  const [activeTab, setActiveTab] = useState("points");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "points":
        return <PointsTab />;
      case "attendance":
        return <AttendanceTab />;
      case "reports":
        return <ReportsTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <PointsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <PWAStatus />
      
      <main className="min-h-screen">
        {renderActiveTab()}
      </main>
      
      <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
