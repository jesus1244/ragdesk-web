import { Service, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { errorMessage } from '../../core/http/api-error';
import { Bot } from './bot.models';
import { BotsApi } from './bots-api';

/** The assistant being viewed. Tab pages read it, and settings update it so the header follows. */
@Service()
export class CurrentBot {
  private readonly api = inject(BotsApi);

  readonly bot = signal<Bot | null>(null);
  readonly error = signal<string | null>(null);

  async load(id: string): Promise<void> {
    if (this.bot()?.id !== id) {
      this.bot.set(null);
    }
    this.error.set(null);
    try {
      this.bot.set(await firstValueFrom(this.api.get(id)));
    } catch (error) {
      this.error.set(errorMessage(error, 'Could not load this assistant'));
    }
  }
}
