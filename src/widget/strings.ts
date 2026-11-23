/** Every text the widget shows itself. Answers come from the API in the question's language. */
export interface Strings {
  assistant: string;
  fallbackWelcome: string;
  placeholder: string;
  yourQuestion: string;
  send: string;
  openChat: string;
  closeChat: string;
  sources: string;
  suggestions: string;
  genericError: string;
  tooMany: string;
}

const EN: Strings = {
  assistant: 'Assistant',
  fallbackWelcome: 'Hi! Ask me a question.',
  placeholder: 'Ask a question…',
  yourQuestion: 'Your question',
  send: 'Send',
  openChat: 'Open chat',
  closeChat: 'Close chat',
  sources: 'Sources',
  suggestions: 'Suggested questions',
  genericError: 'Sorry, something went wrong. Please try again.',
  tooMany: 'Too many questions, please wait a moment.',
};

const ES: Strings = {
  assistant: 'Asistente',
  fallbackWelcome: '¡Hola! Hazme una pregunta.',
  placeholder: 'Escribe tu pregunta…',
  yourQuestion: 'Tu pregunta',
  send: 'Enviar',
  openChat: 'Abrir chat',
  closeChat: 'Cerrar chat',
  sources: 'Fuentes',
  suggestions: 'Preguntas sugeridas',
  genericError: 'Lo siento, algo salió mal. Inténtalo de nuevo.',
  tooMany: 'Demasiadas preguntas, espera un momento.',
};

const BY_LANGUAGE: Record<string, Strings> = { en: EN, es: ES };

/** Texts for a language code such as `es` or `es-CO`; anything unknown falls back to English. */
export function strings(language: string | null | undefined): Strings {
  const code = (language ?? '').toLowerCase().split('-')[0] ?? '';
  return BY_LANGUAGE[code] ?? EN;
}
