import { v4 as uuidv4 } from 'uuid';

/**
 * Dimension entity class
 * Stores reference to the entity being dimensioned and its measured value
 */
export class Dimension {
  constructor(entityId, value, options = {}) {
    this.id = options.id || uuidv4();
    this.type = 'dimension';
    this.entityId = entityId;
    this.value = value; // measured value in world units
    this.unit = options.unit || 'mm';
    this.scale = options.scale || 1.0;
    this.text = options.text || `${value.toFixed(2)} ${this.unit}`;
    this.position = options.position || null; // where to render the dimension text
  }
}

export default Dimension;
