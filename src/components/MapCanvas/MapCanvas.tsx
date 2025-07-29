import React, { useRef, useEffect } from 'react';
import { Map, config, MapStyle } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';

// Configure MapTiler API key from environment variable
const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
if (!apiKey) {
  console.error('VITE_MAPTILER_API_KEY environment variable is not set. Please add it to your .env file.');
}
config.apiKey = apiKey;

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

interface MapCanvasProps {
  viewState: ViewState;
  onMove: (evt: { viewState: ViewState }) => void;
  children?: React.ReactNode;
  onMapLoad?: (map: Map) => void;
}

export default function MapCanvas({ viewState, onMove, children, onMapLoad }: MapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize MapTiler SDK map
    const map = new Map({
      container: mapContainerRef.current,
      style: MapStyle.STREETS,
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      bearing: viewState.bearing || 0,
      pitch: viewState.pitch || 0,
    });

    mapInstanceRef.current = map;

    // Handle map move events
    const handleMove = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const bearing = map.getBearing();
      const pitch = map.getPitch();

      onMove({
        viewState: {
          longitude: center.lng,
          latitude: center.lat,
          zoom,
          bearing,
          pitch,
        },
      });
    };

    // Handle map load event
    const handleLoad = () => {
      if (onMapLoad) {
        onMapLoad(map);
      }
    };

    // Register event listeners
    map.on('move', handleMove);
    map.on('load', handleLoad);

    // Cleanup function
    return () => {
      map.off('move', handleMove);
      map.off('load', handleLoad);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Empty dependency array for initial setup only

  // Update map view when viewState prop changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      
      // Only update if values have changed to avoid infinite loops
      if (
        Math.abs(currentCenter.lng - viewState.longitude) > 0.0001 ||
        Math.abs(currentCenter.lat - viewState.latitude) > 0.0001 ||
        Math.abs(currentZoom - viewState.zoom) > 0.01
      ) {
        map.easeTo({
          center: [viewState.longitude, viewState.latitude],
          zoom: viewState.zoom,
          bearing: viewState.bearing || 0,
          pitch: viewState.pitch || 0,
          duration: 300,
        });
      }
    }
  }, [viewState]);

  return (
    <div className="map-container" style={{ width: '100%', height: '100vh' }}>
      <div
        ref={mapContainerRef}
        id="main-map"
        style={{ width: '100%', height: '100%' }}
      />
      {/* Note: Children handling would need to be reimplemented based on use case */}
      {children && (
        <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
          {children}
        </div>
      )}
    </div>
  );
}