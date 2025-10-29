import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check for updates every 60 seconds
      const checkForUpdates = () => {
        navigator.serviceWorker.getRegistration().then((registration) => {
          registration?.update();
        });
      };

      // Check immediately and then every minute
      checkForUpdates();
      const interval = setInterval(checkForUpdates, 60000);

      // Listen for new service worker waiting
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      navigator.serviceWorker.ready.then((registration) => {
        // Check if there's a waiting service worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowPrompt(true);
        }

        // Listen for new service worker installing
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowPrompt(true);
              }
            });
          }
        });
      });

      return () => clearInterval(interval);
    }
  }, []);

  const updateServiceWorker = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Card className="p-4 bg-primary text-primary-foreground shadow-lg">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Nova versão disponível!</p>
            <p className="text-sm opacity-90">Clique para atualizar o app</p>
          </div>
          <Button
            onClick={updateServiceWorker}
            variant="secondary"
            size="sm"
          >
            Atualizar
          </Button>
        </div>
      </Card>
    </div>
  );
}
