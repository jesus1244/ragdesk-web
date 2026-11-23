export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export type BotLanguage = 'en' | 'es';

export interface Bot {
  id: string;
  name: string;
  public_key: string;
  welcome_message: string;
  instructions: string;
  allowed_origins: string[];
  language: BotLanguage;
  fallback_message: string;
  suggested_questions: string[];
  is_demo: boolean;
  created_at: string;
}

export interface BotCreate {
  name: string;
  welcome_message?: string;
  instructions?: string;
  allowed_origins?: string[];
  language?: BotLanguage;
  fallback_message?: string;
  suggested_questions?: string[];
}

export type BotUpdate = Partial<BotCreate>;
