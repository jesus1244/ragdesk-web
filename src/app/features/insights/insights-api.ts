import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../../core/http/api-url';
import { Page } from '../bots/bot.models';
import { BotStats, Conversation, Message, Unanswered } from './insights.models';

@Service()
export class InsightsApi {
  private readonly http = inject(HttpClient);

  private base(botId: string): string {
    return `${API_URL}/bots/${botId}`;
  }

  stats(botId: string): Observable<BotStats> {
    return this.http.get<BotStats>(`${this.base(botId)}/stats`);
  }

  conversations(botId: string, limit = 20, offset = 0): Observable<Page<Conversation>> {
    return this.http.get<Page<Conversation>>(`${this.base(botId)}/conversations`, {
      params: { limit, offset },
    });
  }

  messages(botId: string, conversationId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.base(botId)}/conversations/${conversationId}/messages`);
  }

  unanswered(botId: string, limit = 20, offset = 0): Observable<Page<Unanswered>> {
    return this.http.get<Page<Unanswered>>(`${this.base(botId)}/unanswered`, {
      params: { limit, offset },
    });
  }
}
