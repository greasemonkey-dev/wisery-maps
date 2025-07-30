import { useEffect } from 'react';
import { Map } from '@maptiler/sdk';
import * as turf from '@turf/turf';
import type { Circle } from '../../types';

interface CirclesLayerProps {
  circles: Circle[];
  map?: Map | null;
}

export default function CirclesLayer({ circles, map }: CirclesLayerProps) {
  console.log('CirclesLayer: Rendering', circles.length, 'circles');

  useEffect(() => {
    if (!map) return;

    // Create GeoJSON for all circles
    const validCircleFeatures = circles.map(circle => {
      try {
        // Create circle using Turf.js with radius in meters
        const center = turf.point(circle.center);
        const circlePolygon = turf.circle(center, circle.radius / 1000, { steps: 64, units: 'kilometers' });
        
        return {
          type: 'Feature' as const,
          id: circle.id,
          geometry: circlePolygon.geometry,
          properties: {
            id: circle.id,
            name: circle.name,
            color: circle.color,
            radius: circle.radius,
            userId: circle.userId,
            type: 'circle'
          }
        };
      } catch (error) {
        console.error('Error creating circle geometry for', circle.id, error);
        return null;
      }
    }).filter((feature): feature is NonNullable<typeof feature> => feature !== null);

    const circlesGeoJSON = {
      type: 'FeatureCollection' as const,
      features: validCircleFeatures
    };

    try {
      // Add or update circles source
      if (map.getSource('circles-source')) {
        const source = map.getSource('circles-source') as any;
        source.setData(circlesGeoJSON);
      } else {
        // Add source
        map.addSource('circles-source', {
          type: 'geojson',
          data: circlesGeoJSON
        });

        // Add fill layer
        map.addLayer({
          id: 'circles-fill',
          type: 'fill',
          source: 'circles-source',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.3
          }
        });

        // Add outline layer
        map.addLayer({
          id: 'circles-outline',
          type: 'line',
          source: 'circles-source',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2
          }
        });

        // Add click handler for circles
        const handleCircleClick = (e: any) => {
          if (e.features && e.features[0]) {
            const properties = e.features[0].properties;
            console.log('Circle clicked:', properties);
            // TODO: Add circle click handling
          }
        };

        const handleCircleMouseEnter = () => {
          map.getCanvas().style.cursor = 'pointer';
        };

        const handleCircleMouseLeave = () => {
          map.getCanvas().style.cursor = '';
        };

        map.on('click', 'circles-fill', handleCircleClick);
        map.on('mouseenter', 'circles-fill', handleCircleMouseEnter);
        map.on('mouseleave', 'circles-fill', handleCircleMouseLeave);
      }
    } catch (error) {
      console.error('Error updating circles layer:', error);
    }
  }, [map, circles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map) {
        try {
          if (map.getSource('circles-source')) {
            map.removeLayer('circles-fill');
            map.removeLayer('circles-outline');
            map.removeSource('circles-source');
          }
        } catch (error) {
          console.warn('Error cleaning up circles layer:', error);
        }
      }
    };
  }, [map]);

  return null;
}