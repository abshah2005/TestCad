import useCADStore from '../../app/store';

/**
 * Snapping Engine - Provides AutoCAD-like snap functionality
 * Handles endpoint, midpoint, center, intersection, and other snap types
 */
export class SnapEngine {
  constructor() {
    this.snapTolerance = 10; // pixels
    this.snapTypes = {
      endpoint: true,
      midpoint: true,
      center: true,
      intersection: true,
      perpendicular: true,
      tangent: true,
      nearest: true,
      grid: false
    };
  }

  /**
   * Find the best snap point for given mouse position
   * @param {Object} mousePos - Screen coordinates {x, y}
   * @param {Object} viewport - Viewport for coordinate transformation
   * @returns {Object|null} Snap result {point, type, entity, visual}
   */
  findSnapPoint(mousePos, viewport) {
    const store = useCADStore.getState();
    const snapSettings = store.snap;
    
    if (!snapSettings.enabled) return null;

    const worldPos = viewport.toWorld(mousePos);
    const candidates = [];

    // Get entities near mouse position
    const nearbyEntities = this.getNearbyEntities(worldPos, viewport);

    for (const entity of nearbyEntities) {
      if (snapSettings.endpoint) {
        candidates.push(...this.getEndpoints(entity));
      }
      if (snapSettings.midpoint) {
        candidates.push(...this.getMidpoints(entity));
      }
      if (snapSettings.center) {
        candidates.push(...this.getCenters(entity));
      }
      if (snapSettings.nearest) {
        candidates.push(...this.getNearestPoints(entity, worldPos));
      }
    }

    // Handle intersections (requires multiple entities)
    if (snapSettings.intersection) {
      candidates.push(...this.getIntersections(nearbyEntities, worldPos));
    }

    // Find closest candidate within tolerance
    let bestSnap = null;
    let minDistance = Infinity;

    for (const candidate of candidates) {
      const screenPoint = viewport.toScreen(candidate.point);
      const distance = Math.sqrt(
        Math.pow(screenPoint.x - mousePos.x, 2) + 
        Math.pow(screenPoint.y - mousePos.y, 2)
      );

      if (distance < this.snapTolerance && distance < minDistance) {
        minDistance = distance;
        bestSnap = candidate;
      }
    }

    return bestSnap;
  }

  /**
   * Get entities near the given world position
   */
  getNearbyEntities(worldPos, viewport) {
    const store = useCADStore.getState();
    const tolerance = this.snapTolerance / viewport.scale;
    
    const bounds = {
      minX: worldPos.x - tolerance,
      minY: worldPos.y - tolerance,
      maxX: worldPos.x + tolerance,
      maxY: worldPos.y + tolerance
    };

    return store.queryEntities(bounds);
  }

  /**
   * Get endpoint snap points for an entity
   */
  getEndpoints(entity) {
    const points = [];
    
    switch (entity.type) {
      case 'line':
        points.push(
          { 
            point: entity.start, 
            type: 'endpoint', 
            entity: entity.id,
            visual: { type: 'square', size: 8 }
          },
          { 
            point: entity.end, 
            type: 'endpoint', 
            entity: entity.id,
            visual: { type: 'square', size: 8 }
          }
        );
        break;
        
      case 'arc':
        const startPoint = entity.getStartPoint();
        const endPoint = entity.getEndPoint();
        points.push(
          { 
            point: startPoint, 
            type: 'endpoint', 
            entity: entity.id,
            visual: { type: 'square', size: 8 }
          },
          { 
            point: endPoint, 
            type: 'endpoint', 
            entity: entity.id,
            visual: { type: 'square', size: 8 }
          }
        );
        break;
        
      case 'polyline':
        if (entity.vertices) {
          entity.vertices.forEach((vertex, index) => {
            points.push({
              point: vertex,
              type: 'endpoint',
              entity: entity.id,
              visual: { type: 'square', size: 8 }
            });
          });
        }
        break;
    }
    
    return points;
  }

