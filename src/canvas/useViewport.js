import { useState, useCallback, useRef } from 'react';

/**
 * Viewport hook for managing pan/zoom operations in world space
 * 
 * World coordinates are in double precision for CAD accuracy
 * Screen coordinates are converted at render time
 */
const useViewport = () => {
  const [scale, setScale] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });

  // Constants for zoom limits and behavior
  const MIN_SCALE = 0.001;
  const MAX_SCALE = 1000.0;
  const ZOOM_FACTOR = 1.1;

  /**
   * Convert screen coordinates to world coordinates
   * @param {Object} screenPoint - {x, y} in screen space
   * @returns {Object} Point in world space
   */
  const toWorld = useCallback((screenPoint) => {
    return {
      x: (screenPoint.x - offset.x) / scale,
      y: (screenPoint.y - offset.y) / scale
    };
  }, [scale, offset]);

  /**
   * Convert world coordinates to screen coordinates
   * @param {Object} worldPoint - {x, y} in world space
   * @returns {Object} Point in screen space
   */
  const toScreen = useCallback((worldPoint) => {
    return {
      x: worldPoint.x * scale + offset.x,
      y: worldPoint.y * scale + offset.y
    };
  }, [scale, offset]);

  /**
   * Handle mouse wheel zoom - zooms to cursor position
   * @param {WheelEvent} e - Wheel event from canvas
   */
  const onWheel = useCallback((e) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    
    // Get world point under cursor before zoom
    const worldPointBeforeZoom = toWorld(pointer);
    
    // Calculate new scale
    const scaleBy = e.evt.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * scaleBy));
    
    // Get world point under cursor after zoom
    const worldPointAfterZoom = {
      x: (pointer.x - offset.x) / newScale,
      y: (pointer.y - offset.y) / newScale
    };
    
    // Calculate offset adjustment to keep cursor point fixed
    const deltaWorld = {
      x: worldPointAfterZoom.x - worldPointBeforeZoom.x,
      y: worldPointAfterZoom.y - worldPointBeforeZoom.y
    };
    
    setScale(newScale);
    setOffset({
      x: offset.x + deltaWorld.x * newScale,
      y: offset.y + deltaWorld.y * newScale
    });
  }, [scale, offset, toWorld]);

  /**
   * Begin pan operation (typically middle mouse button)
   * @param {Object} e - Konva event
   */
  const beginPan = useCallback((e) => {
    // Middle mouse button or space+left mouse button
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.shiftKey)) {
      setIsDragging(true);
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      lastPointerPos.current = pointer;
    }
  }, []);

  /**
   * Continue pan operation
   * @param {Object} e - Konva event
   */
  const pan = useCallback((e) => {
    if (!isDragging) return;
    
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    
    const dx = pointer.x - lastPointerPos.current.x;
    const dy = pointer.y - lastPointerPos.current.y;
    
    setOffset({
      x: offset.x + dx,
      y: offset.y + dy
    });
    
    lastPointerPos.current = pointer;
  }, [isDragging, offset]);

  /**
   * End pan operation
   */
  const endPan = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Fit viewport to show specific world bounds
   * @param {Object} bounds - {minX, minY, maxX, maxY} in world coordinates
   * @param {Object} stageSize - {width, height} of stage in pixels
   * @param {number} padding - Padding factor (default 0.1 = 10% border)
   */
  const fitToBounds = useCallback((bounds, stageSize, padding = 0.1) => {
    const worldWidth = bounds.maxX - bounds.minX;
    const worldHeight = bounds.maxY - bounds.minY;
    
    if (worldWidth === 0 || worldHeight === 0) return;
    
    // Calculate scale to fit with padding
    const scaleX = (stageSize.width * (1 - padding * 2)) / worldWidth;
    const scaleY = (stageSize.height * (1 - padding * 2)) / worldHeight;
    const newScale = Math.min(scaleX, scaleY);
    
    // Center the bounds
    const worldCenterX = (bounds.minX + bounds.maxX) / 2;
    const worldCenterY = (bounds.minY + bounds.maxY) / 2;
    
    const newOffset = {
      x: stageSize.width / 2 - worldCenterX * newScale,
      y: stageSize.height / 2 - worldCenterY * newScale
    };
    
    setScale(newScale);
    setOffset(newOffset);
  }, []);

  return {
    scale,
    offset,
    isDragging,
    toWorld,
    toScreen,
    onWheel,
    beginPan,
    pan,
    endPan,
    fitToBounds
  };
};

export default useViewport;
