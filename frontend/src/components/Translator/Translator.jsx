import InputPanel from './InputPanel';
import ResultPanel from './ResultPanel';
import { useTranslator } from '../../hooks/useTranslator';

export default function Translator() {
    const state = useTranslator();

    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto' }}>
            <h1>Corpo Lingo</h1>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                    height: '500px',
                }}
            >
                <InputPanel
                    {...state}
                    onTranslate={state.handleTranslate}
                />

                <ResultPanel result={state.result} />
            </div>
        </div>
    );
}