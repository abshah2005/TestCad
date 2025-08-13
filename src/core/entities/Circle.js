import { v4 as uuidv4 } from 'uuid';

/**
 * Circle entity class
 */
export class Circle {
  constructor(center, radius, options = {}) {
    this.id = options.id || uuidv4();
    this.type = 'circle';
    this.center = { ...center };
    this.radius = radius;
    this.layerId = options.layerId || '0';
    this.color = options.color || null;
    this.lineweight = options.lineweight || 1;
    this.linetype = options.linetype || 'continuous';
    this.filled = options.filled || false;
  }

  /**
   * Get the circumference of the circle
   * @returns {number} Circumference
   */
  getCircumference() {
    return 2 * Math.PI * this.radius;
  }

  /**
   * Get the area of the circle
   * @returns {number} Area
   */
  getArea() {
    return Math.PI * this.radius * this.radius;
  }

  /**
   * Get bounding box
   * @returns {Object} Bounds {minX, minY, maxX, maxY}
   */
  getBounds() {
    return {
      minX: this.center.x - this.radius,
      minY: this.center.y - this.radius,
      maxX: this.center.x + this.radius,
      maxY: this.center.y + this.radius
    };
  }

  /**
   * Check if a point is inside the circle
   * @param {Object} point - Point {x, y}
   * @returns {boolean} True if inside
   */
  containsPoint(point) {
    const dx = point.x - this.center.x;
    const dy = point.y - this.center.y;
    return (dx * dx + dy * dy) <= (this.radius * this.radius);
  }

  /**
   * Get point on circle at given angle
   * @param {number} angle - Angle in radians
   * @returns {Object} Point {x, y}
   */
  getPointAtAngle(angle) {
    return {
      x: this.center.x + this.radius * Math.cos(angle),
      y: this.center.y + this.radius * Math.sin(angle)
    };
  }

  /**
   * Transform the circle
   * @param {Object} transform - Transform matrix or translation
   */
  transform(transform) {
    if (transform.translate) {
      this.center.x += transform.translate.x;
      this.center.y += transform.translate.y;
    }
    if (transform.scale) {
      this.radius *= transform.scale;
    }
    // TODO: Add rotation (though circles are rotation invariant)
  }

  /**
   * Clone the circle
   * @returns {Circle} New circle instance
   */
  clone() {
    return new Circle(this.center, this.radius, {
      layerId: this.layerId,
      color: this.color,
      lineweight: this.lineweight,
      linetype: this.linetype,
      filled: this.filled
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
      center: this.center,
      radius: this.radius,
      layerId: this.layerId,
      color: this.color,
      lineweight: this.lineweight,
      linetype: this.linetype,
      filled: this.filled
    };
  }

  /**
   * Create from serializable object
   * @param {Object} data - Serialized data
   * @returns {Circle} Circle instance
   */
  static fromJSON(data) {
    return new Circle(data.center, data.radius, {
      id: data.id,
      layerId: data.layerId,
      color: data.color,
      lineweight: data.lineweight,
      linetype: data.linetype,
      filled: data.filled
    });
  }
}

export default Circle;
