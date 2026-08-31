import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kilopart.app',
  appName: 'KiloPart',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
