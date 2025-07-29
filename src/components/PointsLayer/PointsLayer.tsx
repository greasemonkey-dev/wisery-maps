import { useEffect, useMemo } from 'react';
import type { Map } from '@maptiler/sdk';
import type { MapPoint } from '../../types';

interface PointsLayerProps {
  points: MapPoint[];
  onPointClick?: (point: MapPoint) => void;
  zoom: number;
  bounds?: [number, number, number, number]; // [west, south, east, north]
  isDrawingDisabled?: boolean;
  map: Map | null;
}

export default function PointsLayer({ points, onPointClick, isDrawingDisabled, map }: PointsLayerProps) {
  const pointsGeoJSON = useMemo(() => {
    if (points.length === 0) return null;

    return {
      type: 'FeatureCollection' as const,
      features: points.map((point) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: point.coordinates
        },
        properties: {
          id: point.id,
          label: point.label,
          messageId: point.messageId,
          context: point.context,
          timestamp: point.timestamp
        }
      }))
    };
  }, [points]);

  useEffect(() => {
    if (!map || !pointsGeoJSON) return;

    const sourceId = 'points-source';
    const clusterLayerId = 'clusters-layer';
    const clusterCountLayerId = 'cluster-count';
    const pointLayerId = 'points-layer';

    // Clean up existing layers and source
    const cleanup = () => {
      try {
        [clusterCountLayerId, clusterLayerId, pointLayerId].forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
        });
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch (error) {
        console.warn('Error during layer cleanup:', error);
      }
    };

    cleanup();

    // Add source with clustering enabled
    map.addSource(sourceId, {
      type: 'geojson',
      data: pointsGeoJSON,
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
    });

    // Add cluster circles layer
    map.addLayer({
      id: clusterLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#E74C3C', // Red for small clusters
          10,
          '#F39C12', // Orange for medium clusters  
          30,
          '#8E44AD'  // Purple for large clusters
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          12, // Small clusters
          10,
          16, // Medium clusters
          30,
          20  // Large clusters
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add cluster count labels
    map.addLayer({
      id: clusterCountLayerId,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Add individual points layer
    map.addLayer({
      id: pointLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#4CBACB',
        'circle-radius': 6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add click handlers
    const handleClusterClick = (e: any) => {
      if (isDrawingDisabled) return;
      
      const features = map.queryRenderedFeatures(e.point, {
        layers: [clusterLayerId]
      });
      
      if (features.length > 0) {
        const clusterId = features[0].properties.cluster_id;
        const source = map.getSource(sourceId) as any;
        
        // Get cluster expansion zoom
        source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
          if (err) return;
          
          map.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom
          });
        });
      }
    };

    const handlePointClick = (e: any) => {
      if (isDrawingDisabled || !onPointClick) return;
      
      const features = map.queryRenderedFeatures(e.point, {
        layers: [pointLayerId]
      });
      
      if (features.length > 0) {
        const properties = features[0].properties;
        const point: MapPoint = {
          id: properties.id,
          coordinates: (features[0].geometry as any).coordinates,
          label: properties.label,
          messageId: properties.messageId,
          context: properties.context,
          timestamp: properties.timestamp
        };
        onPointClick(point);
      }
    };

    // Add event listeners
    map.on('click', clusterLayerId, handleClusterClick);
    map.on('click', pointLayerId, handlePointClick);

    // Cleanup function
    return () => {
      // Remove event listeners
      map.off('click', clusterLayerId, handleClusterClick);
      map.off('click', pointLayerId, handlePointClick);
      
      // Clean up layers and source
      cleanup();
    };
  }, [map, pointsGeoJSON, onPointClick, isDrawingDisabled]);

  // This component renders layers directly to the map, no JSX needed
  return null;
}