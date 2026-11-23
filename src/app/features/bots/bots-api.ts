import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../../core/http/api-url';
import { Bot, BotCreate, BotUpdate, Page } from './bot.models';

@Service()
export class BotsApi {
  private readonly http = inject(HttpClient);

  list(limit = 50, offset = 0): Observable<Page<Bot>> {
    return this.http.get<Page<Bot>>(`${API_URL}/bots`, { params: { limit, offset } });
  }

  get(id: string): Observable<Bot> {
    return this.http.get<Bot>(`${API_URL}/bots/${id}`);
  }

  create(data: BotCreate): Observable<Bot> {
    return this.http.post<Bot>(`${API_URL}/bots`, data);
  }

  update(id: string, data: BotUpdate): Observable<Bot> {
    return this.http.patch<Bot>(`${API_URL}/bots/${id}`, data);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/bots/${id}`);
  }
}
