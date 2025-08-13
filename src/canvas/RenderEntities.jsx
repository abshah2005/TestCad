import React from 'react';
import { Line, Circle, Arc, Rect } from 'react-konva';
import useCADStore from '../app/store';

/**
 * Renders all entities in the CAD drawing
 */
const RenderEntities = ({ viewport }) => {
  const entities = useCADStore(state => state.entities);
  const selection = useCADStore(state => state.selection);
  const layers = useCADStore(state => state.layers);

  const renderEntity = (entity) => {
    const layer = layers.get(entity.layerId);
    if (!layer || !layer.visible) return null;

    const isSelected = selection.has(entity.id);
    const color = isSelected ? '#ffff00' : (entity.color || layer.color || '#ffffff');
    const strokeWidth = Math.max(1, (entity.lineweight || 1) / viewport.scale);

    switch (entity.type) {
      case 'line':
        return (
          <Line
            key={entity.id}
            points={[
              entity.start.x * viewport.scale + viewport.offset.x,
              entity.start.y * viewport.scale + viewport.offset.y,
              entity.end.x * viewport.scale + viewport.offset.x,
              entity.end.y * viewport.scale + viewport.offset.y
            ]}
            stroke={color}
            strokeWidth={strokeWidth}
            lineCap="round"
            lineJoin="round"
            listening={true}
            entityId={entity.id}
          />
        );

      case 'circle':
        const centerScreen = viewport.toScreen(entity.center);
        return (
          <Circle
            key={entity.id}
            x={centerScreen.x}
            y={centerScreen.y}
            radius={entity.radius * viewport.scale}
            stroke={color}
            strokeWidth={strokeWidth}
            fill={entity.filled ? color : undefined}
            listening={true}
            entityId={entity.id}
          />
        );

      case 'arc':
        const arcCenterScreen = viewport.toScreen(entity.center);
        return (
          <Arc
            key={entity.id}
            x={arcCenterScreen.x}
            y={arcCenterScreen.y}
            innerRadius={entity.radius * viewport.scale}
            outerRadius={entity.radius * viewport.scale}
            angle={entity.endAngle - entity.startAngle}
            rotation={entity.startAngle * 180 / Math.PI}
            stroke={color}
            strokeWidth={strokeWidth}
            listening={true}
            entityId={entity.id}
          />
        );

      case 'rectangle':
        const corner1Screen = viewport.toScreen(entity.corner1);
        const corner2Screen = viewport.toScreen(entity.corner2);
        const rectWidth = Math.abs(corner2Screen.x - corner1Screen.x);
        const rectHeight = Math.abs(corner2Screen.y - corner1Screen.y);
        const rectX = Math.min(corner1Screen.x, corner2Screen.x);
        const rectY = Math.min(corner1Screen.y, corner2Screen.y);

        return (
          <Rect
            key={entity.id}
            x={rectX}
            y={rectY}
            width={rectWidth}
            height={rectHeight}
            stroke={color}
            strokeWidth={strokeWidth}
            fill={entity.filled ? color : undefined}
            listening={true}
            entityId={entity.id}
          />
        );

      case 'polyline':
        if (!entity.vertices || entity.vertices.length < 2) return null;
        
        const polyPoints = [];
        entity.vertices.forEach(vertex => {
          const screenPoint = viewport.toScreen(vertex);
          polyPoints.push(screenPoint.x, screenPoint.y);
        });

        return (
          <Line
            key={entity.id}
            points={polyPoints}
            stroke={color}
            strokeWidth={strokeWidth}
            lineCap="round"
            lineJoin="round"
            closed={entity.closed || false}
            listening={true}
            entityId={entity.id}
          />
        );

      default:
        console.warn(`Unknown entity type: ${entity.type}`);
        return null;
    }
  };

  // Filter out entities from locked layers for selection
  const visibleEntities = Array.from(entities.values()).filter(entity => {
    const layer = layers.get(entity.layerId);
    return layer && layer.visible;
  });

  return (
    <>
      {visibleEntities.map(entity => renderEntity(entity))}
    </>
  );
};

export default RenderEntities;
