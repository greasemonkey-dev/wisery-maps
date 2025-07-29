import type { Polygon } from '../../types';

interface PolygonsLayerProps {
  polygons: Polygon[];
}

export default function PolygonsLayer({ polygons }: PolygonsLayerProps) {
  // TODO: Implement MapTiler SDK native layer rendering
  // For now, returning null to allow build to complete
  console.log('PolygonsLayer: Rendering', polygons.length, 'polygons');
  return null;
}