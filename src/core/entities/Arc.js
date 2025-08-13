import { v4 as uuidv4 } from 'uuid';

/**
 * Arc entity class
 */
export class Arc {
  constructor(center, radius, startAngle, endAngle, options = {}) {
    this.id = options.id || uuidv4();
    this.type = 'arc';
    this.center = { ...center };
    this.radius = radius;
    this.startAngle = startAngle; // in radians
    this.endAngle = endAngle;     // in radians
    this.layerId = options.layerId || '0';
    this.color = options.color || null;
    this.lineweight = options.lineweight || 1;
    this.linetype = options.linetype || 'continuous';
  }

  /**
   * Get the arc length
   * @returns {number} Arc length
   */
  getLength() {
    const angle = this.getAngleSpan();
    return this.radius * angle;
  }

  /**
   * Get the angle span of the arc
   * @returns {number} Angle span in radians
   */
  getAngleSpan() {
    let span = this.endAngle - this.startAngle;
    if (span < 0) {
      span += 2 * Math.PI;
    }
    return span;
  }

  /**
   * Get start point of arc
   * @returns {Object} Start point {x, y}
   */
  getStartPoint() {
    return {
      x: this.center.x + this.radius * Math.cos(this.startAngle),
      y: this.center.y + this.radius * Math.sin(this.startAngle)
    };
  }

  /**
   * Get end point of arc
   * @returns {Object} End point {x, y}
   */
  getEndPoint() {
    return {
      x: this.center.x + this.radius * Math.cos(this.endAngle),
      y: this.center.y + this.radius * Math.sin(this.endAngle)
    };
  }

  /**
   * Get midpoint of arc
   * @returns {Object} Mid point {x, y}
   */
  getMidPoint() {
    const midAngle = this.startAngle + this.getAngleSpan() / 2;
    return {
      x: this.center.x + this.radius * Math.cos(midAngle),
      y: this.center.y + this.radius * Math.sin(midAngle)
    };
  }

  /**
   * Get bounding box
   * @returns {Object} Bounds {minX, minY, maxX, maxY}
   */
  getBounds() {
    const startPoint = this.getStartPoint();
    const endPoint = this.getEndPoint();
    
    let minX = Math.min(startPoint.x, endPoint.x);
    let minY = Math.min(startPoint.y, endPoint.y);
    let maxX = Math.max(startPoint.x, endPoint.x);
    let maxY = Math.max(startPoint.y, endPoint.y);

    // Check if arc crosses any axis extremes
    const angles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
    
    for (const angle of angles) {
      if (this.containsAngle(angle)) {
        const x = this.center.x + this.radius * Math.cos(angle);
        const y = this.center.y + this.radius * Math.sin(angle);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Check if angle is within arc span
   * @param {number} angle - Angle in radians
   * @returns {boolean} True if angle is within arc
   */
  containsAngle(angle) {
    // Normalize angles to 0-2π range
    const normalizeAngle = (a) => {
      while (a < 0) a += 2 * Math.PI;
      while (a >= 2 * Math.PI) a -= 2 * Math.PI;
      return a;
    };

    const normStart = normalizeAngle(this.startAngle);
    const normEnd = normalizeAngle(this.endAngle);
    const normAngle = normalizeAngle(angle);

    if (normStart <= normEnd) {
      return normAngle >= normStart && normAngle <= normEnd;
    } else {
      return normAngle >= normStart || normAngle <= normEnd;
    }
  }

  /**
   * Move arc by offset
   * @param {Object} offset - Offset {x, y}
   * @returns {Arc} New arc
   */
  move(offset) {
    return new Arc(
      { x: this.center.x + offset.x, y: this.center.y + offset.y },
      this.radius,
      this.startAngle,
      this.endAngle,
      { 
        layerId: this.layerId, 
        color: this.color, 
        lineweight: this.lineweight,
        linetype: this.linetype 
      }
    );
  }

  /**
   * Scale arc by factor
   * @param {number} factor - Scale factor
   * @param {Object} origin - Origin point for scaling
   * @returns {Arc} New arc
   */
  scale(factor, origin = { x: 0, y: 0 }) {
    const newCenter = {
      x: origin.x + (this.center.x - origin.x) * factor,
      y: origin.y + (this.center.y - origin.y) * factor
    };

    return new Arc(
      newCenter,
      this.radius * factor,
      this.startAngle,
      this.endAngle,
      { 
        layerId: this.layerId, 
        color: this.color, 
        lineweight: this.lineweight,
        linetype: this.linetype 
      }
    );
  }

  /**
   * Create copy of arc
   * @returns {Arc} New arc copy
   */
  clone() {
    return new Arc(
      this.center, 
      this.radius, 
      this.startAngle, 
      this.endAngle, 
      {
        layerId: this.layerId,
        color: this.color,
        lineweight: this.lineweight,
        linetype: this.linetype
      }
    );
  }
}

export default Arc;
