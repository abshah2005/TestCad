import { useCADStore } from '../app/store';
import { Line } from '../core/entities/Line';
import Dimension from '../core/entities/Dimension';

/**
 * Command for creating dimensions on entities
 * User selects an entity (e.g. line), and a dimension is created
 */
class DimensionCommand {
  constructor() {
    this.state = {
      selectedEntity: null,
      dimension: null,
      step: 0
    };
  }

  async onInput(type, value) {
    if (type === 'point') {
      // Find nearest entity (line) to the clicked point
      const entities = useCADStore.getState().entities;
      let nearestLine = null;
      let minDist = Infinity;
      for (let entity of entities.values()) {
        if (entity.type === 'line') {
          const dist = this._distanceToLine(value, entity);
          if (dist < minDist) {
            minDist = dist;
            nearestLine = entity;
          }
        }
      }
      if (nearestLine) {
        this.state.selectedEntity = nearestLine;
        // Create dimension entity
        const length = nearestLine.getLength();
        const unit = useCADStore.getState().unit || 'mm';
        const scale = useCADStore.getState().scale || 1.0;
        const dim = new Dimension(nearestLine.id, length * scale, { unit, scale });
        this.state.dimension = dim;
        useCADStore.getState().addEntity(dim);
      }
    }
  }

  _distanceToLine(point, line) {
    // Simple point-to-line distance
    const { start, end } = line;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return Math.sqrt((point.x - start.x) ** 2 + (point.y - start.y) ** 2);
    const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (length * length);
    const proj = {
      x: start.x + t * dx,
      y: start.y + t * dy
    };
    return Math.sqrt((point.x - proj.x) ** 2 + (point.y - proj.y) ** 2);
  }
}

export default DimensionCommand;
