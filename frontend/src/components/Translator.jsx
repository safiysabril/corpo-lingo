import { useState } from 'react';
import { translateText } from '../api/translateApi';

export default function Translator() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('email');
  const [degree, setDegree] = useState('moderate');

  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!text) return;

    try {
      setLoading(true);
      setResult('');

      const data = await translateText({
        text,
        mode,
        degree,
      });

      setResult(data.data?.translated || 'No result');
    } catch (err) {
      setResult(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '50px auto' }}>
      <h1>Corpo Lingo</h1>

      {/* TEXT INPUT */}
      <textarea
        rows="5"
        style={{ width: '100%' }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text..."
      />

      {/* MODE (radio buttons = better than checkbox for single choice) */}
      <h3>Mode:</h3>
      <label>
        <input
          type="radio"
          value="email"
          checked={mode === 'email'}
          onChange={(e) => setMode(e.target.value)}
        />
        Email
      </label>

      <label>
        <input
          type="radio"
          value="documentation"
          checked={mode === 'documentation'}
          onChange={(e) => setMode(e.target.value)}
        />
        Documentation
      </label>

      <label>
        <input
          type="radio"
          value="formal"
          checked={mode === 'formal'}
          onChange={(e) => setMode(e.target.value)}
        />
        Formal
      </label>

      {/* DEGREE (slider) */}
      <h3>Degree:</h3>
      <input
        type="range"
        min="0"
        max="2"
        step="1"
        value={
          degree === 'few' ? 0 : degree === 'moderate' ? 1 : 2
        }
        onChange={(e) => {
          const val = Number(e.target.value);
          const mapping = ['few', 'moderate', 'high'];
          setDegree(mapping[val]);
        }}
      />

      <p>Selected: {degree}</p>

      {/* BUTTON */}
      <button onClick={handleTranslate} disabled={loading}>
        {loading ? 'Translating...' : 'Translate'}
      </button>

      {/* RESULT */}
      <h3>Result:</h3>
      <p>{result}</p>
    </div>
  );
}