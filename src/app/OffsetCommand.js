import { BaseCommand } from './commandBus';

/**
 * Offset Command
 * Basic implementation for offsetting entities
 */
export class OffsetCommand extends BaseCommand {
  constructor(args = {}) {
    super(args);
    this.state = 'waitingForDistance';
  }

  async execute() {
    this.setPrompt('Specify offset distance or point:');
    
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
        message: 'Offset command executed (basic implementation)'
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

export default OffsetCommand;
