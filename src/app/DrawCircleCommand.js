import { BaseCommand } from './commandBus';
import useCADStore from './store';
import Circle from '../core/entities/Circle';

/**
 * Draw Circle Command
 * Implements center-radius circle drawing with preview
 */
export class DrawCircleCommand extends BaseCommand {
  constructor(args = {}) {
    super(args);
    this.center = null;
    this.radius = 0;
    this.previewCircle = null;
    this.state = 'waitingForCenter';
  }

  async execute() {
    this.setPrompt('Specify center point:');
    
    return new Promise((resolve, reject) => {
      this.resolveCommand = resolve;
      this.rejectCommand = reject;
    });
  }

  async handleInput(type, value) {
    switch (type) {
      case 'point':
        return this.handlePointInput(value);
      
      case 'key':
        if (value === 'Escape') {
          await this.cancel();
          return true;
        }
        break;
        
      case 'mousemove':
        if (this.state === 'waitingForRadius' && this.center) {
          this.updatePreview(value);
        }
        break;
    }
    
    return false;
  }

  async handlePointInput(point) {
    switch (this.state) {
      case 'waitingForCenter':
        this.center = { ...point };
        this.state = 'waitingForRadius';
        this.setPrompt('Specify radius point:');
        return true;

      case 'waitingForRadius':
        const dx = point.x - this.center.x;
        const dy = point.y - this.center.y;
        this.radius = Math.sqrt(dx * dx + dy * dy);
        await this.commitCircle();
        return true;
    }
    
    return false;
  }

  updatePreview(mousePoint) {
    if (!this.center) return;

    const store = useCADStore.getState();
    
    // Remove previous preview
    if (this.previewCircle) {
      store.removeEntity(this.previewCircle.id);
    }

    // Calculate radius
    const dx = mousePoint.x - this.center.x;
    const dy = mousePoint.y - this.center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);

    // Create preview circle
    this.previewCircle = new Circle(this.center, radius, {
      color: '#666666',
      lineweight: 1,
      isPreview: true
    });

    store.addEntity(this.previewCircle);
  }

  async commitCircle() {
    const store = useCADStore.getState();
    
    // Remove preview
    if (this.previewCircle) {
      store.removeEntity(this.previewCircle.id);
      this.previewCircle = null;
    }

    // Create final circle
    const circle = new Circle(this.center, this.radius, {
      layerId: store.currentLayer,
      color: null, // Use layer color
      lineweight: 1
    });

    // Add to drawing
    store.addEntity(circle);
    
    // Command completed
    this.state = 'completed';
    
    if (this.resolveCommand) {
      this.resolveCommand({
        completed: true,
        entity: circle,
        undo: () => store.removeEntity(circle.id),
        redo: () => store.addEntity(circle)
      });
    }
  }

  async cancel() {
    const store = useCADStore.getState();
    
    // Remove preview
    if (this.previewCircle) {
      store.removeEntity(this.previewCircle.id);
      this.previewCircle = null;
    }

    this.state = 'cancelled';
    
    if (this.rejectCommand) {
      this.rejectCommand(new Error('Command cancelled'));
    }
  }
}

export default DrawCircleCommand;
