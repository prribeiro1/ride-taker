import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PWAStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for install prompt
    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    
    // Service Worker update detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                setWaitingWorker(newWorker);
                toast({
                  title: "Atualização Disponível",
                  description: "Uma nova versão do app está disponível. Clique para atualizar.",
                  duration: 10000
                });
              }
            });
          }
        });
      });

      // Listen for controller change (new SW took control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, [toast]);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    }
  };

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      setWaitingWorker(null);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Online/Offline Status */}
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className="flex items-center gap-1"
      >
        {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {isOnline ? "Online" : "Offline"}
      </Badge>
      
      {/* Update Available */}
      {updateAvailable && (
        <Card className="shadow-medium border-primary">
          <CardContent className="p-3">
            <Button
              onClick={handleUpdate}
              size="sm"
              className="flex items-center gap-2 w-full bg-gradient-primary"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar App
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Install Button */}
      {installPrompt && !updateAvailable && (
        <Card className="shadow-medium">
          <CardContent className="p-3">
            <Button
              onClick={handleInstall}
              size="sm"
              variant="outline"
              className="flex items-center gap-2 w-full"
            >
              <Download className="h-4 w-4" />
              Instalar App
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}