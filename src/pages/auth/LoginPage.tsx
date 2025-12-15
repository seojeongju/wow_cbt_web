import React, { useState } from 'react';

import { Layers, Box, Cpu, ArrowRight, User, Lock, Eye, EyeOff, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/authService';
import { formatPhoneNumber } from '../../utils/formatters';

export const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<'student' | 'admin'>('student');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    // Find Account Modal State
    const [showFindModal, setShowFindModal] = useState(false);
    const [findMode, setFindMode] = useState<'id' | 'password'>('id'); // 'id' or 'password'
    const [findForm, setFindForm] = useState({ name: '', phone: '', email: '', newPassword: '' });
    const [isFinding, setIsFinding] = useState(false);

    const handleFindSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsFinding(true);
        try {
            if (findMode === 'id') {
                const result = await AuthService.findId(findForm.name, findForm.phone);
                if (result) {
                    alert(`회원님의 아이디(이메일)는 ${result} 입니다.`);
                    setShowFindModal(false);
                } else {
                    alert('일치하는 회원 정보를 찾을 수 없습니다.');
                }
            } else {
                if (!findForm.newPassword || findForm.newPassword.length < 4) {
                    alert('새 비밀번호를 4자 이상 입력해주세요.');
                    setIsFinding(false);
                    return;
                }
                const result = await AuthService.resetPassword(findForm.name, findForm.email, findForm.phone, findForm.newPassword);
                if (result) {
                    alert('비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.');
                    setShowFindModal(false);
                } else {
                    alert('일치하는 회원 정보를 찾을 수 없거나 오류가 발생했습니다.\n입력 정보를 확인해주세요.');
                }
            }
        } catch (error) {
            console.error(error);
            alert('처리 중 오류가 발생했습니다.');
        } finally {
            setIsFinding(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const user = await AuthService.login(email, password, role, rememberMe);
            if (user) {
                if (user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/student/dashboard');
                }
            }
        } catch (error: any) {
            console.error('Login error:', error);
            alert(error.message || '로그인 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', width: '100vw', background: 'var(--slate-50)' }}>
            <div className="grid-cols-2" style={{
                width: '100%',
                maxWidth: '1200px',
                height: '800px',
                maxHeight: '90vh',
                boxShadow: 'var(--shadow-2xl)',
                borderRadius: '1.5rem',
                overflow: 'hidden',
                background: 'white'
            }}>

                {/* Left Side - Brand Visuals */}
                <div style={{
                    background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
                    position: 'relative',
                    padding: '4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    color: 'white'
                }}>
                    {/* Decorative Circles/Glow */}
                    <div style={{
                        position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px',
                        background: 'var(--primary-600)', filter: 'blur(100px)', opacity: 0.2, zIndex: 0
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px',
                        background: 'var(--accent-500)', filter: 'blur(100px)', opacity: 0.1, zIndex: 0
                    }} />

                    <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>

                        <div style={{ marginTop: 'auto', marginBottom: '2rem' }}>
                            <img src="/images/wow_logo.png" alt="WOW3D" style={{ height: '60px', marginBottom: '2rem', filter: 'brightness(0) invert(1)' }} />

                            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.3, marginBottom: '3rem', color: 'white' }}>
                                WOW3D-CBT(문제은행)<br />
                                서비스
                            </h1>

                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '1.5rem',
                                borderRadius: '1rem',
                                fontSize: '0.9rem',
                                color: 'var(--slate-400)',
                                lineHeight: 1.6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                marginBottom: '2rem'
                            }}>
                                <p style={{ marginBottom: '0.5rem' }}>&copy; 2025 WOW3D Education Center. All rights reserved.</p>
                                <p>본 CBT(Computer Based Test) 문제은행 플랫폼은 와우쓰리디 홍대센터의 지적 재산입니다. 무단 전재 및 재배포를 금지합니다.</p>
                                <p style={{ color: 'var(--primary-400)', marginTop: '0.5rem', fontWeight: 600 }}>자격증 합격을 위한 스마트한 학습 파트너.</p>
                                <p style={{ color: 'var(--primary-400)', marginTop: '0.5rem', fontWeight: 600 }}>문의 : 02-3144-3137 e-mail : wow3d16@naver.com.</p>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', gap: '1.5rem' }}>
                            <FeatureIcon icon={<Box size={24} />} color="#f59e0b" label="3D Modeling" />
                            <FeatureIcon icon={<Layers size={24} />} color="#8b5cf6" label="Slicing" />
                            <FeatureIcon icon={<Cpu size={24} />} color="#10b981" label="Printing" />
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div style={{
                    padding: '4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>환영합니다! 👋</h2>
                            <p style={{ color: 'var(--text-muted)' }}>계정이 없으신가요? <span onClick={() => navigate('/register')} style={{ color: 'var(--primary-600)', fontWeight: 600, cursor: 'pointer' }}>회원가입 하기</span></p>
                        </div>

                        {/* Role Switcher */}
                        <div style={{ background: 'var(--slate-50)', padding: '0.25rem', borderRadius: '0.5rem', display: 'flex', marginBottom: '2rem', border: '1px solid var(--slate-100)' }}>
                            <RoleButton active={role === 'student'} onClick={() => setRole('student')}>수강생</RoleButton>
                            <RoleButton active={role === 'admin'} onClick={() => setRole('admin')}>관리자</RoleButton>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="input-group">
                                <label className="input-label">이메일 주소</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                                    <input
                                        type="email"
                                        className="input-field"
                                        placeholder="name@example.com"
                                        style={{ paddingLeft: '3rem' }}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">비밀번호</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="input-field"
                                        placeholder="Use '1234' for test"
                                        style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--slate-600)' }}>
                                    <input
                                        type="checkbox"
                                        style={{ accentColor: 'var(--primary-600)' }}
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    로그인 상태 유지
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFindForm({ name: '', phone: '', email: '', newPassword: '' });
                                        setShowFindModal(true);
                                    }}
                                    style={{ fontSize: '0.875rem', color: 'var(--primary-600)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                    아이디/비밀번호 찾기
                                </button>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                로그인 <ArrowRight size={18} />
                            </button>
                        </form>

                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--slate-400)' }}>
                                &copy; 2025 Wow3D Education Center. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Find ID/Password Modal */}
            {showFindModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000, padding: '1rem'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '1rem', padding: '2rem',
                        maxWidth: '450px', width: '100%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowFindModal(false)}
                            style={{
                                position: 'absolute', top: '1rem', right: '1rem',
                                background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'
                            }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
                            <button
                                onClick={() => setFindMode('id')}
                                style={{
                                    flex: 1, padding: '1rem', border: 'none', background: 'none',
                                    fontWeight: findMode === 'id' ? 700 : 500,
                                    color: findMode === 'id' ? '#6366f1' : '#64748b',
                                    borderBottom: findMode === 'id' ? '2px solid #6366f1' : 'none',
                                    marginBottom: '-2px', cursor: 'pointer'
                                }}
                            >
                                아이디 찾기
                            </button>
                            <button
                                onClick={() => setFindMode('password')}
                                style={{
                                    flex: 1, padding: '1rem', border: 'none', background: 'none',
                                    fontWeight: findMode === 'password' ? 700 : 500,
                                    color: findMode === 'password' ? '#6366f1' : '#64748b',
                                    borderBottom: findMode === 'password' ? '2px solid #6366f1' : 'none',
                                    marginBottom: '-2px', cursor: 'pointer'
                                }}
                            >
                                비밀번호 재설정
                            </button>
                        </div>

                        <form onSubmit={handleFindSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} autoComplete="off">
                            {/* Dummy inputs to fool browser auto-fill */}
                            <input type="text" style={{ display: 'none' }} />
                            <input type="password" style={{ display: 'none' }} />

                            {findMode === 'password' && (
                                <div className="input-group" style={{ marginBottom: 0 }} key="email-group">
                                    <label className="input-label">이메일</label>
                                    <input
                                        key="input-email"
                                        name="search_email"
                                        type="email"
                                        className="input-field"
                                        placeholder="가입한 이메일을 입력하세요"
                                        autoComplete="off"
                                        value={findForm.email}
                                        onChange={e => setFindForm({ ...findForm, email: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <div className="input-group" style={{ marginBottom: 0 }} key="name-group">
                                <label className="input-label">이름</label>
                                <input
                                    key="input-name"
                                    name="search_name"
                                    type="text"
                                    className="input-field"
                                    placeholder="가입한 이름을 입력하세요"
                                    autoComplete="off"
                                    value={findForm.name}
                                    onChange={e => setFindForm({ ...findForm, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: 0 }} key="phone-group">
                                <label className="input-label">전화번호</label>
                                <input
                                    key="input-phone"
                                    name="search_phone"
                                    type="tel"
                                    className="input-field"
                                    placeholder="010-1234-5678"
                                    autoComplete="off"
                                    value={findForm.phone}
                                    onChange={e => setFindForm({ ...findForm, phone: formatPhoneNumber(e.target.value) })}
                                    required
                                />
                            </div>

                            {/* Another dummy input to break the 'text field before password is username' heuristic */}
                            <input type="text" name="dummy_username" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0 }} tabIndex={-1} />

                            {findMode === 'password' && (
                                <div className="input-group" style={{ marginBottom: 0 }} key="password-group">
                                    <label className="input-label">새 비밀번호</label>
                                    <input
                                        key="input-new-password"
                                        name="new-password-reset"
                                        type="password"
                                        className="input-field"
                                        placeholder="새로운 비밀번호 입력"
                                        autoComplete="new-password"
                                        value={findForm.newPassword}
                                        onChange={e => setFindForm({ ...findForm, newPassword: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ marginTop: '1rem', padding: '0.75rem' }}
                                disabled={isFinding}
                            >
                                {isFinding ? '처리 중...' : (findMode === 'id' ? '아이디 찾기' : '비밀번호 재설정')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const FeatureIcon = ({ icon, color, label }: { icon: React.ReactNode, color: string, label: string }) => (
    <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
    }}>
        <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${color}`,
            color: color
        }}>
            {icon}
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--slate-300)', fontWeight: 500 }}>{label}</span>
    </div>
);

const RoleButton = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '0.375rem',
            fontSize: '0.9rem',
            fontWeight: 500,
            background: active ? 'white' : 'transparent',
            color: active ? 'var(--slate-900)' : 'var(--slate-400)',
            boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s',
            border: active ? '1px solid var(--slate-200)' : '1px solid transparent'
        }}
    >
        {children}
    </button>
);
