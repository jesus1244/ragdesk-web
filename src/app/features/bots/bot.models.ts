export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface Bot {
  id: string;
  name: string;
  public_key: string;
  welcome_message: string;
  instructions: string;
  allowed_origins: string[];
  is_demo: boolean;
  created_at: string;
}

export interface BotCreate {
  name: string;
  welcome_message?: string;
  instructions?: string;
  allowed_origins?: string[];
}

export type BotUpdate = Partial<BotCreate>;
