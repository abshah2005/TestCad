import React from 'react';
import useCADStore from '../app/store';
import { Layer, Text, Arrow, Group } from 'react-konva';

function formatArchitectural(value) {
  // Architectural: feet'-inches" (e.g., 5'-3")
  const feet = Math.floor(value / 12);
  const inches = value % 12;
  return `${feet}'-${inches.toFixed(0)}"}`;
}
function formatEngineering(value) {
  // Engineering: feet.decimal-inches (e.g., 5.25)
  return (value / 12).toFixed(2);
}
function formatFractional(value) {
  // Fractional: inches in fraction (e.g., 5 1/2)
  const whole = Math.floor(value);
  const frac = value - whole;
  const denominator = 16;
  const numerator = Math.round(frac * denominator);
  return numerator ? `${whole} ${numerator}/${denominator}` : `${whole}`;
}
function formatScientific(value) {
  // Scientific: 1.23E+2
  return value.toExponential(2);
}

const RenderDimensions = ({ viewport }) => {
  const entities = useCADStore(state => state.entities);
  const units = useCADStore(state => state.units);
  const allEntities = Array.from(entities.values());

  // Format value according to units
  const formatDimension = (value) => {
    switch (units.type) {
      case 'architectural': return formatArchitectural(value);
      case 'engineering': return formatEngineering(value);
      case 'fractional': return formatFractional(value);
      case 'scientific': return formatScientific(value);
      case 'decimal':
      default:
        return value.toFixed(units.precision);
    }
  };

  return (
    <Layer>
      {allEntities.map(entity => {
        if (entity.type === 'line') {
          const start = viewport.toScreen(entity.start);
          const end = viewport.toScreen(entity.end);
          const mid = {
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2 - 20
          };
          const dx = entity.end.x - entity.start.x;
          const dy = entity.end.y - entity.start.y;
          const distance = Math.sqrt(dx * dx + dy * dy) * units.scale;
          return (
            <Group key={entity.id + '-dim'}>
              <Arrow
                points={[start.x, start.y, end.x, end.y]}
                pointerLength={10}
                pointerWidth={10}
                stroke="orange"
                fill="orange"
                strokeWidth={2}
              />
              <Text
                x={mid.x - 40}
                y={mid.y - 10}
                text={formatDimension(distance)}
                fontSize={18}
                fill="orange"
                width={80}
                align="center"
              />
            </Group>
          );
        }
        if (entity.type === 'rectangle' && entity.getCorners) {
          const corners = entity.getCorners();
          const width = entity.getWidth() * units.scale;
          const height = entity.getHeight() * units.scale;
          const topStart = viewport.toScreen(corners[0]);
          const topEnd = viewport.toScreen(corners[1]);
          const topMid = {
            x: (topStart.x + topEnd.x) / 2,
            y: topStart.y - 20
          };
          const rightStart = viewport.toScreen(corners[1]);
          const rightEnd = viewport.toScreen(corners[2]);
          const rightMid = {
            x: rightStart.x + 20,
            y: (rightStart.y + rightEnd.y) / 2
          };
          return (
            <Group key={entity.id + '-rect-dim'}>
              <Arrow
                points={[topStart.x, topStart.y - 10, topEnd.x, topEnd.y - 10]}
                pointerLength={10}
                pointerWidth={10}
                stroke="blue"
                fill="blue"
                strokeWidth={2}
              />
              <Text
                x={topMid.x - 40}
                y={topMid.y - 10}
                text={formatDimension(width)}
                fontSize={18}
                fill="blue"
                width={80}
                align="center"
              />
              <Arrow
                points={[rightStart.x + 10, rightStart.y, rightEnd.x + 10, rightEnd.y]}
                pointerLength={10}
                pointerWidth={10}
                stroke="green"
                fill="green"
                strokeWidth={2}
              />
              <Text
                x={rightMid.x - 10}
                y={rightMid.y - 20}
                text={formatDimension(height)}
                fontSize={18}
                fill="green"
                width={60}
                align="center"
              />
            </Group>
          );
        }
        return null;
      })}
    </Layer>
  );
};

export default RenderDimensions;
