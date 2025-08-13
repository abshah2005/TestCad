import useCADStore from './store';

/**
 * Command Bus - Central command execution system
 * Implements command pattern for all CAD operations
 */
class CommandBus {
  constructor() {
    this.commands = new Map();
    this.history = [];
    this.historyIndex = -1;
    this.currentCommand = null;
  }

  /**
   * Register a command
   * @param {string} name - Command name
   * @param {Function} commandClass - Command class constructor
   */
  register(name, commandClass) {
    this.commands.set(name.toLowerCase(), commandClass);
  }

  /**
   * Execute a command
   * @param {string} commandName - Name of command to execute
   * @param {Object} args - Command arguments
   * @returns {Promise} Command execution promise
   */
  async run(commandName, args = {}) {
    const CommandClass = this.commands.get(commandName.toLowerCase());
    if (!CommandClass) {
      throw new Error(`Unknown command: ${commandName}`);
    }

    // Cancel current command if running
    if (this.currentCommand) {
      await this.cancel();
    }

    // Create and start new command
    this.currentCommand = new CommandClass(args);
    useCADStore.getState().setCommand(commandName, { phase: 'started' });

    try {
      const result = await this.currentCommand.execute();
      
      // Add to history if command completed successfully
      if (result && result.completed) {
        this.addToHistory(commandName, args, result);
      }

      return result;
    } catch (error) {
      console.error(`Command ${commandName} failed:`, error);
      throw error;
    } finally {
      this.currentCommand = null;
      useCADStore.getState().clearCommand();
    }
  }

  /**
   * Cancel current command
   */
  async cancel() {
    if (this.currentCommand && this.currentCommand.cancel) {
      await this.currentCommand.cancel();
    }
    this.currentCommand = null;
    useCADStore.getState().clearCommand();
  }

  /**
   * Send input to current command
   * @param {string} type - Input type ('point', 'text', 'key')
   * @param {*} value - Input value
   */
  async sendInput(type, value) {
    if (this.currentCommand && this.currentCommand.handleInput) {
      return await this.currentCommand.handleInput(type, value);
    }
  }

  /**
   * Add command to history
   * @param {string} commandName - Command name
   * @param {Object} args - Command arguments
   * @param {Object} result - Command result
   */
  addToHistory(commandName, args, result) {
    // Remove any commands after current position (for redo)
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    this.history.push({
      command: commandName,
      args,
      result,
      timestamp: Date.now()
    });
    
    this.historyIndex = this.history.length - 1;
  }

  /**
   * Undo last command
   */
  async undo() {
    if (this.historyIndex >= 0) {
      const historyItem = this.history[this.historyIndex];
      
      // Execute undo operation if available
      if (historyItem.result.undo) {
        await historyItem.result.undo();
      }
      
      this.historyIndex--;
      return true;
    }
    return false;
  }

  /**
   * Redo next command
   */
  async redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const historyItem = this.history[this.historyIndex];
      
      // Execute redo operation if available
      if (historyItem.result.redo) {
        await historyItem.result.redo();
      }
      
      return true;
    }
    return false;
  }

  /**
   * Repeat last command
   */
  async repeatLast() {
    if (this.history.length > 0) {
      const lastCommand = this.history[this.history.length - 1];
      return await this.run(lastCommand.command, lastCommand.args);
    }
  }

  /**
   * Get available commands
   * @returns {Array} Array of command names
   */
  getAvailableCommands() {
    return Array.from(this.commands.keys());
  }
}

/**
 * Base Command class
 * All commands should extend this class
 */
export class BaseCommand {
  constructor(args = {}) {
    this.args = args;
    this.state = 'initialized';
    this.prompts = [];
    this.currentPrompt = 0;
  }

  /**
   * Execute the command - to be implemented by subclasses
   * @returns {Promise<Object>} Command result
   */
  async execute() {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Cancel the command - to be implemented by subclasses
   */
  async cancel() {
    this.state = 'cancelled';
    // Cleanup any preview graphics, etc.
  }

  /**
   * Handle input - to be implemented by subclasses
   * @param {string} type - Input type
   * @param {*} value - Input value
   */
  async handleInput(type, value) {
    // Default implementation - override in subclasses
    console.log(`Command received input: ${type}`, value);
  }

  /**
   * Set current prompt message
   * @param {string} message - Prompt message
   */
  setPrompt(message) {
    useCADStore.getState().updateCommandState({ 
      prompt: message,
      phase: this.state 
    });
  }

  /**
   * Get mouse position from command state
   * @returns {Object} Mouse position {x, y}
   */
  getMousePosition() {
    const commandState = useCADStore.getState().commandState;
    return commandState.mousePosition || { x: 0, y: 0 };
  }
}

// Create global command bus instance
const commandBus = new CommandBus();

export default commandBus;
