import { AlertCircle } from 'lucide-react';
import { Question } from '../../types';

interface OMRGridProps {
    questions: Question[];
    answers: { [key: string]: number | string };
    current: number;
    onJump: (idx: number) => void;
}

export const OMRGrid = ({ questions, answers, current, onJump }: OMRGridProps) => { // questions prop used for length and accessing each question
    const answeredCount = Object.keys(answers).length;
    const total = questions.length;

    return (
        <div style={{ position: 'sticky', top: '5.5rem', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Control Panel (Top Right like reference) */}
            <div className="glass-card" style={{ padding: '1rem', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                    답안 작성 현황
                </span>
                <span style={{ fontSize: '0.875rem', color: answeredCount === total ? 'var(--primary-600)' : 'var(--slate-500)', fontWeight: 600 }}>
                    {answeredCount} / {total}
                </span>
            </div>

            {/* OMR Table Container */}
            <div className="glass-card" style={{ background: 'white', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
                <div style={{ padding: '0.75rem 1rem', background: 'var(--slate-100)', borderBottom: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                        시험지 주의사항 {">>"}
                    </h3>
                </div>

                {/* Table Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, color: '#475569', textAlign: 'center' }}>
                    <div style={{ padding: '0.75rem', borderRight: '1px solid #e2e8f0' }}>문제</div>
                    <div style={{ padding: '0.75rem' }}>답안</div>
                </div>

                {/* Table Body (Scrollable) */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {questions.map((q, idx) => {
                        const answer = answers[q.id];
                        const isAnswered = answer !== undefined && answer !== '';
                        const isCurrent = current === idx;

                        let displayAnswer: string | number = '';
                        if (isAnswered) {
                            if (typeof answer === 'number') {
                                displayAnswer = answer + 1;
                            } else {
                                displayAnswer = (answer as string).length > 5 ? (answer as string).slice(0, 5) + '...' : answer;
                            }
                        }

                        return (
                            <div
                                key={q.id}
                                onClick={() => onJump(idx)}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    borderBottom: '1px solid #f1f5f9',
                                    backgroundColor: isCurrent ? '#eff6ff' : 'white', // Light blue if current
                                    cursor: 'pointer',
                                    transition: 'background 0.1s'
                                }}
                            >
                                {/* Question Number Column */}
                                <div style={{
                                    padding: '0.75rem',
                                    borderRight: '1px solid #f1f5f9',
                                    textAlign: 'center',
                                    fontSize: '0.9rem',
                                    fontWeight: isCurrent ? 700 : 400,
                                    color: isCurrent ? 'var(--primary-700)' : 'var(--slate-600)'
                                }}>
                                    {idx + 1}번
                                </div>

                                {/* Answer Column */}
                                <div style={{
                                    padding: '0.75rem',
                                    textAlign: 'center',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    color: isAnswered ? 'var(--primary-600)' : 'var(--slate-300)'
                                }}>
                                    {isAnswered ? displayAnswer : '-'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="glass-card" style={{ padding: '1rem', background: 'var(--slate-50)', border: 'none' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={14} /> 안내
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', lineHeight: '1.4' }}>
                    문제를 클릭하면 해당 문제로 이동합니다.<br />
                    주관식은 입력 내용이 표시됩니다.
                </p>
            </div>
        </div>
    );
};
