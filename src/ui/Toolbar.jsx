import React from 'react';
import useCADStore from '../app/store';
import commandBus from '../app/commandBus';

/**
 * Main toolbar with drawing tools and settings
 */
const Toolbar = () => {
  const currentCommand = useCADStore(state => state.currentCommand);
  const ortho = useCADStore(state => state.ortho);
  const polar = useCADStore(state => state.polar);
  const snap = useCADStore(state => state.snap);

  const handleToolClick = async (commandName) => {
    try {
      await commandBus.run(commandName);
    } catch (error) {
      console.error('Command failed:', error);
    }
  };

  const ToolButton = ({ icon, label, command, isActive = false }) => (
    <button
      onClick={() => handleToolClick(command)}
      disabled={currentCommand === command}
      className={`
        flex flex-col items-center justify-center p-2 min-w-[60px] h-16 
        border border-gray-600 rounded text-xs font-medium
        transition-colors duration-200
        ${isActive || currentCommand === command
          ? 'bg-blue-600 text-white border-blue-500' 
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
        }
        ${currentCommand === command ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={label}
    >
      <span className="text-lg mb-1">{icon}</span>
      <span className="text-xs">{label}</span>
    </button>
  );

  const ToggleButton = ({ label, isActive, onClick, shortcut }) => (
    <button
      onClick={onClick}
      className={`
        px-3 py-1 text-xs font-medium rounded border
        transition-colors duration-200
        ${isActive
          ? 'bg-green-600 text-white border-green-500' 
          : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
        }
      `}
      title={`${label} (${shortcut})`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-gray-900 border-b border-gray-700 p-2">
      {/* Drawing Tools */}
      <div className="flex gap-1 mb-2">
        <div className="text-xs text-gray-400 font-medium py-2 pr-2">Draw:</div>
        <ToolButton icon="📏" label="Line" command="line" />
        <ToolButton icon="○" label="Circle" command="circle" />
        <ToolButton icon="◐" label="Arc" command="arc" />
        <ToolButton icon="⬜" label="Rectangle" command="rectangle" />
        <ToolButton icon="📐" label="Polyline" command="polyline" />
      </div>

      {/* Modify Tools */}
      <div className="flex gap-1 mb-2">
        <div className="text-xs text-gray-400 font-medium py-2 pr-2">Modify:</div>
        <ToolButton icon="↗️" label="Move" command="move" />
        <ToolButton icon="📋" label="Copy" command="copy" />
        <ToolButton icon="🔄" label="Rotate" command="rotate" />
        <ToolButton icon="↗️" label="Scale" command="scale" />
        <ToolButton icon="↔️" label="Mirror" command="mirror" />
        <ToolButton icon="✂️" label="Trim" command="trim" />
        <ToolButton icon="⬅️" label="Extend" command="extend" />
        <ToolButton icon="⫸" label="Offset" command="offset" />
      </div>

      {/* Mode Toggles */}
      <div className="flex gap-2 items-center">
        <div className="text-xs text-gray-400 font-medium">Modes:</div>
        <ToggleButton 
          label="ORTHO" 
          isActive={ortho}
          onClick={() => useCADStore.getState().toggleOrtho()}
          shortcut="F8"
        />
        <ToggleButton 
          label="POLAR" 
          isActive={polar}
          onClick={() => useCADStore.getState().togglePolar()}
          shortcut="F10"
        />
        <ToggleButton 
          label="SNAP" 
          isActive={snap.enabled}
          onClick={() => useCADStore.getState().toggleSnap('enabled')}
          shortcut="F3"
        />

        {/* Snap Settings */}
        {snap.enabled && (
          <div className="flex gap-1 ml-2 pl-2 border-l border-gray-600">
            <div className="text-xs text-gray-400">Snap:</div>
            <button
              onClick={() => useCADStore.getState().toggleSnap('endpoint')}
              className={`text-xs px-1 rounded ${snap.endpoint ? 'bg-green-700' : 'text-gray-500'}`}
            >
              END
            </button>
            <button
              onClick={() => useCADStore.getState().toggleSnap('midpoint')}
              className={`text-xs px-1 rounded ${snap.midpoint ? 'bg-green-700' : 'text-gray-500'}`}
            >
              MID
            </button>
            <button
              onClick={() => useCADStore.getState().toggleSnap('center')}
              className={`text-xs px-1 rounded ${snap.center ? 'bg-green-700' : 'text-gray-500'}`}
            >
              CEN
            </button>
            <button
              onClick={() => useCADStore.getState().toggleSnap('intersection')}
              className={`text-xs px-1 rounded ${snap.intersection ? 'bg-green-700' : 'text-gray-500'}`}
            >
              INT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
