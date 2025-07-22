import { useMemo } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import type { MapPoint } from '../../types';
import { initializeClustering, getClusters } from '../../utils/pointClustering';

interface PointsLayerProps {
  points: MapPoint[];
  onPointClick?: (point: MapPoint) => void;
  zoom: number;
  bounds?: [number, number, number, number]; // [west, south, east, north]
  isDrawingDisabled?: boolean;
}

export default function PointsLayer({ points, onPointClick, zoom, bounds, isDrawingDisabled }: PointsLayerProps) {
  const markers = useMemo(() => {
    if (points.length === 0) return [];

    // Initialize clustering
    const cluster = initializeClustering(points);
    
    // Use default bounds if not provided (world bounds)
    const defaultBounds: [number, number, number, number] = [-180, -85, 180, 85];
    const activeBounds = bounds || defaultBounds;
    
    // Get clusters for current view
    const clusters = getClusters(cluster, activeBounds, zoom);
    
    return clusters.map((clusterPoint) => {
      const { geometry, properties } = clusterPoint;
      const [longitude, latitude] = geometry.coordinates;
      
      if (properties.cluster) {
        // Render cluster marker
        const pointCount = properties.point_count || 0;
        return (
          <Marker
            key={`cluster-${properties.cluster_id}`}
            longitude={longitude}
            latitude={latitude}
            onClick={() => {
              if (isDrawingDisabled) return;
              // TODO: Zoom to cluster bounds on click
              console.log('Cluster clicked:', pointCount, 'points');
            }}
          >
            <div className="map-cluster-marker">
              <div className="cluster-dot">
                <span className="cluster-count">{pointCount}</span>
              </div>
              <div className="cluster-label">📍 {pointCount} locations</div>
            </div>
          </Marker>
        );
      } else {
        // Render individual point
        const point = properties as MapPoint;
        return (
          <Marker
            key={point.id}
            longitude={longitude}
            latitude={latitude}
            onClick={() => {
              if (isDrawingDisabled) return;
              onPointClick?.(point);
            }}
          >
            <div className="map-point-marker">
              <div className="marker-dot" />
              <div className="marker-label">{point.label}</div>
            </div>
          </Marker>
        );
      }
    });
  }, [points, onPointClick, zoom, bounds, isDrawingDisabled]);

  return <>{markers}</>;
}

// Add CSS styles for the markers
const styles = `
.map-point-marker {
  cursor: pointer;
  position: relative;
  transform: translate(-50%, -100%);
}

.marker-dot {
  width: 12px;
  height: 12px;
  background-color: #4CBACB;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  transition: all 0.2s ease;
}

.map-point-marker:hover .marker-dot {
  width: 16px;
  height: 16px;
  background-color: #369fad;
}

.marker-label {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.map-point-marker:hover .marker-label {
  opacity: 1;
}

.map-cluster-marker {
  cursor: pointer;
  position: relative;
  transform: translate(-50%, -100%);
}

.cluster-dot {
  min-width: 24px;
  height: 24px;
  background-color: #E74C3C;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 3px 6px rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.map-cluster-marker:hover .cluster-dot {
  min-width: 28px;
  height: 28px;
  background-color: #C0392B;
}

.cluster-count {
  color: white;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
}

.cluster-label {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.map-cluster-marker:hover .cluster-label {
  opacity: 1;
}
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}