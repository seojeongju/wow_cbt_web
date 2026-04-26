import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Phone, Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import { AuthService } from '../../services/authService';
import { User as UserType } from '../../types';

export const StudentProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(false);

    // Form Stats
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
        setName(currentUser.name);
        setPhone(currentUser.phone);
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!name.trim() || !phone.trim()) {
            alert('이름과 전화번호는 필수 입력 항목입니다.');
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            alert('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        setLoading(true);
        try {
            const updates: any = {
                id: user.id,
                name,
                phone
            };

            if (newPassword) {
                updates.password = newPassword;
            }

            await AuthService.updateUser(updates);

            alert('회원 정보가 수정되었습니다.');
            setNewPassword('');
            setConfirmPassword('');

            // Refresh local user state
            const updatedUser = AuthService.getCurrentUser();
            if (updatedUser) setUser(updatedUser);

        } catch (error) {
            console.error('Profile update failed:', error);
            alert('정보 수정에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <MainLayout>
            <div className="container" style={{ maxWidth: '600px', padding: '2rem 1rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <button
                        onClick={() => navigate('/student/dashboard')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            fontSize: '1rem',
                            marginBottom: '1rem'
                        }}
                    >
                        <ChevronLeft size={20} /> 대시보드
                    </button>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>
                        내 정보 수정
                    </h1>
                </div>

                <div className="glass-card" style={{ padding: '2rem', background: 'white' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Read-only Email */}
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                                이메일 (아이디)
                            </label>
                            <div style={{
                                padding: '1rem',
                                background: '#f1f5f9',
                                borderRadius: '0.5rem',
                                color: '#64748b',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <User size={20} />
                                {user.email}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                * 이메일은 변경할 수 없습니다.
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                                이름
                            </label>
                            <div style={{ position: 'relative' }}>
                                <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="이름을 입력하세요"
                                    style={{
                                        width: '100%',
                                        padding: '1rem 1rem 1rem 3rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '1rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                                전화번호
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="전화번호를 입력하세요 (- 없이 입력)"
                                    style={{
                                        width: '100%',
                                        padding: '1rem 1rem 1rem 3rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '1rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ height: '1px', background: '#e2e8f0', margin: '0.5rem 0' }} />

                        {/* Password Change Section */}
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Lock size={20} /> 비밀번호 변경
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="새 비밀번호 (변경시에만 입력)"
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '1rem',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="새 비밀번호 확인"
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '1rem',
                                            outline: 'none'
                                        }}
                                    />
                                    {newPassword && confirmPassword && (
                                        <div style={{
                                            fontSize: '0.85rem',
                                            marginTop: '0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            color: newPassword === confirmPassword ? '#16a34a' : '#ef4444'
                                        }}>
                                            {newPassword === confirmPassword ? (
                                                <><CheckCircle2 size={14} /> 비밀번호가 일치합니다.</>
                                            ) : (
                                                <><AlertCircle size={14} /> 비밀번호가 일치하지 않습니다.</>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || (newPassword !== confirmPassword && !!newPassword)}
                            style={{
                                padding: '1rem',
                                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                marginTop: '1rem',
                                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                            }}
                        >
                            {loading ? '저장 중...' : (
                                <>
                                    <Save size={20} /> 변경사항 저장
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
};
