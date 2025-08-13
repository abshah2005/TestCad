import { BaseCommand } from './commandBus';

/**
 * Extend Command
 * Basic implementation for extending entities
 */
export class ExtendCommand extends BaseCommand {
  constructor(args = {}) {
    super(args);
    this.state = 'waitingForSelection';
  }

  async execute() {
    this.setPrompt('Select boundary edges, then entities to extend:');
    
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
    
    this.state = 'completed';
    
    if (this.resolveCommand) {
      this.resolveCommand({
        completed: true,
        message: 'Extend command executed (basic implementation)'
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

export default ExtendCommand;