  /**
   * Get midpoint snap points for an entity
   */
  getMidpoints(entity) {
    const points = [];
    
    switch (entity.type) {
      case 'line':
        const midpoint = {
          x: (entity.start.x + entity.end.x) / 2,
          y: (entity.start.y + entity.end.y) / 2
        };
        points.push({
          point: midpoint,
          type: 'midpoint',
          entity: entity.id,
          visual: { type: 'triangle', size: 8 }
        });
        break;
        
      case 'arc':
        const midPoint = entity.getMidPoint();
        points.push({
          point: midPoint,
          type: 'midpoint',
          entity: entity.id,
          visual: { type: 'triangle', size: 8 }
        });
        break;
        
      case 'polyline':
        if (entity.vertices && entity.vertices.length > 1) {
          for (let i = 0; i < entity.vertices.length - 1; i++) {
            const start = entity.vertices[i];
            const end = entity.vertices[i + 1];
            const midpoint = {
              x: (start.x + end.x) / 2,
              y: (start.y + end.y) / 2
            };
            points.push({
              point: midpoint,
              type: 'midpoint',
              entity: entity.id,
              visual: { type: 'triangle', size: 8 }
            });
          }
        }
        break;
    }
    
    return points;
  }

  /**
   * Get center snap points for an entity
   */
  getCenters(entity) {
    const points = [];
    
    switch (entity.type) {
      case 'circle':
        points.push({
          point: entity.center,
          type: 'center',
          entity: entity.id,
          visual: { type: 'circle', size: 10 }
        });
        break;
        
      case 'arc':
        points.push({
          point: entity.center,
          type: 'center',
          entity: entity.id,
          visual: { type: 'circle', size: 10 }
        });
        break;
        
      case 'rectangle':
        const center = entity.getCenter();
        points.push({
          point: center,
          type: 'center',
          entity: entity.id,
          visual: { type: 'circle', size: 10 }
        });
        break;
    }
    
    return points;
  }

  /**
   * Get nearest point on entity to given position
   */
  getNearestPoints(entity, worldPos) {
    const points = [];
    
    switch (entity.type) {
      case 'line':
        const nearest = this.nearestPointOnLine(
          entity.start, 
          entity.end, 
          worldPos
        );
        points.push({
          point: nearest,
          type: 'nearest',
          entity: entity.id,
          visual: { type: 'x', size: 6 }
        });
        break;
        
      case 'circle':
        const nearestOnCircle = this.nearestPointOnCircle(
          entity.center,
          entity.radius,
          worldPos
        );
        points.push({
          point: nearestOnCircle,
          type: 'nearest',
          entity: entity.id,
          visual: { type: 'x', size: 6 }
        });
        break;
    }
    
    return points;
  }

