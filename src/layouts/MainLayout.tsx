import { useNavigate } from 'react-router-dom';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--slate-50)', paddingBottom: '4rem' }}>
            {/* Global Header */}
            <header style={{ background: 'white', borderBottom: '1px solid var(--slate-200)', padding: '1rem 0' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                        style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--slate-900)', cursor: 'pointer' }}
                        onClick={() => navigate('/student/dashboard')}
                    >
                        WOW<span style={{ color: 'var(--primary-600)' }}>CBT</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--slate-600)' }}>김수강님 (3D프린터운용기능사)</span>
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            onClick={() => navigate('/login')}
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            {/* Content Wrapper */}
            <main className="container" style={{ marginTop: '2rem' }}>
                {children}
            </main>
        </div>
    );
};
