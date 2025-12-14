import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Box, Cpu, ArrowRight, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/authService';

export const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<'student' | 'admin'>('student');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const user = await AuthService.login(email, password);
            if (user) {
                if (user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/student/dashboard');
                }
            } else {
                alert('이메일 또는 비밀번호를 확인해주세요.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('로그인 중 오류가 발생했습니다.');
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
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    position: 'relative',
                    padding: '4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    color: 'white'
                }}>
                    {/* Decorative Circles/Glow */}
                    <div style={{
                        position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px',
                        background: 'var(--primary-600)', filter: 'blur(100px)', opacity: 0.3, zIndex: 0
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px',
                        background: 'var(--accent-500)', filter: 'blur(100px)', opacity: 0.2, zIndex: 0
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
                                <FeatureIcon icon={<Box size={32} />} color="var(--accent-500)" label="3D Modeling" />
                                <FeatureIcon icon={<Layers size={32} />} color="#8b5cf6" label="Slicing" />
                                <FeatureIcon icon={<Cpu size={32} />} color="#10b981" label="Printing" />
                            </div>

                            <h1 style={{ fontSize: '3rem', lineHeight: 1.1, marginBottom: '1.5rem', color: 'white' }}>
                                Start Your <br />
                                <span style={{ color: 'var(--primary-500)' }}>3D Future</span> Today
                            </h1>

                            <p style={{ fontSize: '1.1rem', color: 'var(--slate-300)', maxWidth: '400px', marginBottom: '2rem' }}>
                                와우쓰리디홍대센터 공식 문제은행 서비스.
                                자격증 합격을 위한 스마트한 학습 파트너.
                            </p>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', opacity: 1 }}></span>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', opacity: 0.3 }}></span>
                            </div>
                        </motion.div>
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
                            <p style={{ color: 'var(--text-muted)' }}>계정이 없으신가요? <span onClick={() => navigate('/register')} style={{ color: 'var(--primary-600)', fontWeight: 600, cursor: 'pointer' }}>회원가입</span></p>
                        </div>

                        {/* Role Switcher (Optional, nice touch) */}
                        <div style={{ background: 'var(--slate-100)', padding: '0.25rem', borderRadius: '0.5rem', display: 'flex', marginBottom: '2rem' }}>
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
                                        placeholder="Enter your password"
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
                                    <input type="checkbox" style={{ accentColor: 'var(--primary-600)' }} />
                                    로그인 상태 유지
                                </label>
                                <a href="#" style={{ fontSize: '0.875rem', color: 'var(--primary-600)', fontWeight: 500 }}>비밀번호 찾기</a>
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
        </div>
    );
};

const FeatureIcon = ({ icon, color, label }: { icon: React.ReactNode, color: string, label: string }) => (
    <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${color}`
    }}>
        <div style={{ color: color, marginBottom: '0.25rem' }}>{icon}</div>
        <span style={{ fontSize: '0.7rem', color: 'white', opacity: 0.8 }}>{label}</span>
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
            fontSize: '0.875rem',
            fontWeight: 500,
            background: active ? 'white' : 'transparent',
            color: active ? 'var(--slate-900)' : 'var(--slate-500)',
            boxShadow: active ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
            transition: 'all 0.2s'
        }}
    >
        {children}
    </button>
);
