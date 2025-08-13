import React from 'react';
import { Group, Rect, Circle, Line } from 'react-konva';

/**
 * SnapVisual - Renders snap point indicators
 */
const SnapVisual = ({ snapPoint, viewport }) => {
  if (!snapPoint) return null;

  const screenPos = viewport.toScreen(snapPoint.point);
  const { visual } = snapPoint;
  
  const colors = {
    endpoint: '#00FF00',    // Green square
    midpoint: '#FFFF00',    // Yellow triangle
    center: '#FF0000',      // Red circle
    intersection: '#00FFFF', // Cyan cross
    nearest: '#FF00FF',     // Magenta X
    perpendicular: '#FFA500', // Orange
    tangent: '#800080'      // Purple
  };

  const color = colors[snapPoint.type] || '#FFFFFF';

  const renderVisual = () => {
    switch (visual.type) {
      case 'square':
        return (
          <Rect
            x={screenPos.x - visual.size / 2}
            y={screenPos.y - visual.size / 2}
            width={visual.size}
            height={visual.size}
            stroke={color}
            strokeWidth={2}
            fill="transparent"
          />
        );
        
      case 'circle':
        return (
          <Circle
            x={screenPos.x}
            y={screenPos.y}
            radius={visual.size / 2}
            stroke={color}
            strokeWidth={2}
            fill="transparent"
          />
        );
        
      case 'triangle':
        const size = visual.size / 2;
        const points = [
          0, -size,     // Top
          -size, size,  // Bottom left
          size, size,   // Bottom right
          0, -size      // Close
        ];
        return (
          <Line
            x={screenPos.x}
            y={screenPos.y}
            points={points}
            stroke={color}
            strokeWidth={2}
            fill="transparent"
            closed={true}
          />
        );
        
      case 'cross':
        const crossSize = visual.size / 2;
        return (
          <Group>
            <Line
              points={[
                screenPos.x - crossSize, screenPos.y,
                screenPos.x + crossSize, screenPos.y
              ]}
              stroke={color}
              strokeWidth={2}
            />
            <Line
              points={[
                screenPos.x, screenPos.y - crossSize,
                screenPos.x, screenPos.y + crossSize
              ]}
              stroke={color}
              strokeWidth={2}
            />
          </Group>
        );
        
      case 'x':
        const xSize = visual.size / 2;
        return (
          <Group>
            <Line
              points={[
                screenPos.x - xSize, screenPos.y - xSize,
                screenPos.x + xSize, screenPos.y + xSize
              ]}
              stroke={color}
              strokeWidth={2}
            />
            <Line
              points={[
                screenPos.x - xSize, screenPos.y + xSize,
                screenPos.x + xSize, screenPos.y - xSize
              ]}
              stroke={color}
              strokeWidth={2}
            />
          </Group>
        );
        
      default:
        return null;
    }
  };

  return (
    <Group>
      {renderVisual()}
    </Group>
  );
};

export default SnapVisual;
