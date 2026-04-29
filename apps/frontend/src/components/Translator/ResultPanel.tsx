interface ResultPanelProps {
  result: string;
}

export default function ResultPanel({ result }: ResultPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3>Result</h3>
      <textarea
        style={{
          width: '100%',
          height: '100%',
          resize: 'none',
        }}
        value={result}
        readOnly
        placeholder="Result here..."
      />
    </div>
  );
}