import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAMOppTfJ7ko-BlhR83Dwy7fnX5Dw_ZYyo';

export const GoogleMapsWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      language="es"
      libraries={['places', 'marker', 'geometry']}
    >
      {children}
    </APIProvider>
  );
};
