export type SourceKind = 'file' | 'url' | 'text';
export type SourceStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface Source {
  id: string;
  kind: SourceKind;
  name: string;
  url: string | null;
  status: SourceStatus;
  error: string | null;
  chunk_count: number;
  created_at: string;
}

/** Sources still being processed by the background worker. */
export function isInProgress(source: Pick<Source, 'status'>): boolean {
  return source.status === 'pending' || source.status === 'processing';
}

/** Keep polling the list for as long as any source has not finished. */
export function shouldPoll(sources: readonly Pick<Source, 'status'>[]): boolean {
  return sources.some(isInProgress);
}
