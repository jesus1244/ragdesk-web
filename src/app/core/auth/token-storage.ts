import { Service } from '@angular/core';

import { TokenPair } from './auth.models';

const STORAGE_KEY = 'ragdesk.tokens';

/** Persists the token pair. Storage can be unavailable (private mode), so every access is guarded. */
@Service()
export class TokenStorage {
  read(): TokenPair | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as TokenPair) : null;
    } catch {
      return null;
    }
  }

  write(tokens: TokenPair | null): void {
    try {
      if (tokens) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore: the session simply won't survive a reload.
    }
  }
}
