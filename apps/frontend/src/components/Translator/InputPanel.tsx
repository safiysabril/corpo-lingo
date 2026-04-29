import type { ChangeEvent } from 'react';

interface InputPanelProps {
  text: string;
  setText: (value: string) => void;
  mode: string;
  setMode: (value: string) => void;
  formality: string;
  setFormality: (value: string) => void;
  loading: boolean;
  onTranslate: () => void;
}

export default function InputPanel({
  text,
  setText,
  mode,
  setMode,
  formality,
  setFormality,
  loading,
  onTranslate,
}: InputPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 15, height: '100%' }}>
      <textarea
        rows={6}
        style={{ width: '100%', resize: 'none' }}
        value={text}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
        placeholder="Enter text..."
      />

      <div>
        <h3>Mode:</h3>
        {['email', 'documentation', 'formal'].map((m) => (
          <label key={m} style={{ display: 'block' }}>
            <input
              type="radio"
              value={m}
              checked={mode === m}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMode(e.target.value)}
            />
            {m}
          </label>
        ))}
      </div>

      <div>
        <h3>Formality:</h3>
        <input
          type="range"
          min="0"
          max="2"
          step="1"
          value={['low', 'medium', 'high'].indexOf(formality)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const mapping = ['low', 'medium', 'high'];
            setFormality(mapping[Number(e.target.value)]);
          }}
        />
        <p>Selected: {formality}</p>
      </div>

      <button onClick={onTranslate} disabled={loading}>
        {loading ? 'Translating...' : 'Translate'}
      </button>
    </div>
  );
}