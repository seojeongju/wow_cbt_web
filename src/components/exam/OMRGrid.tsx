import { AlertCircle } from 'lucide-react';

interface OMRGridProps {
    total: number;
    answers: { [key: string]: number };
    current: number;
    onJump: (idx: number) => void;
}

export const OMRGrid = ({ total, answers, current, onJump }: OMRGridProps) => (
    <div style={{ position: 'sticky', top: '5.5rem', height: 'fit-content' }}>
        <div className="glass-card" style={{ padding: '1.5rem', background: 'white' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                답안 표기 (OMR)
                <span style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
                    {Object.keys(answers).length} / {total}
                </span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                {Array.from({ length: total }).map((_, idx) => {
                    const isAnswered = answers[`q${idx + 1}`] !== undefined;
                    const isCurrent = current === idx;
                    return (
                        <button
                            key={idx}
                            onClick={() => onJump(idx)}
                            style={{
                                aspectRatio: '1',
                                borderRadius: '0.5rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 600, fontSize: '0.9rem',
                                background: isCurrent ? 'var(--primary-600)' : (isAnswered ? 'var(--primary-100)' : 'var(--slate-100)'),
                                color: isCurrent ? 'white' : (isAnswered ? 'var(--primary-700)' : 'var(--slate-500)'),
                                border: isCurrent ? 'none' : '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.85rem'
                            }}
                        >
                            {idx + 1}
                        </button>
                    );
                })}
            </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--slate-50)', marginTop: '1rem', border: 'none' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} /> 안내
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', lineHeight: '1.5' }}>
                모든 문제를 풀지 않아도 제출할 수 있습니다.
                <br />시간이 종료되면 답안이 자동 제출됩니다.
            </p>
        </div>
    </div>
);
