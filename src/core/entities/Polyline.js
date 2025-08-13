import { v4 as uuidv4 } from 'uuid';

/**
 * Polyline entity class
 */
export class Polyline {
  constructor(vertices, options = {}) {
    this.id = options.id || uuidv4();
    this.type = 'polyline';
    this.vertices = vertices.map(v => ({ ...v })); // Deep copy vertices
    this.layerId = options.layerId || '0';
    this.color = options.color || null;
    this.lineweight = options.lineweight || 1;
    this.linetype = options.linetype || 'continuous';
    this.closed = options.closed || false;
  }

  /**
   * Get the total length of the polyline
   * @returns {number} Total length
   */
  getLength() {
    let totalLength = 0;
    
    for (let i = 0; i < this.vertices.length - 1; i++) {
      const dx = this.vertices[i + 1].x - this.vertices[i].x;
      const dy = this.vertices[i + 1].y - this.vertices[i].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }

    // Add closing segment if closed
    if (this.closed && this.vertices.length > 2) {
      const first = this.vertices[0];
      const last = this.vertices[this.vertices.length - 1];
      const dx = first.x - last.x;
      const dy = first.y - last.y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }

    return totalLength;
  }

  /**
   * Get the number of vertices
   * @returns {number} Number of vertices
   */
  getVertexCount() {
    return this.vertices.length;
  }

  /**
   * Add a vertex to the polyline
   * @param {Object} vertex - Vertex point {x, y}
   */
  addVertex(vertex) {
    this.vertices.push({ ...vertex });
  }

  /**
   * Remove the last vertex
   * @returns {Object|null} Removed vertex or null if empty
   */
  removeLastVertex() {
    return this.vertices.pop() || null;
  }

  /**
   * Get a specific vertex
   * @param {number} index - Vertex index
   * @returns {Object|null} Vertex point or null if invalid index
   */
  getVertex(index) {
    return (index >= 0 && index < this.vertices.length) ? 
           { ...this.vertices[index] } : null;
  }

  /**
   * Set a specific vertex
   * @param {number} index - Vertex index
   * @param {Object} vertex - New vertex point {x, y}
   * @returns {boolean} True if successful
   */
  setVertex(index, vertex) {
    if (index >= 0 && index < this.vertices.length) {
      this.vertices[index] = { ...vertex };
      return true;
    }
    return false;
  }

  /**
   * Get bounding box
   * @returns {Object} Bounds {minX, minY, maxX, maxY}
   */
  getBounds() {
    if (this.vertices.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = this.vertices[0].x;
    let minY = this.vertices[0].y;
    let maxX = this.vertices[0].x;
    let maxY = this.vertices[0].y;

    for (let i = 1; i < this.vertices.length; i++) {
      const vertex = this.vertices[i];
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Close the polyline
   */
  close() {
    this.closed = true;
  }

  /**
   * Open the polyline
   */
  open() {
    this.closed = false;
  }

  /**
   * Check if polyline is closed
   * @returns {boolean} True if closed
   */
  isClosed() {
    return this.closed;
  }

  /**
   * Get all line segments
   * @returns {Array} Array of line segments [{start, end}, ...]
   */
  getSegments() {
    const segments = [];
    
    for (let i = 0; i < this.vertices.length - 1; i++) {
      segments.push({
        start: { ...this.vertices[i] },
        end: { ...this.vertices[i + 1] }
      });
    }

    // Add closing segment if closed
    if (this.closed && this.vertices.length > 2) {
      segments.push({
        start: { ...this.vertices[this.vertices.length - 1] },
        end: { ...this.vertices[0] }
      });
    }

    return segments;
  }

  /**
   * Move polyline by offset
   * @param {Object} offset - Offset {x, y}
   * @returns {Polyline} New polyline
   */
  move(offset) {
    const newVertices = this.vertices.map(vertex => ({
      x: vertex.x + offset.x,
      y: vertex.y + offset.y
    }));

    return new Polyline(newVertices, {
      layerId: this.layerId,
      color: this.color,
      lineweight: this.lineweight,
      linetype: this.linetype,
      closed: this.closed
    });
  }

  /**
   * Scale polyline by factor
   * @param {number} factor - Scale factor
   * @param {Object} origin - Origin point for scaling
   * @returns {Polyline} New polyline
   */
  scale(factor, origin = { x: 0, y: 0 }) {
    const newVertices = this.vertices.map(vertex => ({
      x: origin.x + (vertex.x - origin.x) * factor,
      y: origin.y + (vertex.y - origin.y) * factor
    }));

    return new Polyline(newVertices, {
      layerId: this.layerId,
      color: this.color,
      lineweight: this.lineweight,
      linetype: this.linetype,
      closed: this.closed
    });
  }

  /**
   * Create copy of polyline
   * @returns {Polyline} New polyline copy
   */
  clone() {
    return new Polyline(this.vertices, {
      layerId: this.layerId,
      color: this.color,
      lineweight: this.lineweight,
      linetype: this.linetype,
      closed: this.closed
    });
  }
}

export default Polyline;
