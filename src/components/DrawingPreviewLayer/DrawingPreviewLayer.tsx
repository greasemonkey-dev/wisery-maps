interface DrawingPreviewLayerProps {
  vertices: [number, number][];
  isDrawing: boolean;
  circleCenter?: [number, number] | null;
  circleRadius?: number;
  isDrawingCircle?: boolean;
  isDrawingPolygon?: boolean;
}

export default function DrawingPreviewLayer({ 
  vertices, 
  isDrawing, 
  circleCenter, 
  circleRadius, 
  isDrawingCircle, 
  isDrawingPolygon 
}: DrawingPreviewLayerProps) {
  // TODO: Implement MapTiler SDK native drawing preview
  // For now, returning null to allow build to complete
  console.log('DrawingPreviewLayer: Preview state', { 
    vertices: vertices.length, 
    isDrawing, 
    isDrawingCircle, 
    isDrawingPolygon,
    circleCenter,
    circleRadius
  });
  return null;
}