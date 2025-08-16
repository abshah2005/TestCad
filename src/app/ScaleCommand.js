import { BaseCommand } from './commandBus';
import useCADStore from './store';

/**
 * Scale Command
 * Implements entity scaling with preview
 */
export class ScaleCommand extends BaseCommand {
  constructor(args = {}) {
    super(args);
    this.selectedEntities = [];
    this.basePoint = null;
    this.scaleFactor = 1;
    this.previewEntities = [];
    this.state = 'waitingForSelection';
  }

  async execute() {
    this.setPrompt('Select entities to scale:');
    
    return new Promise((resolve, reject) => {
      this.resolveCommand = resolve;
      this.rejectCommand = reject;
    });
  }

  async handleInput(type, value) {
    switch (type) {
      case 'point':
        return this.handlePointInput(value);
      
      case 'selection':
        return this.handleSelectionInput(value);
      
      case 'key':
        if (value === 'Escape') {
          await this.cancel();
          return true;
        } else if (value === 'Enter' && this.state === 'waitingForSelection' && this.selectedEntities.length > 0) {
          this.state = 'waitingForBasePoint';
          this.setPrompt('Specify base point:');
          return true;
        }
        break;
        
      case 'mousemove':
        if (this.state === 'waitingForScale' && this.basePoint) {
          this.updatePreview(value);
        }
        break;
    }
    
    return false;
  }

  async handleSelectionInput(selectedIds) {
    const store = useCADStore.getState();
    
    this.selectedEntities = selectedIds.map(id => store.entities.get(id))
                                     .filter(entity => entity);
    
    if (this.selectedEntities.length > 0) {
      this.setPrompt(`${this.selectedEntities.length} entities selected. Press Enter to continue:`);
    } else {
      this.setPrompt('Select entities to scale:');
    }
    
    return true;
  }

  async handlePointInput(point) {
    switch (this.state) {
      case 'waitingForBasePoint':
        this.basePoint = { ...point };
        this.state = 'waitingForScale';
        this.setPrompt('Specify scale point or enter scale factor:');
        return true;

      case 'waitingForScale':
        // Calculate scale factor based on distance
        const dx = point.x - this.basePoint.x;
        const dy = point.y - this.basePoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.scaleFactor = Math.max(0.1, distance / 100); // Adjust scale calculation as needed
        await this.commitScale();
        return true;
    }
    
    return false;
  }

  updatePreview(mousePoint) {
    if (!this.basePoint || this.selectedEntities.length === 0) return;

    // Calculate scale factor
    const dx = mousePoint.x - this.basePoint.x;
    const dy = mousePoint.y - this.basePoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scaleFactor = Math.max(0.1, distance / 100);

    const store = useCADStore.getState();
    
    // Remove previous preview
    this.clearPreviews();

    // Create preview entities
    this.previewEntities = this.selectedEntities.map(entity => {
      const previewEntity = this.scaleEntity(entity, scaleFactor, this.basePoint);
      previewEntity.id = `${entity.id}-scale-preview`;
      previewEntity.color = '#666666';
      previewEntity.isPreview = true;
      
      store.addEntity(previewEntity);
      return previewEntity;
    });
  }

  scaleEntity(entity, factor, origin) {
    if (typeof entity.scale === 'function') {
      return entity.scale(factor, origin);
    }
    // fallback for entities without scale method
    const scaled = { ...entity };
    const scalePoint = (point) => ({
      x: origin.x + (point.x - origin.x) * factor,
      y: origin.y + (point.y - origin.y) * factor
    });
    switch (entity.type) {
      case 'line':
        scaled.start = scalePoint(entity.start);
        scaled.end = scalePoint(entity.end);
        break;
      case 'circle':
        scaled.center = scalePoint(entity.center);
        scaled.radius = entity.radius * factor;
        break;
      case 'rectangle':
        scaled.corner1 = scalePoint(entity.corner1);
        scaled.corner2 = scalePoint(entity.corner2);
        break;
      case 'arc':
        scaled.center = scalePoint(entity.center);
        scaled.radius = entity.radius * factor;
        break;
      case 'polyline':
        scaled.vertices = entity.vertices.map(vertex => scalePoint(vertex));
        break;
    }
    return scaled;
  }

  clearPreviews() {
    const store = useCADStore.getState();
    
    this.previewEntities.forEach(entity => {
      store.removeEntity(entity.id);
    });
    this.previewEntities = [];
  }

  async commitScale() {
    const store = useCADStore.getState();
    
    // Clear previews
    this.clearPreviews();

    // Store original entities for undo
    const originalEntities = [...this.selectedEntities];
    const scaledEntities = [];

    // Scale entities
    this.selectedEntities.forEach(entity => {
      const scaledEntity = this.scaleEntity(entity, this.scaleFactor, this.basePoint);
      store.removeEntity(entity.id);
      store.addEntity(scaledEntity);
      scaledEntities.push(scaledEntity);
    });

    // Command completed
    this.state = 'completed';
    
    if (this.resolveCommand) {
      this.resolveCommand({
        completed: true,
        entities: scaledEntities,
        undo: () => {
          scaledEntities.forEach(entity => store.removeEntity(entity.id));
          originalEntities.forEach(entity => store.addEntity(entity));
        },
        redo: () => {
          originalEntities.forEach(entity => store.removeEntity(entity.id));
          scaledEntities.forEach(entity => store.addEntity(entity));
        }
      });
    }
  }

  async cancel() {
    this.clearPreviews();
    this.state = 'cancelled';
    
    if (this.rejectCommand) {
      this.rejectCommand(new Error('Command cancelled'));
    }
  }
}

export default ScaleCommand;
