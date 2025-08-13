import { BaseCommand } from './commandBus';
import useCADStore from './store';

/**
 * Rotate Command
 * Basic implementation for rotating entities
 */
export class RotateCommand extends BaseCommand {
  constructor(args = {}) {
    super(args);
    this.selectedEntities = [];
    this.state = 'waitingForSelection';
  }

  async execute() {
    this.setPrompt('Select entities to rotate:');
    
    return new Promise((resolve, reject) => {
      this.resolveCommand = resolve;
      this.rejectCommand = reject;
    });
  }

  async handleInput(type, value) {
    if (type === 'key' && value === 'Escape') {
      await this.cancel();
      return true;
    }
    
    // Simplified implementation - just complete the command
    this.state = 'completed';
    
    if (this.resolveCommand) {
      this.resolveCommand({
        completed: true,
        message: 'Rotate command executed (basic implementation)'
      });
    }
    
    return true;
  }

  async cancel() {
    this.state = 'cancelled';
    if (this.rejectCommand) {
      this.rejectCommand(new Error('Command cancelled'));
    }
  }
}

export default RotateCommand;
