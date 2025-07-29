import { useEffect, useMemo } from 'react';
import type { Map } from '@maptiler/sdk';
import type { POI } from '../../types';

interface POIsLayerProps {
  pois: POI[];
  onPOIClick?: (poi: POI) => void;
  isDrawingDisabled?: boolean;
  map: Map | null;
}

export default function POIsLayer({ pois, onPOIClick, isDrawingDisabled, map }: POIsLayerProps) {
  const poisGeoJSON = useMemo(() => {
    if (pois.length === 0) return null;

    return {
      type: 'FeatureCollection' as const,
      features: pois.map((poi) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: poi.coordinates
        },
        properties: {
          id: poi.id,
          name: poi.name,
          description: poi.description,
          category: poi.category,
          icon: poi.icon,
          color: poi.color,
          userId: poi.userId,
          createdAt: poi.createdAt.toISOString()
        }
      }))
    };
  }, [pois]);

  useEffect(() => {
    if (!map || !poisGeoJSON) return;

    const sourceId = 'pois-source';
    const layerId = 'pois-layer';
    const labelsLayerId = 'pois-labels';

    // Clean up existing layers and source
    const cleanup = () => {
      try {
        [labelsLayerId, layerId].forEach(layer => {
          if (map.getLayer(layer)) {
            map.removeLayer(layer);
          }
        });
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch (error) {
        console.warn('Error during POI layer cleanup:', error);
      }
    };

    cleanup();

    // Add source
    map.addSource(sourceId, {
      type: 'geojson',
      data: poisGeoJSON
    });

    // Add POI circles layer
    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 8,   // At zoom 10, radius is 8px
          15, 12,  // At zoom 15, radius is 12px
          20, 16   // At zoom 20, radius is 16px
        ],
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8,
        'circle-stroke-opacity': 1
      }
    });

    // Add POI labels layer
    map.addLayer({
      id: labelsLayerId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 10,  // At zoom 10, text size is 10px
          15, 12,  // At zoom 15, text size is 12px
          20, 14   // At zoom 20, text size is 14px
        ],
        'text-offset': [0, 2],
        'text-anchor': 'top',
        'text-max-width': 8,
        'text-allow-overlap': false,
        'text-ignore-placement': false
      },
      paint: {
        'text-color': '#2c3e50',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
        'text-halo-blur': 1
      }
    });

    // Add click handler
    const handlePOIClick = (e: any) => {
      if (isDrawingDisabled || !onPOIClick) return;
      
      const features = map.queryRenderedFeatures(e.point, {
        layers: [layerId]
      });
      
      if (features.length > 0) {
        const properties = features[0].properties;
        const poi: POI = {
          id: properties.id,
          name: properties.name,
          coordinates: (features[0].geometry as any).coordinates,
          description: properties.description,
          category: properties.category,
          icon: properties.icon,
          color: properties.color,
          userId: properties.userId,
          createdAt: new Date(properties.createdAt)
        };
        onPOIClick(poi);
      }
    };

    // Add hover effects
    const handlePOIMouseEnter = () => {
      if (!isDrawingDisabled) {
        map.getCanvas().style.cursor = 'pointer';
      }
    };

    const handlePOIMouseLeave = () => {
      if (!isDrawingDisabled) {
        map.getCanvas().style.cursor = '';
      }
    };

    // Add event listeners
    map.on('click', layerId, handlePOIClick);
    map.on('mouseenter', layerId, handlePOIMouseEnter);
    map.on('mouseleave', layerId, handlePOIMouseLeave);

    // Cleanup function
    return () => {
      // Remove event listeners
      map.off('click', layerId, handlePOIClick);
      map.off('mouseenter', layerId, handlePOIMouseEnter);
      map.off('mouseleave', layerId, handlePOIMouseLeave);
      
      // Clean up layers and source
      cleanup();
    };
  }, [map, poisGeoJSON, onPOIClick, isDrawingDisabled]);

  // This component renders layers directly to the map, no JSX needed
  return null;
}