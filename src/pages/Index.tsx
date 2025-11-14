import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Bus, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState("routes");
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Até logo!",
      description: "Você saiu da sua conta",
    });
    navigate("/auth");
  };

  if (loading) {
    return <SplashScreen />;
  }

  if (!user) {
    return null;
  }

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
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-medium">
                  <Bus className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Monitor Escolar</h1>
                  <p className="text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </Button>
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
