import { BaseCommand } from './commandBus';
import useCADStore from './store';
import Polyline from '../core/entities/Polyline';

/**
 * Draw Polyline Command
 * Implements multi-point polyline drawing with preview
 */
export class DrawPolylineCommand extends BaseCommand {
  constructor(args = {}) {
    super(args);
    this.vertices = [];
    this.previewPolyline = null;
    this.previewLine = null;
    this.state = 'waitingForFirstPoint';
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
        } else if (value === 'Enter' && this.vertices.length >= 2) {
          await this.commitPolyline();
          return true;
        } else if (value === 'c' || value === 'C') {
          if (this.vertices.length >= 3) {
            await this.commitPolyline(true); // Close the polyline
            return true;
          }
        } else if (value === 'u' || value === 'U') {
          this.undoLastVertex();
          return true;
        }
        break;
        
      case 'mousemove':
        if (this.vertices.length > 0) {
          this.updatePreview(value);
        }
        break;
    }
    
    return false;
  }

  async handlePointInput(point) {
    this.vertices.push({ ...point });
    
    if (this.state === 'waitingForFirstPoint') {
      this.state = 'waitingForNextPoint';
      this.setPrompt('Specify next point (Enter to finish, C to close, U to undo):');
    }
    
    this.updatePolylinePreview();
    return true;
  }

  updatePreview(mousePoint) {
    if (this.vertices.length === 0) return;

    const store = useCADStore.getState();
    
    // Remove previous preview line
    if (this.previewLine) {
      store.removeEntity(this.previewLine.id);
    }

    // Create preview line from last vertex to mouse
    const lastVertex = this.vertices[this.vertices.length - 1];
    this.previewLine = {
      id: 'polyline-preview-line',
      type: 'line',
      start: lastVertex,
      end: mousePoint,
      color: '#666666',
      lineweight: 1,
      isPreview: true
    };

    store.addEntity(this.previewLine);
  }

  updatePolylinePreview() {
    if (this.vertices.length < 2) return;

    const store = useCADStore.getState();
    
    // Remove previous preview polyline
    if (this.previewPolyline) {
      store.removeEntity(this.previewPolyline.id);
    }

    // Create preview polyline
    this.previewPolyline = new Polyline(this.vertices, {
      color: '#888888',
      lineweight: 1,
      isPreview: true
    });

    store.addEntity(this.previewPolyline);
  }

  undoLastVertex() {
    if (this.vertices.length > 0) {
      this.vertices.pop();
      
      if (this.vertices.length === 0) {
        this.state = 'waitingForFirstPoint';
        this.setPrompt('Specify first point:');
      }
      
      this.updatePolylinePreview();
    }
  }

  async commitPolyline(closed = false) {
    const store = useCADStore.getState();
    
    // Remove previews
    if (this.previewPolyline) {
      store.removeEntity(this.previewPolyline.id);
      this.previewPolyline = null;
    }
    if (this.previewLine) {
      store.removeEntity(this.previewLine.id);
      this.previewLine = null;
    }

    // Need at least 2 points for polyline
    if (this.vertices.length < 2) {
      this.setPrompt('Need at least 2 points. Specify next point:');
      return;
    }

    // Create final polyline
    const polyline = new Polyline(this.vertices, {
      layerId: store.currentLayer,
      color: null, // Use layer color
      lineweight: 1,
      closed: closed
    });

    // Add to drawing
    store.addEntity(polyline);
    
    // Command completed
    this.state = 'completed';
    
    if (this.resolveCommand) {
      this.resolveCommand({
        completed: true,
        entity: polyline,
        undo: () => store.removeEntity(polyline.id),
        redo: () => store.addEntity(polyline)
      });
    }
  }

  async cancel() {
    const store = useCADStore.getState();
    
    // Remove previews
    if (this.previewPolyline) {
      store.removeEntity(this.previewPolyline.id);
      this.previewPolyline = null;
    }
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

export default DrawPolylineCommand;