  /**
   * Get intersection points between entities
   */
  getIntersections(entities, worldPos) {
    const points = [];
    
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const intersections = this.findIntersection(entities[i], entities[j]);
        for (const intersection of intersections) {
          // Only include intersections near the mouse
          const distance = Math.sqrt(
            Math.pow(intersection.x - worldPos.x, 2) + 
            Math.pow(intersection.y - worldPos.y, 2)
          );
          
          if (distance < 50) { // World units tolerance for intersections
            points.push({
              point: intersection,
              type: 'intersection',
              entity: `${entities[i].id}_${entities[j].id}`,
              visual: { type: 'cross', size: 10 }
            });
          }
        }
      }
    }
    
    return points;
  }

  /**
   * Find nearest point on line segment
   */
  nearestPointOnLine(start, end, point) {
    const A = point.x - start.x;
    const B = point.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return start; // Line is a point
    
    let param = dot / lenSq;
    
    // Clamp to line segment
    param = Math.max(0, Math.min(1, param));
    
    return {
      x: start.x + param * C,
      y: start.y + param * D
    };
  }

  /**
   * Find nearest point on circle
   */
  nearestPointOnCircle(center, radius, point) {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return { x: center.x + radius, y: center.y };
    
    const ratio = radius / distance;
    return {
      x: center.x + dx * ratio,
      y: center.y + dy * ratio
    };
  }

  /**
   * Find intersections between two entities
   */
  findIntersection(entity1, entity2) {
    // Line-Line intersection
    if (entity1.type === 'line' && entity2.type === 'line') {
      return this.lineLineIntersection(entity1, entity2);
    }
    
    // Circle-Line intersection
    if ((entity1.type === 'circle' && entity2.type === 'line') ||
        (entity1.type === 'line' && entity2.type === 'circle')) {
      const circle = entity1.type === 'circle' ? entity1 : entity2;
      const line = entity1.type === 'line' ? entity1 : entity2;
      return this.circleLineIntersection(circle, line);
    }
    
    // Circle-Circle intersection
    if (entity1.type === 'circle' && entity2.type === 'circle') {
      return this.circleCircleIntersection(entity1, entity2);
    }
    
    return [];
  }

  /**
   * Line-Line intersection
   */
  lineLineIntersection(line1, line2) {
    const x1 = line1.start.x, y1 = line1.start.y;
    const x2 = line1.end.x, y2 = line1.end.y;
    const x3 = line2.start.x, y3 = line2.start.y;
    const x4 = line2.end.x, y4 = line2.end.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return []; // Parallel lines

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    // Check if intersection is within line segments
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return [{
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      }];
    }

    return [];
  }

  /**
   * Circle-Line intersection
   */
  circleLineIntersection(circle, line) {
    const cx = circle.center.x, cy = circle.center.y, r = circle.radius;
    const x1 = line.start.x, y1 = line.start.y;
    const x2 = line.end.x, y2 = line.end.y;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - cx;
    const fy = y1 - cy;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return [];

    const sqrtDisc = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);

    const intersections = [];
    
    if (t1 >= 0 && t1 <= 1) {
      intersections.push({
        x: x1 + t1 * dx,
        y: y1 + t1 * dy
      });
    }
    
    if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 1e-10) {
      intersections.push({
        x: x1 + t2 * dx,
        y: y1 + t2 * dy
      });
    }

    return intersections;
  }

  /**
   * Circle-Circle intersection
   */
  circleCircleIntersection(circle1, circle2) {
    const x1 = circle1.center.x, y1 = circle1.center.y, r1 = circle1.radius;
    const x2 = circle2.center.x, y2 = circle2.center.y, r2 = circle2.radius;

    const d = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    
    // No intersection cases
    if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return [];
    
    // One intersection (tangent)
    if (d === r1 + r2 || d === Math.abs(r1 - r2)) {
      const ratio = r1 / d;
      return [{
        x: x1 + ratio * (x2 - x1),
        y: y1 + ratio * (y2 - y1)
      }];
    }

    // Two intersections
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(r1 * r1 - a * a);
    
    const px = x1 + a * (x2 - x1) / d;
    const py = y1 + a * (y2 - y1) / d;
    
    return [
      {
        x: px + h * (y2 - y1) / d,
        y: py - h * (x2 - x1) / d
      },
      {
        x: px - h * (y2 - y1) / d,
        y: py + h * (x2 - x1) / d
      }
    ];
  }

  /**
   * Apply ortho mode constraint to a point
   */
  applyOrtho(fromPoint, toPoint) {
    if (!fromPoint) return toPoint;
    
    const dx = toPoint.x - fromPoint.x;
    const dy = toPoint.y - fromPoint.y;
    
    // Determine which axis to lock to based on larger component
    if (Math.abs(dx) > Math.abs(dy)) {
      // Lock to horizontal
      return { x: toPoint.x, y: fromPoint.y };
    } else {
      // Lock to vertical
      return { x: fromPoint.x, y: toPoint.y };
    }
  }
}

// Create global snap engine instance
const snapEngine = new SnapEngine();
export default snapEngine;
