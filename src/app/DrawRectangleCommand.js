import { BaseCommand } from './commandBus';
import useCADStore from './store';
import Rectangle from '../core/entities/Rectangle';

/**
 * Draw Rectangle Command
 * Implements two-corner rectangle drawing with preview
 */
export class DrawRectangleCommand extends BaseCommand {
  constructor(args = {}) {
    super(args);
    this.firstCorner = null;
    this.secondCorner = null;
    this.previewRectangle = null;
    this.state = 'waitingForFirstCorner';
  }

  async execute() {
    this.setPrompt('Specify first corner:');
    
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
        if (this.state === 'waitingForSecondCorner' && this.firstCorner) {
          this.updatePreview(value);
        }
        break;
    }
    
    return false;
  }

  async handlePointInput(point) {
    switch (this.state) {
      case 'waitingForFirstCorner':
        this.firstCorner = { ...point };
        this.state = 'waitingForSecondCorner';
        this.setPrompt('Specify opposite corner:');
        return true;

      case 'waitingForSecondCorner':
        this.secondCorner = { ...point };
        await this.commitRectangle();
        return true;
    }
    
    return false;
  }

  updatePreview(mousePoint) {
    if (!this.firstCorner) return;

    const store = useCADStore.getState();
    
    // Remove previous preview
    if (this.previewRectangle) {
      store.removeEntity(this.previewRectangle.id);
    }

    // Create preview rectangle
    this.previewRectangle = new Rectangle(this.firstCorner, mousePoint, {
      color: '#666666',
      lineweight: 1,
      isPreview: true
    });

    store.addEntity(this.previewRectangle);
  }

  async commitRectangle() {
    const store = useCADStore.getState();
    
    // Remove preview
    if (this.previewRectangle) {
      store.removeEntity(this.previewRectangle.id);
      this.previewRectangle = null;
    }

    // Create final rectangle
    const rectangle = new Rectangle(this.firstCorner, this.secondCorner, {
      layerId: store.currentLayer,
      color: '#ff0000', // Ensure visible color
      lineweight: 1
    });
    console.log('Committing rectangle:', rectangle); // Debug log

    // Add to drawing
    store.addEntity(rectangle);
    
    // Command completed
    this.state = 'completed';
    
    if (this.resolveCommand) {
      this.resolveCommand({
        completed: true,
        entity: rectangle,
        undo: () => store.removeEntity(rectangle.id),
        redo: () => store.addEntity(rectangle)
      });
    }
  }

  async cancel() {
    const store = useCADStore.getState();
    
    // Remove preview
    if (this.previewRectangle) {
      store.removeEntity(this.previewRectangle.id);
      this.previewRectangle = null;
    }

    this.state = 'cancelled';
    
    if (this.rejectCommand) {
      this.rejectCommand(new Error('Command cancelled'));
    }
  }
}

export default DrawRectangleCommand;
