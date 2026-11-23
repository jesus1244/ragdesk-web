export interface BotStats {
  conversations: number;
  questions: number;
  answered: number;
  unanswered: number;
  answer_rate: number;
}

export interface Citation {
  index: number;
  source_id: string;
  source_name: string;
  title: string;
  snippet: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  answered: boolean | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  visitor_id: string | null;
  created_at: string;
  message_count: number;
  last_question: string | null;
}

export interface Unanswered {
  message_id: string;
  conversation_id: string;
  question: string;
  created_at: string;
}
