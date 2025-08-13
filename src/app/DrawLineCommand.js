import { BaseCommand } from '../app/commandBus';
import useCADStore from '../app/store';
import Line from '../core/entities/Line';

/**
 * Draw Line Command
 * Implements two-point line drawing with preview
 */
export class DrawLineCommand extends BaseCommand {
  constructor(args = {}) {
    super(args);
    this.startPoint = null;
    this.endPoint = null;
    this.previewLine = null;
    this.state = 'waitingForStart';
  }

  async execute() {
    this.setPrompt('Specify first point:');
    
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
        if (this.state === 'waitingForEnd' && this.startPoint) {
          this.updatePreview(value);
        }
        break;
    }
    
    return false;
  }

  async handlePointInput(point) {
    switch (this.state) {
      case 'waitingForStart':
        this.startPoint = { ...point };
        this.state = 'waitingForEnd';
        this.setPrompt('Specify next point:');
        return true;

      case 'waitingForEnd':
        this.endPoint = { ...point };
        await this.commitLine();
        return true;
    }
    
    return false;
  }

  updatePreview(mousePoint) {
    if (!this.startPoint) return;

    const store = useCADStore.getState();
    
    // Remove previous preview
    if (this.previewLine) {
      store.removeEntity(this.previewLine.id);
    }

    // Create preview line
    this.previewLine = new Line(this.startPoint, mousePoint, {
      color: '#666666',
      lineweight: 1,
      isPreview: true
    });

    store.addEntity(this.previewLine);
  }

  async commitLine() {
    const store = useCADStore.getState();
    
    // Remove preview
    if (this.previewLine) {
      store.removeEntity(this.previewLine.id);
      this.previewLine = null;
    }

    // Create final line
    const line = new Line(this.startPoint, this.endPoint, {
      layerId: store.currentLayer,
      color: null, // Use layer color
      lineweight: 1
    });

    // Add to drawing
    store.addEntity(line);
    
    // Check if we should continue with another line
    if (this.args.continuous) {
      this.startPoint = { ...this.endPoint };
      this.endPoint = null;
      this.state = 'waitingForEnd';
      this.setPrompt('Specify next point:');
      return;
    }

    // Command completed
    this.state = 'completed';
    
    if (this.resolveCommand) {
      this.resolveCommand({
        completed: true,
        entity: line,
        undo: () => store.removeEntity(line.id),
        redo: () => store.addEntity(line)
      });
    }
  }

  async cancel() {
    const store = useCADStore.getState();
    
    // Remove preview
    if (this.previewLine) {
      store.removeEntity(this.previewLine.id);
      this.previewLine = null;
    }

    this.state = 'cancelled';
    
    if (this.rejectCommand) {
      this.rejectCommand(new Error('Command cancelled'));
    }
  }
}

export default DrawLineCommand;
