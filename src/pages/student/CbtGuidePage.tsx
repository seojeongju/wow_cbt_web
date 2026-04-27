import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';

export const CbtGuidePage = () => {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <div className="glass-card" style={{ background: 'white', padding: '2rem', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>CBT 필기시험 안내</h1>
                <p style={{ color: 'var(--slate-600)', lineHeight: 1.7, marginBottom: '1rem' }}>
                    CBT 필기시험은 기존 문제풀이와 분리된 실전 모드입니다. 시험 시작 후에는 제한시간이 적용되며,
                    답안은 자동 저장됩니다. 시간이 종료되면 자동 제출됩니다.
                </p>
                <ul style={{ color: 'var(--slate-700)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                    <li>시험 중 브라우저를 닫아도 재접속 시 이어서 진행할 수 있습니다.</li>
                    <li>제출 후 답안은 수정할 수 없습니다.</li>
                    <li>실전 환경과 동일하게 시간 관리가 중요합니다.</li>
                </ul>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/student/cbt/exams')}>
                        CBT 시험 시작하기
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/student/cbt/history')}>
                        CBT 응시 기록
                    </button>
                </div>
            </div>
        </MainLayout>
    );
};
