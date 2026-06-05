'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
  theme_settings: {
    primaryColor?: string;
  };
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType>({ tenant: null, loading: true });

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        // In local development, you might want to test this by manually setting a subdomain header
        // For production, the API will read the hostname.
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        // We can optionally determine subdomain from window.location.hostname in frontend
        // and pass it as a header if needed, but the backend handles it by default.
        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0]; // simple extraction for frontend fallback

        const res = await fetch(`${apiUrl}/tenant/config`, {
          headers: {
            'x-tenant-subdomain': subdomain // Send explicitly for local dev ease
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setTenant(data.tenant);
          
          // Apply dynamic theming
          if (data.tenant.theme_settings?.primaryColor) {
            document.documentElement.style.setProperty('--primary', data.tenant.theme_settings.primaryColor);
            // Derive a darker shade for hover states or use color-mix if modern CSS
          }
        } else {
          console.warn('Could not fetch tenant config');
        }
      } catch (err) {
        console.error('Error fetching tenant:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
};
