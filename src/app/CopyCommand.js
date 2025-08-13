import { BaseCommand } from './commandBus';
import useCADStore from './store';

/**
 * Copy Command
 * Implements entity copying with preview
 */
export class CopyCommand extends BaseCommand {
  constructor(args = {}) {
    super(args);
    this.selectedEntities = [];
    this.basePoint = null;
    this.targetPoint = null;
    this.previewEntities = [];
    this.state = 'waitingForSelection';
  }

  async execute() {
    this.setPrompt('Select entities to copy:');
    
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
      this.setPrompt('Select entities to copy:');
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
        await this.commitCopy();
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
      const previewEntity = this.copyEntity(entity, offset);
      previewEntity.id = `${entity.id}-copy-preview`;
      previewEntity.color = '#666666';
      previewEntity.isPreview = true;
      
      store.addEntity(previewEntity);
      return previewEntity;
    });
  }

  copyEntity(entity, offset) {
    const copied = { ...entity };
    delete copied.id; // Will get new ID when added
    
    switch (entity.type) {
      case 'line':
        copied.start = { x: entity.start.x + offset.x, y: entity.start.y + offset.y };
        copied.end = { x: entity.end.x + offset.x, y: entity.end.y + offset.y };
        break;
        
      case 'circle':
        copied.center = { x: entity.center.x + offset.x, y: entity.center.y + offset.y };
        break;
        
      case 'rectangle':
        copied.corner1 = { x: entity.corner1.x + offset.x, y: entity.corner1.y + offset.y };
        copied.corner2 = { x: entity.corner2.x + offset.x, y: entity.corner2.y + offset.y };
        break;
        
      case 'arc':
        copied.center = { x: entity.center.x + offset.x, y: entity.center.y + offset.y };
        break;
        
      case 'polyline':
        copied.vertices = entity.vertices.map(vertex => ({
          x: vertex.x + offset.x,
          y: vertex.y + offset.y
        }));
        break;
    }
    
    return copied;
  }

  clearPreviews() {
    const store = useCADStore.getState();
    
    this.previewEntities.forEach(entity => {
      store.removeEntity(entity.id);
    });
    this.previewEntities = [];
  }

  async commitCopy() {
    const store = useCADStore.getState();
    
    // Clear previews
    this.clearPreviews();

    // Calculate offset
    const offset = {
      x: this.targetPoint.x - this.basePoint.x,
      y: this.targetPoint.y - this.basePoint.y
    };

    // Copy entities
    const copiedEntities = [];
    this.selectedEntities.forEach(entity => {
      const copiedEntity = this.copyEntity(entity, offset);
      const addedEntity = store.addEntity(copiedEntity);
      copiedEntities.push(addedEntity);
    });

    // Command completed
    this.state = 'completed';
    
    if (this.resolveCommand) {
      this.resolveCommand({
        completed: true,
        entities: copiedEntities,
        undo: () => {
          copiedEntities.forEach(entity => store.removeEntity(entity.id));
        },
        redo: () => {
          copiedEntities.forEach(entity => store.addEntity(entity));
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

export default CopyCommand;
