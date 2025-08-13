import { v4 as uuidv4 } from 'uuid';

/**
 * Rectangle entity class
 */
export class Rectangle {
  constructor(corner1, corner2, options = {}) {
    this.id = options.id || uuidv4();
    this.type = 'rectangle';
    this.corner1 = { ...corner1 };
    this.corner2 = { ...corner2 };
    this.layerId = options.layerId || '0';
    this.color = options.color || null;
    this.lineweight = options.lineweight || 1;
    this.linetype = options.linetype || 'continuous';
    this.filled = options.filled || false;
  }

  /**
   * Get the width of the rectangle
   * @returns {number} Width
   */
  getWidth() {
    return Math.abs(this.corner2.x - this.corner1.x);
  }

  /**
   * Get the height of the rectangle
   * @returns {number} Height
   */
  getHeight() {
    return Math.abs(this.corner2.y - this.corner1.y);
  }

  /**
   * Get the area of the rectangle
   * @returns {number} Area
   */
  getArea() {
    return this.getWidth() * this.getHeight();
  }

  /**
   * Get the perimeter of the rectangle
   * @returns {number} Perimeter
   */
  getPerimeter() {
    return 2 * (this.getWidth() + this.getHeight());
  }

  /**
   * Get bounding box
   * @returns {Object} Bounds {minX, minY, maxX, maxY}
   */
  getBounds() {
    return {
      minX: Math.min(this.corner1.x, this.corner2.x),
      minY: Math.min(this.corner1.y, this.corner2.y),
      maxX: Math.max(this.corner1.x, this.corner2.x),
      maxY: Math.max(this.corner1.y, this.corner2.y)
    };
  }

  /**
   * Get all four corner points
   * @returns {Array} Array of corner points
   */
  getCorners() {
    const bounds = this.getBounds();
    return [
      { x: bounds.minX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.maxY },
      { x: bounds.minX, y: bounds.maxY }
    ];
  }

  /**
   * Check if point is inside rectangle
   * @param {Object} point - Point {x, y}
   * @returns {boolean} True if inside
   */
  containsPoint(point) {
    const bounds = this.getBounds();
    return point.x >= bounds.minX && point.x <= bounds.maxX &&
           point.y >= bounds.minY && point.y <= bounds.maxY;
  }

  /**
   * Get center point
   * @returns {Object} Center point {x, y}
   */
  getCenter() {
    return {
      x: (this.corner1.x + this.corner2.x) / 2,
      y: (this.corner1.y + this.corner2.y) / 2
    };
  }

  /**
   * Move rectangle by offset
   * @param {Object} offset - Offset {x, y}
   * @returns {Rectangle} New rectangle
   */
  move(offset) {
    return new Rectangle(
      { x: this.corner1.x + offset.x, y: this.corner1.y + offset.y },
      { x: this.corner2.x + offset.x, y: this.corner2.y + offset.y },
      { 
        layerId: this.layerId, 
        color: this.color, 
        lineweight: this.lineweight,
        linetype: this.linetype,
        filled: this.filled 
      }
    );
  }

  /**
   * Scale rectangle by factor
   * @param {number} factor - Scale factor
   * @param {Object} origin - Origin point for scaling
   * @returns {Rectangle} New rectangle
   */
  scale(factor, origin = { x: 0, y: 0 }) {
    const scalePoint = (point) => ({
      x: origin.x + (point.x - origin.x) * factor,
      y: origin.y + (point.y - origin.y) * factor
    });

    return new Rectangle(
      scalePoint(this.corner1),
      scalePoint(this.corner2),
      { 
        layerId: this.layerId, 
        color: this.color, 
        lineweight: this.lineweight,
        linetype: this.linetype,
        filled: this.filled 
      }
    );
  }

  /**
   * Create copy of rectangle
   * @returns {Rectangle} New rectangle copy
   */
  clone() {
    return new Rectangle(this.corner1, this.corner2, {
      layerId: this.layerId,
      color: this.color,
      lineweight: this.lineweight,
      linetype: this.linetype,
      filled: this.filled
    });
  }
}

export default Rectangle;
