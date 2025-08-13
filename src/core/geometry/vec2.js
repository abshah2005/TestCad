/**
 * 2D Vector utilities for CAD operations
 * All operations maintain double precision for accuracy
 */

const EPS = 1e-9;

/**
 * Create a new vector
 * @param {number} x - X component
 * @param {number} y - Y component
 * @returns {Object} Vector {x, y}
 */
export const vec2 = (x = 0, y = 0) => ({ x, y });

/**
 * Add two vectors
 * @param {Object} a - First vector
 * @param {Object} b - Second vector
 * @returns {Object} Result vector
 */
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });

/**
 * Subtract vectors (a - b)
 * @param {Object} a - First vector
 * @param {Object} b - Second vector
 * @returns {Object} Result vector
 */
export const subtract = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });

/**
 * Multiply vector by scalar
 * @param {Object} v - Vector
 * @param {number} scalar - Scalar value
 * @returns {Object} Result vector
 */
export const scale = (v, scalar) => ({ x: v.x * scalar, y: v.y * scalar });

/**
 * Calculate dot product
 * @param {Object} a - First vector
 * @param {Object} b - Second vector
 * @returns {number} Dot product
 */
export const dot = (a, b) => a.x * b.x + a.y * b.y;

/**
 * Calculate cross product (2D returns scalar)
 * @param {Object} a - First vector
 * @param {Object} b - Second vector
 * @returns {number} Cross product
 */
export const cross = (a, b) => a.x * b.y - a.y * b.x;

/**
 * Calculate vector length (magnitude)
 * @param {Object} v - Vector
 * @returns {number} Length
 */
export const length = (v) => Math.sqrt(v.x * v.x + v.y * v.y);

/**
 * Calculate squared length (faster when you don't need exact length)
 * @param {Object} v - Vector
 * @returns {number} Squared length
 */
export const lengthSquared = (v) => v.x * v.x + v.y * v.y;

/**
 * Calculate distance between two points
 * @param {Object} a - First point
 * @param {Object} b - Second point
 * @returns {number} Distance
 */
export const distance = (a, b) => length(subtract(b, a));

/**
 * Calculate squared distance (faster for comparisons)
 * @param {Object} a - First point
 * @param {Object} b - Second point
 * @returns {number} Squared distance
 */
export const distanceSquared = (a, b) => lengthSquared(subtract(b, a));

/**
 * Normalize vector to unit length
 * @param {Object} v - Vector to normalize
 * @returns {Object} Unit vector
 */
export const normalize = (v) => {
  const len = length(v);
  if (len < EPS) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
};

/**
 * Rotate vector by angle (radians)
 * @param {Object} v - Vector to rotate
 * @param {number} angle - Angle in radians
 * @returns {Object} Rotated vector
 */
export const rotate = (v, angle) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos
  };
};

/**
 * Get perpendicular vector (90° counter-clockwise)
 * @param {Object} v - Input vector
 * @returns {Object} Perpendicular vector
 */
export const perpendicular = (v) => ({ x: -v.y, y: v.x });

/**
 * Linear interpolation between two points
 * @param {Object} a - Start point
 * @param {Object} b - End point
 * @param {number} t - Parameter (0 to 1)
 * @returns {Object} Interpolated point
 */
export const lerp = (a, b, t) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t
});

/**
 * Check if two vectors are approximately equal
 * @param {Object} a - First vector
 * @param {Object} b - Second vector
 * @param {number} tolerance - Tolerance (default: EPS)
 * @returns {boolean} True if approximately equal
 */
export const equals = (a, b, tolerance = EPS) => {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
};

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Get angle of vector in radians
 * @param {Object} v - Vector
 * @returns {number} Angle in radians
 */
export const angle = (v) => Math.atan2(v.y, v.x);

/**
 * Get angle between two vectors
 * @param {Object} a - First vector
 * @param {Object} b - Second vector
 * @returns {number} Angle in radians
 */
export const angleBetween = (a, b) => {
  const dotProduct = dot(normalize(a), normalize(b));
  return Math.acos(clamp(dotProduct, -1, 1));
};

export default {
  vec2, add, subtract, scale, dot, cross, 
  length, lengthSquared, distance, distanceSquared,
  normalize, rotate, perpendicular, lerp, equals,
  clamp, angle, angleBetween, EPS
};
