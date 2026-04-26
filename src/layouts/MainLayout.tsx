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
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        setUser(currentUser);

        // Screen size detection
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        AuthService.logout();
        navigate('/login');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--slate-50)', paddingBottom: '4rem' }}>
            {/* Global Header */}
            <header style={{
                background: 'white',
                borderBottom: '1px solid var(--slate-200)',
                padding: isMobile ? '0.75rem 0' : '1rem 0'
            }}>
                <div className="container" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '0 0.75rem' : '0 1.5rem'
                }}>
                    {/* Logo */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? '0.4rem' : '0.5rem',
                            cursor: 'pointer'
                        }}
                        onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard')}
                    >
                        <img src="/images/wow_logo.png" alt="WOW3D" style={{ height: isMobile ? '22px' : '24px' }} />
                        {!isMobile && (
                            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--slate-900)' }}>
                                WOW3D<span style={{ color: 'var(--primary-600)' }}>-CBT</span>
                            </span>
                        )}
                    </div>

                    {/* User Info & Actions */}
                    <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '1rem', alignItems: 'center' }}>
                        {user ? (
                            <>
                                {!isMobile && (
                                    <span style={{ fontSize: '0.9rem', color: 'var(--slate-600)' }}>
                                        {user.name}님
                                        <span style={{ color: 'var(--slate-400)', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                                            ({user.pendingCourses?.[0] || (user.role === 'admin' ? '관리자' : '수강생')})
                                        </span>
                                    </span>
                                )}
                                <button
                                    className="btn btn-secondary"
                                    style={{
                                        padding: isMobile ? '0.5rem 0.875rem' : '0.5rem 1rem',
                                        fontSize: isMobile ? '0.8rem' : '0.875rem'
                                    }}
                                    onClick={handleLogout}
                                >
                                    로그아웃
                                </button>
                            </>
                        ) : (
                            <button
                                className="btn btn-primary"
                                style={{
                                    padding: isMobile ? '0.5rem 0.875rem' : '0.5rem 1rem',
                                    fontSize: isMobile ? '0.8rem' : '0.875rem'
                                }}
                                onClick={() => navigate('/login')}
                            >
                                로그인
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Content Wrapper */}
            <main className="container" style={{ marginTop: isMobile ? '1rem' : '2rem' }}>
                {children}
            </main>
        </div>
    );
};
