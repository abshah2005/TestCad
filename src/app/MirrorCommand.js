import { BaseCommand } from './commandBus';

/**
 * Mirror Command
 * Basic implementation for mirroring entities
 */
export class MirrorCommand extends BaseCommand {
  constructor(args = {}) {
    super(args);
    this.state = 'waitingForSelection';
  }

  async execute() {
    this.setPrompt('Select entities to mirror:');
    
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
        message: 'Mirror command executed (basic implementation)'
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

export default MirrorCommand;
