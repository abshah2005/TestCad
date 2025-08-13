import React, { useState, useEffect } from 'react';
import CadCanvas from './canvas/CadCanvas';
import Toolbar from './ui/Toolbar';
import CommandBar from './ui/CommandBar';
import StatusBar from './ui/StatusBar';
import useCADStore from './app/store';
import commandBus from './app/commandBus';

// Import all command classes
import DrawLineCommand from './app/DrawLineCommand';
import DrawCircleCommand from './app/DrawCircleCommand';
import DrawRectangleCommand from './app/DrawRectangleCommand';
import DrawArcCommand from './app/DrawArcCommand';
import DrawPolylineCommand from './app/DrawPolylineCommand';
import MoveCommand from './app/MoveCommand';
import CopyCommand from './app/CopyCommand';
import RotateCommand from './app/RotateCommand';
import ScaleCommand from './app/ScaleCommand';
import MirrorCommand from './app/MirrorCommand';
import TrimCommand from './app/TrimCommand';
import ExtendCommand from './app/ExtendCommand';
import OffsetCommand from './app/OffsetCommand';

// Register all commands
commandBus.register('line', DrawLineCommand);
commandBus.register('circle', DrawCircleCommand);
commandBus.register('rectangle', DrawRectangleCommand);
commandBus.register('arc', DrawArcCommand);
commandBus.register('polyline', DrawPolylineCommand);
commandBus.register('move', MoveCommand);
commandBus.register('copy', CopyCommand);
commandBus.register('rotate', RotateCommand);
commandBus.register('scale', ScaleCommand);
commandBus.register('mirror', MirrorCommand);
commandBus.register('trim', TrimCommand);
commandBus.register('extend', ExtendCommand);
commandBus.register('offset', OffsetCommand);

function App() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const commandState = useCADStore(state => state.commandState);

  // Update mouse position from command state
  useEffect(() => {
    if (commandState.mousePosition) {
      setMousePosition(commandState.mousePosition);
    }
  }, [commandState.mousePosition]);

  // Add some sample entities for testing
  useEffect(() => {
    const store = useCADStore.getState();
    
    // Add sample line
    store.addEntity({
      id: 'sample-line-1',
      type: 'line',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 100 },
      layerId: '0',
      color: '#ffffff'
    });

    // Add sample circle
    store.addEntity({
      id: 'sample-circle-1',
      type: 'circle',
      center: { x: 200, y: 50 },
      radius: 50,
      layerId: '0',
      color: '#00ff00'
    });
  }, []);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Toolbar */}
      <Toolbar />
      
      {/* Main canvas area */}
      <div className="flex-1 relative overflow-hidden">
        <CadCanvas />
      </div>
      
      {/* Command bar */}
      <CommandBar />
      
      {/* Status bar */}
      <StatusBar mousePosition={mousePosition} />
    </div>
  );
}

export default App;
