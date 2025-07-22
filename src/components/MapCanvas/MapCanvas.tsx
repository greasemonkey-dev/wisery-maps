import React, { useCallback, useRef } from 'react';
import Map, { type MapRef, type ViewState } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapCanvasProps {
  viewState: ViewState;
  onMove: (evt: { viewState: ViewState }) => void;
  children?: React.ReactNode;
  onMapLoad?: (mapRef: MapRef) => void;
}

export default function MapCanvas({ viewState, onMove, children, onMapLoad }: MapCanvasProps) {
  const mapRef = useRef<MapRef>(null);

  const handleMove = useCallback((evt: { viewState: ViewState }) => {
    onMove(evt);
  }, [onMove]);

  const handleLoad = useCallback(() => {
    if (mapRef.current && onMapLoad) {
      onMapLoad(mapRef.current);
    }
  }, [onMapLoad]);

  return (
    <div className="map-container" style={{ width: '100%', height: '100vh' }}>
      <Map
        id="main-map"
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        onLoad={handleLoad}
        mapStyle="https://demotiles.maplibre.org/style.json"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        cooperativeGestures={false}
      >
        {children}
      </Map>
    </div>
  );
}