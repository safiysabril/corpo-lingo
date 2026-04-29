import { useState } from 'react';
import { translateText } from '../api/translateApi';

export function useTranslator() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('email');
  const [formality, setFormality] = useState('medium');

  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!text) return;

    try {
      setLoading(true);
      setResult('');

      const data = await translateText({ text, mode, formality });
      setResult(data.data?.translated || 'No result');
    } catch (err: unknown) {
      setResult(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    text,
    setText,
    mode,
    setMode,
    formality,
    setFormality,
    result,
    loading,
    handleTranslate,
  };
}