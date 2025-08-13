import React from 'react';
import { Line } from 'react-konva';

/**
 * Grid component for CAD canvas
 * Draws adaptive grid with major/minor lines and axes
 */
const Grid = ({ scale, offset, width, height, viewport }) => {
  const lines = [];
  
  // Grid spacing calculation - powers of 10 adaptation
  const getGridSpacing = (scale) => {
    const baseSpacing = 50; // 50 units base spacing
    const screenSpacing = baseSpacing * scale;
    
    if (screenSpacing < 5) {
      return baseSpacing * 10;
    } else if (screenSpacing > 100) {
      return baseSpacing / 10;
    }
    return baseSpacing;
  };

  const gridSpacing = getGridSpacing(scale);
  const screenSpacing = gridSpacing * scale;
  
  // Calculate visible world bounds
  const worldBounds = {
    left: (0 - offset.x) / scale,
    right: (width - offset.x) / scale,
    top: (0 - offset.y) / scale,
    bottom: (height - offset.y) / scale
  };

  // Grid line style
  const minorLineWidth = Math.max(0.5, 1 / scale);
  const majorLineWidth = Math.max(1, 2 / scale);
  const axisLineWidth = Math.max(2, 3 / scale);

  // Calculate grid start/end points
  const startX = Math.floor(worldBounds.left / gridSpacing) * gridSpacing;
  const endX = Math.ceil(worldBounds.right / gridSpacing) * gridSpacing;
  const startY = Math.floor(worldBounds.top / gridSpacing) * gridSpacing;
  const endY = Math.ceil(worldBounds.bottom / gridSpacing) * gridSpacing;

  // Draw vertical grid lines
  for (let x = startX; x <= endX; x += gridSpacing) {
    const screenX = x * scale + offset.x;
    const isMajor = Math.abs(x % (gridSpacing * 5)) < 1e-9;
    const isAxis = Math.abs(x) < 1e-9;
    
    lines.push(
      <Line
        key={`vline-${x}`}
        points={[screenX, 0, screenX, height]}
        stroke={
          isAxis ? '#ff0000' : // X-axis in red
          isMajor ? '#404040' : '#202020'
        }
        strokeWidth={
          isAxis ? axisLineWidth :
          isMajor ? majorLineWidth : minorLineWidth
        }
        opacity={isAxis ? 1.0 : (isMajor ? 0.6 : 0.3)}
        listening={false}
      />
    );
  }

  // Draw horizontal grid lines
  for (let y = startY; y <= endY; y += gridSpacing) {
    const screenY = y * scale + offset.y;
    const isMajor = Math.abs(y % (gridSpacing * 5)) < 1e-9;
    const isAxis = Math.abs(y) < 1e-9;
    
    lines.push(
      <Line
        key={`hline-${y}`}
        points={[0, screenY, width, screenY]}
        stroke={
          isAxis ? '#00ff00' : // Y-axis in green
          isMajor ? '#404040' : '#202020'
        }
        strokeWidth={
          isAxis ? axisLineWidth :
          isMajor ? majorLineWidth : minorLineWidth
        }
        opacity={isAxis ? 1.0 : (isMajor ? 0.6 : 0.3)}
        listening={false}
      />
    );
  }

  // Add axis labels at origin if visible
  const originScreen = viewport.toScreen({ x: 0, y: 0 });
  const showOrigin = 
    originScreen.x >= -50 && originScreen.x <= width + 50 &&
    originScreen.y >= -50 && originScreen.y <= height + 50;

  return (
    <>
      {lines}
      {showOrigin && (
        <>
          {/* Origin marker */}
          <Line
            points={[
              originScreen.x - 10, originScreen.y,
              originScreen.x + 10, originScreen.y
            ]}
            stroke="#ffffff"
            strokeWidth={2}
            listening={false}
          />
          <Line
            points={[
              originScreen.x, originScreen.y - 10,
              originScreen.x, originScreen.y + 10
            ]}
            stroke="#ffffff"
            strokeWidth={2}
            listening={false}
          />
        </>
      )}
    </>
  );
};

export default Grid;
