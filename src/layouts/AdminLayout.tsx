import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AuthService } from '../services/authService';
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    BarChart3,
    MessageCircle,
    Home,
    Sparkles
} from 'lucide-react';

export const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const menuItems = [
        {
            path: '/',
            icon: Home,
            label: '사이트 홈',
            desc: '메인 페이지로 이동'
        },
        {
            path: '/admin/dashboard',
            icon: LayoutDashboard,
            label: '대시보드',
            desc: '전체 현황'
        },
        {
            path: '/admin/questions',
            icon: FileText,
            label: '문제은행 관리',
            desc: '문제 등록/수정'
        },
        {
            path: '/admin/mock-exam',
            icon: Sparkles,
            label: '모의고사 출제',
            desc: '문제 선택하여 출제'
        },
        {
            path: '/admin/users',
            icon: Users,
            label: '수강생 관리',
            desc: '계정 관리'
        },
        {
            path: '/admin/analytics',
            icon: BarChart3,
            label: '통계 분석',
            desc: '학습 데이터'
        },
        {
            path: '/admin/support',
            icon: MessageCircle,
            label: '1:1 문의 관리',
            desc: '문의 응대'
        },
        {
            path: '/admin/settings',
            icon: Settings,
            label: '시스템 설정',
            desc: '환경 설정'
        },
    ];

    const handleLogout = () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            AuthService.logout();
            navigate('/');
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            {/* Sidebar */}
            <aside style={{
                width: isSidebarOpen ? '280px' : '80px',
                background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'width 0.3s ease',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                overflowX: 'hidden'
            }}>
                {/* Logo Section */}
                <div style={{
                    padding: '1.25rem 1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '70px'
                }}>
                    {isSidebarOpen && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.875rem',
                            flex: 1
                        }}>
                            <img
                                src="/images/wow_logo.png"
                                alt="WOW3D-CBT"
                                style={{
                                    height: '40px',
                                    filter: 'brightness(0) invert(1)',
                                    flexShrink: 0
                                }}
                            />
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem'
                            }}>
                                <span style={{
                                    fontSize: '1.125rem',
                                    fontWeight: 700,
                                    color: 'white',
                                    lineHeight: 1,
                                    letterSpacing: '-0.02em'
                                }}>
                                    WOW3D-CBT
                                </span>
                                <span style={{
                                    fontSize: '0.6875rem',
                                    opacity: 0.5,
                                    fontWeight: 500,
                                    color: '#cbd5e1',
                                    letterSpacing: '0.08em',
                                    lineHeight: 1,
                                    textTransform: 'uppercase'
                                }}>
                                    Admin System
                                </span>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s',
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                    >
                        {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav style={{
                    flex: 1,
                    padding: '1rem 0.75rem',
                    overflowY: 'auto'
                }}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: isSidebarOpen ? '1rem' : '1rem 0.5rem',
                                    marginBottom: '0.5rem',
                                    background: isActive
                                        ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)'
                                        : 'transparent',
                                    border: 'none',
                                    borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                                    borderRadius: '0.5rem',
                                    color: isActive ? '#a5b4fc' : 'rgba(255, 255, 255, 0.7)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s',
                                    justifyContent: isSidebarOpen ? 'flex-start' : 'center'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                        e.currentTarget.style.color = 'white';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                                    }
                                }}
                            >
                                <Icon size={20} strokeWidth={2} />
                                {isSidebarOpen && (
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '2px' }}>
                                            {item.label}
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            opacity: 0.6,
                                            fontWeight: 400
                                        }}>
                                            {item.desc}
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div style={{
                    padding: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: isSidebarOpen ? '1rem' : '1rem 0.5rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '0.5rem',
                            color: '#fca5a5',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            justifyContent: isSidebarOpen ? 'flex-start' : 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                        }}
                    >
                        <LogOut size={18} />
                        {isSidebarOpen && <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>로그아웃</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: isSidebarOpen ? '280px' : '80px',
                transition: 'margin-left 0.3s ease',
                minHeight: '100vh',
                background: '#f8fafc'
            }}>
                {/* Top Bar */}
                <header style={{
                    background: 'white',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '1rem 2rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                            {menuItems.find(item => item.path === location.pathname)?.label || '관리자'}
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                            {menuItems.find(item => item.path === location.pathname)?.desc || 'WOW3D-CBT 관리 시스템'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            padding: '0.5rem 1rem',
                            background: '#f1f5f9',
                            borderRadius: '2rem',
                            fontSize: '0.875rem',
                            color: '#334155',
                            fontWeight: 600
                        }}>
                            관리자님
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div style={{ padding: '2rem' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
