import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../../core/http/api-url';
import { Page } from '../bots/bot.models';
import { Source } from './source.models';

@Service()
export class SourcesApi {
  private readonly http = inject(HttpClient);

  private base(botId: string): string {
    return `${API_URL}/bots/${botId}/sources`;
  }

  list(botId: string, limit = 100, offset = 0): Observable<Page<Source>> {
    return this.http.get<Page<Source>>(this.base(botId), { params: { limit, offset } });
  }

  uploadFile(botId: string, file: File): Observable<Source> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http.post<Source>(`${this.base(botId)}/file`, body);
  }

  addUrl(botId: string, url: string): Observable<Source> {
    return this.http.post<Source>(`${this.base(botId)}/url`, { url });
  }

  addText(botId: string, name: string, text: string): Observable<Source> {
    return this.http.post<Source>(`${this.base(botId)}/text`, { name, text });
  }

  retry(botId: string, sourceId: string): Observable<Source> {
    return this.http.post<Source>(`${this.base(botId)}/${sourceId}/retry`, {});
  }

  remove(botId: string, sourceId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(botId)}/${sourceId}`);
  }
}
