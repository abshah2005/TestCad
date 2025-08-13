import { BaseCommand } from './commandBus';

/**
 * Trim Command
 * Basic implementation for trimming entities
 */
export class TrimCommand extends BaseCommand {
  constructor(args = {}) {
    super(args);
    this.state = 'waitingForSelection';
  }

  async execute() {
    this.setPrompt('Select cutting edges, then entities to trim:');
    
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
        message: 'Trim command executed (basic implementation)'
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

export default TrimCommand;
