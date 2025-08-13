import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import useViewport from './useViewport';
import Grid from './Grid';
import RenderEntities from './RenderEntities';
import useCADStore from '../app/store';
import commandBus from '../app/commandBus';
import snapEngine from '../core/snapping/SnapEngine';
import SnapVisual from '../core/snapping/SnapVisual';

/**
 * Main CAD Canvas component
 * Handles rendering, viewport management, and user interaction
 */
const CadCanvas = ({ width = 800, height = 600 }) => {
  const stageRef = useRef();
  const viewport = useViewport();
  const [stageSize, setStageSize] = useState({ width, height });
  const [currentSnap, setCurrentSnap] = useState(null);

  // Store references for event handling
  const currentCommand = useCADStore(state => state.currentCommand);
  const commandState = useCADStore(state => state.commandState);
  const updateCommandState = useCADStore(state => state.updateCommandState);
  const ortho = useCADStore(state => state.ortho);
  const snap = useCADStore(state => state.snap);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const container = stageRef.current?.container().parentElement;
      if (container) {
        setStageSize({
          width: container.offsetWidth,
          height: container.offsetHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mouse events for commands
  const handleStageClick = async (e) => {
    // Don't process click if we're panning
    if (viewport.isDragging) return;
    
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    let worldPoint = viewport.toWorld(pointer);

    // Apply snapping if enabled
    if (snap.enabled && currentCommand) {
      const snapResult = snapEngine.findSnapPoint(pointer, viewport);
      if (snapResult) {
        worldPoint = snapResult.point;
        console.log('Snapped to:', snapResult.type, 'at', worldPoint);
      }
    }

    // Apply ortho constraint if enabled and we have a reference point
    if (ortho && currentCommand && commandState.lastPoint) {
      worldPoint = snapEngine.applyOrtho(commandState.lastPoint, worldPoint);
    }

    console.log('Click at world coordinates:', worldPoint);

    // Send point input to current command
    if (currentCommand) {
      await commandBus.sendInput('point', worldPoint);
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    let worldPoint = viewport.toWorld(pointer);
    let snapResult = null;

    // Apply snapping if enabled
    if (snap.enabled && currentCommand) {
      snapResult = snapEngine.findSnapPoint(pointer, viewport);
      if (snapResult) {
        worldPoint = snapResult.point;
        setCurrentSnap(snapResult);
      } else {
        setCurrentSnap(null);
      }
    } else {
      setCurrentSnap(null);
    }

    // Apply ortho constraint if enabled and we have a reference point
    if (ortho && currentCommand && commandState.lastPoint) {
      worldPoint = snapEngine.applyOrtho(commandState.lastPoint, worldPoint);
    }

    // Update mouse position in store for UI display
    updateCommandState({ 
      mousePosition: worldPoint,
      screenPosition: pointer,
      snapPoint: snapResult
    });

    // Send mousemove to current command for preview updates
    if (currentCommand) {
      commandBus.sendInput('mousemove', worldPoint);
    }
  };

  const handleMouseDown = (e) => {
    // Handle pan start (middle mouse button or shift+left click)
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.shiftKey)) {
      viewport.beginPan(e);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Send key input to current command first
      if (currentCommand) {
        commandBus.sendInput('key', e.key);
      }
      
      // Handle global shortcuts
      switch (e.key) {
        case 'Escape':
          if (currentCommand) {
            commandBus.cancel();
          }
          break;
        case 'F8':
          e.preventDefault();
          useCADStore.getState().toggleOrtho();
          break;
        case 'F10':
          e.preventDefault();
          useCADStore.getState().togglePolar();
          break;
        case 'F3':
          e.preventDefault();
          useCADStore.getState().toggleSnap('enabled');
          break;
        case 'Enter':
          if (!currentCommand) {
            // Repeat last command
            commandBus.repeatLast();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentCommand]);

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onWheel={viewport.onWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          viewport.pan(e);
          handleMouseMove(e);
        }}
        onMouseUp={viewport.endPan}
        onClick={handleStageClick}
        style={{ cursor: viewport.isDragging ? 'grabbing' : 'crosshair' }}
      >
        <Layer>
          <Grid
            scale={viewport.scale}
            offset={viewport.offset}
            width={stageSize.width}
            height={stageSize.height}
            viewport={viewport}
          />
          <RenderEntities viewport={viewport} />
          
          {/* Snap visual indicator */}
          {currentSnap && (
            <SnapVisual snapPoint={currentSnap} viewport={viewport} />
          )}
        </Layer>
      </Stage>

      {/* Viewport info overlay */}
      <div className="absolute top-4 right-4 bg-gray-800 text-white p-2 rounded text-sm font-mono">
        <div>Scale: {viewport.scale.toFixed(4)}</div>
        <div>Offset: ({viewport.offset.x.toFixed(1)}, {viewport.offset.y.toFixed(1)})</div>
        {currentCommand && (
          <div className="text-yellow-400">Command: {currentCommand}</div>
        )}
      </div>
    </div>
  );
};

export default CadCanvas;
