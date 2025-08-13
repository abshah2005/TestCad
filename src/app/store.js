import { create } from 'zustand';
import { produce } from 'immer';
import RBush from 'rbush';
import { v4 as uuidv4 } from 'uuid';
import { enableMapSet } from 'immer';

enableMapSet();
/**
 * Main CAD application store using Zustand
 * Manages entities, layers, selection, and spatial indexing
 */
const useCADStore = create((set, get) => {
  // Spatial index for fast queries (snapping, hit testing)
  const spatialIndex = new RBush();

  return {
    // Core data
    entities: new Map(),
    layers: new Map([
      ['0', { id: '0', name: 'Layer 0', visible: true, locked: false, color: '#ffffff' }]
    ]),
    selection: new Set(),
    
    // UI state
    currentLayer: '0',
    snap: {
      enabled: true,
      endpoint: true,
      midpoint: true,
      center: true,
      intersection: true,
      perpendicular: true,
      tangent: true,
      nearest: true,
      grid: false
    },
    ortho: false,
    polar: false,
    
    // Drawing state
    currentCommand: null,
    commandState: {},
    
    // Viewport state
    viewport: {
      scale: 1.0,
      offset: { x: 0, y: 0 }
    },

    /**
     * Add a new entity to the drawing
     * @param {Object} entity - Entity to add
     */
    addEntity: (entity) => set(produce((draft) => {
      const id = entity.id || uuidv4();
      const newEntity = { ...entity, id };
      draft.entities.set(id, newEntity);
      
      // Add to spatial index
      const bbox = get().getEntityBounds(newEntity);
      if (bbox) {
        spatialIndex.insert({
          minX: bbox.minX,
          minY: bbox.minY,
          maxX: bbox.maxX,
          maxY: bbox.maxY,
          entityId: id
        });
      }
    })),

    /**
     * Update an existing entity
     * @param {string} id - Entity ID
     * @param {Object} updates - Properties to update
     */
    updateEntity: (id, updates) => set(produce((draft) => {
      if (draft.entities.has(id)) {
        // Remove from spatial index
        spatialIndex.remove(spatialIndex.all().find(item => item.entityId === id));
        
        // Update entity
        const entity = draft.entities.get(id);
        Object.assign(entity, updates);
        
        // Re-add to spatial index
        const bbox = get().getEntityBounds(entity);
        if (bbox) {
          spatialIndex.insert({
            minX: bbox.minX,
            minY: bbox.minY,
            maxX: bbox.maxX,
            maxY: bbox.maxY,
            entityId: id
          });
        }
      }
    })),

    /**
     * Remove an entity
     * @param {string} id - Entity ID to remove
     */
    removeEntity: (id) => set(produce((draft) => {
      if (draft.entities.has(id)) {
        // Remove from spatial index
        const item = spatialIndex.all().find(item => item.entityId === id);
        if (item) spatialIndex.remove(item);
        
        // Remove from entities and selection
        draft.entities.delete(id);
        draft.selection.delete(id);
      }
    })),

    /**
     * Clear selection
     */
    clearSelection: () => set(produce((draft) => {
      draft.selection.clear();
    })),

    /**
     * Add entities to selection
     * @param {string[]} ids - Entity IDs to select
     */
    addToSelection: (ids) => set(produce((draft) => {
      ids.forEach(id => {
        if (draft.entities.has(id)) {
          draft.selection.add(id);
        }
      });
    })),

    /**
     * Remove entities from selection
     * @param {string[]} ids - Entity IDs to deselect
     */
    removeFromSelection: (ids) => set(produce((draft) => {
      ids.forEach(id => draft.selection.delete(id));
    })),

    /**
     * Set selection (replace current selection)
     * @param {string[]} ids - Entity IDs to select
     */
    setSelection: (ids) => set(produce((draft) => {
      draft.selection.clear();
      ids.forEach(id => {
        if (draft.entities.has(id)) {
          draft.selection.add(id);
        }
      });
    })),

    /**
     * Add a new layer
     * @param {Object} layer - Layer properties
     */
    addLayer: (layer) => set(produce((draft) => {
      const id = layer.id || uuidv4();
      draft.layers.set(id, { ...layer, id });
    })),

    /**
     * Update layer properties
     * @param {string} id - Layer ID
     * @param {Object} updates - Properties to update
     */
    updateLayer: (id, updates) => set(produce((draft) => {
      if (draft.layers.has(id)) {
        Object.assign(draft.layers.get(id), updates);
      }
    })),

    /**
     * Remove a layer (moves entities to layer 0)
     * @param {string} id - Layer ID to remove
     */
    removeLayer: (id) => set(produce((draft) => {
      if (id === '0') return; // Cannot remove layer 0
      
      // Move entities to layer 0
      draft.entities.forEach((entity) => {
        if (entity.layerId === id) {
          entity.layerId = '0';
        }
      });
      
      draft.layers.delete(id);
      
      // Reset current layer if it was deleted
      if (draft.currentLayer === id) {
        draft.currentLayer = '0';
      }
    })),

    /**
     * Set current layer
     * @param {string} layerId - Layer ID to make current
     */
    setCurrentLayer: (layerId) => set(produce((draft) => {
      if (draft.layers.has(layerId)) {
        draft.currentLayer = layerId;
      }
    })),

    /**
     * Toggle snap setting
     * @param {string} snapType - Type of snap to toggle
     */
    toggleSnap: (snapType) => set(produce((draft) => {
      if (snapType in draft.snap) {
        draft.snap[snapType] = !draft.snap[snapType];
      }
    })),

    /**
     * Toggle ortho mode
     */
    toggleOrtho: () => set(produce((draft) => {
      draft.ortho = !draft.ortho;
    })),

    /**
     * Toggle polar tracking
     */
    togglePolar: () => set(produce((draft) => {
      draft.polar = !draft.polar;
    })),

    /**
     * Set current command
     * @param {string} command - Command name
     * @param {Object} state - Initial command state
     */
    setCommand: (command, state = {}) => set(produce((draft) => {
      draft.currentCommand = command;
      draft.commandState = state;
    })),

    /**
     * Clear current command
     */
    clearCommand: () => set(produce((draft) => {
      draft.currentCommand = null;
      draft.commandState = {};
    })),

    /**
     * Update command state
     * @param {Object} updates - State updates
     */
    updateCommandState: (updates) => set(produce((draft) => {
      Object.assign(draft.commandState, updates);
    })),

    /**
     * Query spatial index for entities in bounds
     * @param {Object} bounds - {minX, minY, maxX, maxY}
     * @returns {Array} Array of entity IDs
     */
    queryByBounds: (bounds) => {
      return spatialIndex.search(bounds).map(item => item.entityId);
    },

    /**
     * Get bounding box for an entity
     * @param {Object} entity - Entity to get bounds for
     * @returns {Object} Bounds {minX, minY, maxX, maxY}
     */
    getEntityBounds: (entity) => {
      // TODO: Implement bounds calculation for each entity type
      switch (entity.type) {
        case 'line':
          return {
            minX: Math.min(entity.start.x, entity.end.x),
            minY: Math.min(entity.start.y, entity.end.y),
            maxX: Math.max(entity.start.x, entity.end.x),
            maxY: Math.max(entity.start.y, entity.end.y)
          };
        
        case 'circle':
          return {
            minX: entity.center.x - entity.radius,
            minY: entity.center.y - entity.radius,
            maxX: entity.center.x + entity.radius,
            maxY: entity.center.y + entity.radius
          };
        
        // TODO: Add other entity types
        default:
          return null;
      }
    },

    /**
     * Rebuild spatial index (use after bulk operations)
     */
    rebuildSpatialIndex: () => {
      spatialIndex.clear();
      const { entities } = get();
      
      entities.forEach((entity, id) => {
        const bbox = get().getEntityBounds(entity);
        if (bbox) {
          spatialIndex.insert({
            minX: bbox.minX,
            minY: bbox.minY,
            maxX: bbox.maxX,
            maxY: bbox.maxY,
            entityId: id
          });
        }
      });
    },

    // Getter for spatial index (for advanced queries)
    getSpatialIndex: () => spatialIndex
  };
});

export default useCADStore;
