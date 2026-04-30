export interface TranslatePayload {
  text: string;
  mode: string;
  formality: string;
}

export interface TranslateResponse {
  success: boolean;
  data: {
    original: string;
    translated: string;
    mode: string;
    formality: string;
  };
  meta: {
    provider: string;
    model: string;
    usage: Record<string, number> | null;
    timestamp: string;
  };
  error?: string;
}
