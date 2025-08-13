import React from 'react';
import useCADStore from '../app/store';

/**
 * Status bar showing cursor coordinates and mode indicators
 */
const StatusBar = ({ mousePosition }) => {
  const ortho = useCADStore(state => state.ortho);
  const polar = useCADStore(state => state.polar);
  const snap = useCADStore(state => state.snap);
  const selection = useCADStore(state => state.selection);
  const entities = useCADStore(state => state.entities);
  const commandState = useCADStore(state => state.commandState);
  const currentCommand = useCADStore(state => state.currentCommand);

  const formatCoordinate = (value) => {
    return value.toFixed(4);
  };

  const StatusIndicator = ({ label, isActive, className = '' }) => (
    <div className={`
      px-2 py-1 text-xs font-medium border rounded
      ${isActive 
        ? 'bg-green-700 text-white border-green-600' 
        : 'bg-gray-800 text-gray-400 border-gray-600'
      } ${className}
    `}>
      {label}
    </div>
  );

  return (
    <div className="bg-gray-900 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm">
      {/* Left side - Coordinates */}
      <div className="flex items-center gap-4">
        <div className="font-mono text-gray-300">
          <span className="text-gray-500">X:</span> {formatCoordinate(mousePosition?.x || 0)}
          <span className="text-gray-500 ml-3">Y:</span> {formatCoordinate(mousePosition?.y || 0)}
        </div>
        
        {/* Selection info */}
        <div className="text-gray-400">
          {selection.size > 0 && (
            <span>{selection.size} selected</span>
          )}
        </div>
      </div>

      {/* Center - Drawing info and snap status */}
      <div className="flex items-center gap-4 text-gray-400">
        <span>{entities.size} entities</span>
        
        {/* Current snap indicator */}
        {commandState.snapPoint && (
          <div className="text-yellow-400 font-medium">
            Snap: {commandState.snapPoint.type.toUpperCase()}
          </div>
        )}
        
        {/* Ortho indicator */}
        {ortho && currentCommand && (
          <div className="text-blue-400 font-medium">
            ORTHO
          </div>
        )}
        
        {/* Current command prompt */}
        {commandState.prompt && (
          <div className="text-cyan-400 font-medium">
            {commandState.prompt}
          </div>
        )}
      </div>

      {/* Right side - Mode indicators */}
      <div className="flex items-center gap-2">
        <StatusIndicator label="ORTHO" isActive={ortho} />
        <StatusIndicator label="POLAR" isActive={polar} />
        <StatusIndicator label="SNAP" isActive={snap.enabled} />
        
        {snap.enabled && (
          <div className="flex gap-1">
            <StatusIndicator label="END" isActive={snap.endpoint} />
            <StatusIndicator label="MID" isActive={snap.midpoint} />
            <StatusIndicator label="CEN" isActive={snap.center} />
            <StatusIndicator label="INT" isActive={snap.intersection} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
