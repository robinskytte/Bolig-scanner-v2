'use client';

import { useEffect, useRef, useState } from 'react';
import { AddressData } from '@/lib/types';

interface MapViewProps {
  address?: AddressData;
  height?: string;
  showLayers?: boolean;
  className?: string;
  interactive?: boolean;
  zoom?: number;
  onAddressSelect?: (id: string, tekst: string) => void;
}

// Map is SSR-incompatible (Leaflet uses window) — always rendered client-side
export function MapView({
  address,
  height = '40vh',
  showLayers = false,
  className = '',
  interactive = true,
  zoom = 15,
  onAddressSelect,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    let L: typeof import('leaflet');
    let map: import('leaflet').Map;

    (async () => {
      L = (await import('leaflet')).default;
      // CSS loaded via next.config.js or direct link tag

      // Fix default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const center: [number, number] = address
        ? [address.koordinater[1], address.koordinater[0]]
        : [55.676098, 12.568337]; // Copenhagen default

      map = L.map(containerRef.current!, {
        center,
        zoom,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        attributionControl: true,
      });

      mapRef.current = map;

      // CartoDB Positron — light, minimal, no API key needed
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      // Add marker for selected address
      if (address) {
        const customIcon = L.divIcon({
          className: '',
          html: `<div style="
            width: 32px; height: 32px;
            background: #B45309;
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const marker = L.marker(center, { icon: customIcon })
          .addTo(map)
          .bindPopup(`<strong>${address.tekst}</strong>`)
          .openPopup();

        markerRef.current = marker;
      }

      // Optional: Noise WMS overlay
      if (showLayers) {
        // Noise layer
        L.tileLayer.wms('https://miljoegis.mim.dk/wms', {
          layers: 'theme-noise-vej-lden',
          format: 'image/png',
          transparent: true,
          opacity: 0.5,
          attribution: 'Støjkort © Miljøministeriet',
        }).addTo(map);
      }
    })();

    return () => {
      if (mapRef.current) {
        (mapRef.current as import('leaflet').Map).remove();
        mapRef.current = null;
      }
    };
  }, [isClient]); // Only initialize once

  // Update marker when address changes
  useEffect(() => {
    if (!isClient || !mapRef.current || !address) return;

    (async () => {
      const L = (await import('leaflet')).default;
      const map = mapRef.current as import('leaflet').Map;
      const center: [number, number] = [address.koordinater[1], address.koordinater[0]];

      map.setView(center, zoom);

      if (markerRef.current) {
        (markerRef.current as import('leaflet').Marker).setLatLng(center);
        (markerRef.current as import('leaflet').Marker).setPopupContent(`<strong>${address.tekst}</strong>`);
      } else {
        const customIcon = L.divIcon({
          className: '',
          html: `<div style="
            width: 32px; height: 32px;
            background: #B45309;
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        markerRef.current = L.marker(center, { icon: customIcon })
          .addTo(map)
          .bindPopup(`<strong>${address.tekst}</strong>`)
          .openPopup();
      }
    })();
  }, [address, zoom, isClient]);

  if (!isClient) {
    return (
      <div
        className={`bg-gray-100 rounded-xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <span className="text-gray-400 text-sm">Indlæser kort...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ height }}
    />
  );
}
