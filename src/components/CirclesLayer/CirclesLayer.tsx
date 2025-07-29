import type { Circle } from '../../types';

interface CirclesLayerProps {
  circles: Circle[];
}

export default function CirclesLayer({ circles }: CirclesLayerProps) {
  // TODO: Implement MapTiler SDK native layer rendering
  // For now, returning null to allow build to complete
  console.log('CirclesLayer: Rendering', circles.length, 'circles');
  return null;
}