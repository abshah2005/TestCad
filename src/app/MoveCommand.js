import { BaseCommand } from './commandBus';
import useCADStore from './store';

/**
 * Move Command
 * Implements entity moving with preview
 */
export class MoveCommand extends BaseCommand {
  constructor(args = {}) {
    super(args);
    this.selectedEntities = [];
    this.basePoint = null;
    this.targetPoint = null;
    this.previewEntities = [];
    this.state = 'waitingForSelection';
  }

  async execute() {
    this.setPrompt('Select entities to move:');
    
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
        if (this.state === 'waitingForTarget' && this.basePoint) {
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
      this.setPrompt(`${this.selectedEntities.length} entities selected. Press Enter to continue or select more:`);
    } else {
      this.setPrompt('Select entities to move:');
    }
    
    return true;
  }

  async handlePointInput(point) {
    switch (this.state) {
      case 'waitingForBasePoint':
        this.basePoint = { ...point };
        this.state = 'waitingForTarget';
        this.setPrompt('Specify target point:');
        return true;

      case 'waitingForTarget':
        this.targetPoint = { ...point };
        await this.commitMove();
        return true;
    }
    
    return false;
  }

  updatePreview(mousePoint) {
    if (!this.basePoint || this.selectedEntities.length === 0) return;

    const store = useCADStore.getState();
    
    // Remove previous preview
    this.clearPreviews();

    // Calculate offset
    const offset = {
      x: mousePoint.x - this.basePoint.x,
      y: mousePoint.y - this.basePoint.y
    };

    // Create preview entities
    this.previewEntities = this.selectedEntities.map(entity => {
      const previewEntity = this.moveEntity(entity, offset);
      previewEntity.id = `${entity.id}-preview`;
      previewEntity.color = '#666666';
      previewEntity.isPreview = true;
      
      store.addEntity(previewEntity);
      return previewEntity;
    });
  }

  moveEntity(entity, offset) {
    if (typeof entity.move === 'function') {
      return entity.move(offset);
    }
    // fallback for entities without move method
    const moved = { ...entity };
    switch (entity.type) {
      case 'line':
        moved.start = { x: entity.start.x + offset.x, y: entity.start.y + offset.y };
        moved.end = { x: entity.end.x + offset.x, y: entity.end.y + offset.y };
        break;
      case 'circle':
        moved.center = { x: entity.center.x + offset.x, y: entity.center.y + offset.y };
        break;
      case 'rectangle':
        moved.corner1 = { x: entity.corner1.x + offset.x, y: entity.corner1.y + offset.y };
        moved.corner2 = { x: entity.corner2.x + offset.x, y: entity.corner2.y + offset.y };
        break;
      case 'arc':
        moved.center = { x: entity.center.x + offset.x, y: entity.center.y + offset.y };
        break;
      case 'polyline':
        moved.vertices = entity.vertices.map(vertex => ({
          x: vertex.x + offset.x,
          y: vertex.y + offset.y
        }));
        break;
    }
    return moved;
  }

  clearPreviews() {
    const store = useCADStore.getState();
    
    this.previewEntities.forEach(entity => {
      store.removeEntity(entity.id);
    });
    this.previewEntities = [];
  }

  async commitMove() {
    const store = useCADStore.getState();
    
    // Clear previews
    this.clearPreviews();

    // Calculate offset
    const offset = {
      x: this.targetPoint.x - this.basePoint.x,
      y: this.targetPoint.y - this.basePoint.y
    };

    // Store original entities for undo
    const originalEntities = [...this.selectedEntities];
    const movedEntities = [];

    // Move entities
    this.selectedEntities.forEach(entity => {
      const movedEntity = this.moveEntity(entity, offset);
      store.removeEntity(entity.id);
      store.addEntity(movedEntity);
      movedEntities.push(movedEntity);
    });

    // Command completed
    this.state = 'completed';
    
    if (this.resolveCommand) {
      this.resolveCommand({
        completed: true,
        entities: movedEntities,
        undo: () => {
          movedEntities.forEach(entity => store.removeEntity(entity.id));
          originalEntities.forEach(entity => store.addEntity(entity));
        },
        redo: () => {
          originalEntities.forEach(entity => store.removeEntity(entity.id));
          movedEntities.forEach(entity => store.addEntity(entity));
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

export default MoveCommand;
