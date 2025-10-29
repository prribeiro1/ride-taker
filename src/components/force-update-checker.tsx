import React, { useEffect } from "react";

export function ForceUpdateChecker() {
  useEffect(() => {
    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'RELOAD') {
          console.log('Service Worker requested reload');
          window.location.reload();
        }
      });

      // Force check for updates on mount
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          console.log('Checking for service worker updates...');
          registration.update();
        }
      });
    }
  }, []);

  return null;
}
