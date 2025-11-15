import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.f42c690ddbcc4ae6804fb01c1b9394b4',
  appName: 'Monitor Transporte Escolar',
  webDir: 'dist',
  server: {
    url: 'https://f42c690d-dbcc-4ae6-804f-b01c1b9394b4.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
