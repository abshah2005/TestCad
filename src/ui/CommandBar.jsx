import React, { useState } from 'react';
import useCADStore from '../app/store';
import commandBus from '../app/commandBus';

/**
 * Command bar for AutoCAD-style command input
 */
const CommandBar = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const currentCommand = useCADStore(state => state.currentCommand);
  const commandState = useCADStore(state => state.commandState);

  const handleKeyDown = async (e) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        await handleCommand(input.trim());
        break;
        
      case 'Escape':
        e.preventDefault();
        await commandBus.cancel();
        setInput('');
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (history.length > 0) {
          const newIndex = Math.max(0, historyIndex + 1);
          setHistoryIndex(newIndex);
          setInput(history[history.length - 1 - newIndex] || '');
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setInput(history[history.length - 1 - newIndex] || '');
        } else {
          setHistoryIndex(-1);
          setInput('');
        }
        break;
    }
  };

  const handleCommand = async (commandText) => {
    if (!commandText) return;

    // Add to history
    setHistory(prev => [...prev, commandText]);
    setHistoryIndex(-1);

    try {
      // Check if it's coordinate input (x,y format)
      if (commandText.includes(',')) {
        const coords = parseCoordinates(commandText);
        if (coords) {
          await commandBus.sendInput('point', coords);
          setInput('');
          return;
        }
      }

      // Check if it's a distance input
      if (!isNaN(parseFloat(commandText))) {
        await commandBus.sendInput('distance', parseFloat(commandText));
        setInput('');
        return;
      }

      // Check if it's an angle input (starts with <)
      if (commandText.startsWith('<')) {
        const angle = parseFloat(commandText.slice(1));
        if (!isNaN(angle)) {
          await commandBus.sendInput('angle', angle * Math.PI / 180); // Convert to radians
          setInput('');
          return;
        }
      }

      // Check if it's relative coordinates (@dx,dy format)
      if (commandText.startsWith('@')) {
        const coords = parseCoordinates(commandText.slice(1));
        if (coords) {
          await commandBus.sendInput('relative', coords);
          setInput('');
          return;
        }
      }

      // Otherwise, treat as command
      const parts = commandText.split(' ');
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      await commandBus.run(command, { args });
      
    } catch (error) {
      console.error('Command error:', error);
      // TODO: Show error in command line
    }

    setInput('');
  };

  const parseCoordinates = (text) => {
    const parts = text.split(',').map(s => s.trim());
    if (parts.length === 2) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      if (!isNaN(x) && !isNaN(y)) {
        return { x, y };
      }
    }
    return null;
  };

  return (
    <div className="bg-black text-green-400 font-mono text-sm border-t border-gray-700">
      {/* Command history display */}
      <div className="max-h-32 overflow-y-auto p-2 border-b border-gray-700">
        {history.slice(-5).map((cmd, index) => (
          <div key={index} className="text-gray-400">
            Command: {cmd}
          </div>
        ))}
        
        {/* Current command status */}
        {currentCommand && (
          <div className="text-yellow-400">
            Command: {currentCommand}
            {commandState.prompt && (
              <div className="text-white">{commandState.prompt}</div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex items-center p-2">
        <span className="text-green-400 mr-2">Command:</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-green-400 outline-none"
          placeholder="Enter command or coordinates..."
          autoFocus
        />
      </div>

      {/* Help text */}
      <div className="px-2 pb-2 text-xs text-gray-500">
        Enter: Execute | Esc: Cancel | ↑↓: History | Format: x,y @dx,dy &lt;angle
      </div>
    </div>
  );
};

export default CommandBar;
