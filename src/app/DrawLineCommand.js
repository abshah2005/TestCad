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
        } else if (value === 'Enter' && this.state === 'waitingForEnd') {
          // Finish line command like AutoCAD
          this.finishCommand();
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

  finishCommand() {
    // Command completed
    this.state = 'completed';
    
    if (this.resolveCommand) {
      this.resolveCommand({
        completed: true,
        message: 'Line command completed'
      });
    }
  }

  async handlePointInput(point) {
    const store = useCADStore.getState();
    
    switch (this.state) {
      case 'waitingForStart':
        this.startPoint = { ...point };
        this.state = 'waitingForEnd';
        this.setPrompt('Specify next point:');
        
        // Store the last point for ortho mode
        store.updateCommandState({ lastPoint: this.startPoint });
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
    
    // AutoCAD-style continuous line drawing - always continue unless explicitly cancelled
    this.startPoint = { ...this.endPoint };
    this.endPoint = null;
    this.state = 'waitingForEnd';
    this.setPrompt('Specify next point or press Enter to finish:');
    
    // Update last point for ortho mode
    store.updateCommandState({ lastPoint: this.startPoint });
    
    return; // Don't complete the command, keep drawing
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
