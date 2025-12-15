import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { useEffect, useState } from 'react';
import { User } from '../types';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        setUser(currentUser);
    }, []);

    const handleLogout = () => {
        AuthService.logout();
        navigate('/login');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--slate-50)', paddingBottom: '4rem' }}>
            {/* Global Header */}
            <header style={{ background: 'white', borderBottom: '1px solid var(--slate-200)', padding: '1rem 0' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                        onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard')}
                    >
                        <img src="/images/wow_logo.png" alt="WOW3D" style={{ height: '24px' }} />
                        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--slate-900)' }}>
                            WOW3D<span style={{ color: 'var(--primary-600)' }}>-CBT</span>
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {user ? (
                            <>
                                <span style={{ fontSize: '0.9rem', color: 'var(--slate-600)' }}>
                                    {user.name}님
                                    <span style={{ color: 'var(--slate-400)', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                                        ({user.pendingCourses?.[0] || (user.role === 'admin' ? '관리자' : '수강생')})
                                    </span>
                                </span>
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                    onClick={handleLogout}
                                >
                                    로그아웃
                                </button>
                            </>
                        ) : (
                            <button
                                className="btn btn-primary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                onClick={() => navigate('/login')}
                            >
                                로그인
                            </button>
                        )}
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
