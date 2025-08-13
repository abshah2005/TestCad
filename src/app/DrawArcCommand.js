import { BaseCommand } from './commandBus';
import useCADStore from './store';
import Arc from '../core/entities/Arc';

/**
 * Draw Arc Command
 * Implements three-point arc drawing with preview
 */
export class DrawArcCommand extends BaseCommand {
  constructor(args = {}) {
    super(args);
    this.center = null;
    this.startPoint = null;
    this.endPoint = null;
    this.previewArc = null;
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
        if (this.state === 'waitingForStart' && this.center) {
          this.updatePreview(value, 'radius');
        } else if (this.state === 'waitingForEnd' && this.center && this.startPoint) {
          this.updatePreview(value, 'arc');
        }
        break;
    }
    
    return false;
  }

  async handlePointInput(point) {
    switch (this.state) {
      case 'waitingForCenter':
        this.center = { ...point };
        this.state = 'waitingForStart';
        this.setPrompt('Specify start point:');
        return true;

      case 'waitingForStart':
        this.startPoint = { ...point };
        this.state = 'waitingForEnd';
        this.setPrompt('Specify end point:');
        return true;

      case 'waitingForEnd':
        this.endPoint = { ...point };
        await this.commitArc();
        return true;
    }
    
    return false;
  }

  updatePreview(mousePoint, mode) {
    if (!this.center) return;

    const store = useCADStore.getState();
    
    // Remove previous preview
    if (this.previewArc) {
      store.removeEntity(this.previewArc.id);
    }

    if (mode === 'radius') {
      // Show radius circle
      const dx = mousePoint.x - this.center.x;
      const dy = mousePoint.y - this.center.y;
      const radius = Math.sqrt(dx * dx + dy * dy);

      this.previewArc = new Arc(this.center, radius, 0, 2 * Math.PI, {
        color: '#666666',
        lineweight: 1,
        isPreview: true
      });
    } else if (mode === 'arc' && this.startPoint) {
      // Calculate angles
      const startAngle = Math.atan2(this.startPoint.y - this.center.y, this.startPoint.x - this.center.x);
      const endAngle = Math.atan2(mousePoint.y - this.center.y, mousePoint.x - this.center.x);
      
      // Calculate radius from start point
      const dx = this.startPoint.x - this.center.x;
      const dy = this.startPoint.y - this.center.y;
      const radius = Math.sqrt(dx * dx + dy * dy);

      this.previewArc = new Arc(this.center, radius, startAngle, endAngle, {
        color: '#666666',
        lineweight: 1,
        isPreview: true
      });
    }

    if (this.previewArc) {
      store.addEntity(this.previewArc);
    }
  }

  async commitArc() {
    const store = useCADStore.getState();
    
    // Remove preview
    if (this.previewArc) {
      store.removeEntity(this.previewArc.id);
      this.previewArc = null;
    }

    // Calculate arc parameters
    const startAngle = Math.atan2(this.startPoint.y - this.center.y, this.startPoint.x - this.center.x);
    const endAngle = Math.atan2(this.endPoint.y - this.center.y, this.endPoint.x - this.center.x);
    
    // Calculate radius from start point
    const dx = this.startPoint.x - this.center.x;
    const dy = this.startPoint.y - this.center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);

    // Create final arc
    const arc = new Arc(this.center, radius, startAngle, endAngle, {
      layerId: store.currentLayer,
      color: null, // Use layer color
      lineweight: 1
    });

    // Add to drawing
    store.addEntity(arc);
    
    // Command completed
    this.state = 'completed';
    
    if (this.resolveCommand) {
      this.resolveCommand({
        completed: true,
        entity: arc,
        undo: () => store.removeEntity(arc.id),
        redo: () => store.addEntity(arc)
      });
    }
  }

  async cancel() {
    const store = useCADStore.getState();
    
    // Remove preview
    if (this.previewArc) {
      store.removeEntity(this.previewArc.id);
      this.previewArc = null;
    }

    this.state = 'cancelled';
    
    if (this.rejectCommand) {
      this.rejectCommand(new Error('Command cancelled'));
    }
  }
}

export default DrawArcCommand;
