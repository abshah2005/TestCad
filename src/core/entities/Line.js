import { v4 as uuidv4 } from 'uuid';

/**
 * Line entity class
 */
export class Line {
  constructor(start, end, options = {}) {
    this.id = options.id || uuidv4();
    this.type = 'line';
    this.start = { ...start };
    this.end = { ...end };
    this.layerId = options.layerId || '0';
    this.color = options.color || null;
    this.lineweight = options.lineweight || 1;
    this.linetype = options.linetype || 'continuous';
  }

  /**
   * Get the length of the line
   * @returns {number} Length in world units
   */
  getLength() {
    const dx = this.end.x - this.start.x;
    const dy = this.end.y - this.start.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get the angle of the line in radians
   * @returns {number} Angle in radians
   */
  getAngle() {
    return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);
  }

  /**
   * Get the midpoint of the line
   * @returns {Object} Midpoint {x, y}
   */
  getMidpoint() {
    return {
      x: (this.start.x + this.end.x) / 2,
      y: (this.start.y + this.end.y) / 2
    };
  }

  /**
   * Get bounding box
   * @returns {Object} Bounds {minX, minY, maxX, maxY}
   */
  getBounds() {
    return {
      minX: Math.min(this.start.x, this.end.x),
      minY: Math.min(this.start.y, this.end.y),
      maxX: Math.max(this.start.x, this.end.x),
      maxY: Math.max(this.start.y, this.end.y)
    };
  }

  /**
   * Transform the line
   * @param {Object} transform - Transform matrix or translation
   */
  transform(transform) {
    if (transform.translate) {
      this.start.x += transform.translate.x;
      this.start.y += transform.translate.y;
      this.end.x += transform.translate.x;
      this.end.y += transform.translate.y;
    }
    // TODO: Add rotation, scale transforms
  }

  /**
   * Clone the line
   * @returns {Line} New line instance
   */
  clone() {
    return new Line(this.start, this.end, {
      layerId: this.layerId,
      color: this.color,
      lineweight: this.lineweight,
      linetype: this.linetype
    });
  }

  /**
   * Convert to serializable object
   * @returns {Object} Serializable representation
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      start: this.start,
      end: this.end,
      layerId: this.layerId,
      color: this.color,
      lineweight: this.lineweight,
      linetype: this.linetype
    };
  }

  /**
   * Create from serializable object
   * @param {Object} data - Serialized data
   * @returns {Line} Line instance
   */
  static fromJSON(data) {
    return new Line(data.start, data.end, {
      id: data.id,
      layerId: data.layerId,
      color: data.color,
      lineweight: data.lineweight,
      linetype: data.linetype
    });
  }
}

export default Line;
