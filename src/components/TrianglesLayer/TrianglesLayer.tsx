import type { Triangle } from '../../types';

interface TrianglesLayerProps {
  triangles: Triangle[];
}

export default function TrianglesLayer({ triangles }: TrianglesLayerProps) {
  // TODO: Implement MapTiler SDK native layer rendering
  // For now, returning null to allow build to complete
  console.log('TrianglesLayer: Rendering', triangles.length, 'triangles');
  return null;
}