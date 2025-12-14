import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, AlertCircle, HelpCircle, Send, CheckCircle2 } from 'lucide-react';
import { SupportService } from '../../services/supportService';
import { AuthService } from '../../services/authService';
import { Inquiry } from '../../types';

export const StudentSupportPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);

    // Form State
    const [category, setCategory] = useState<'ERROR' | 'QUESTION' | 'OTHER'>('QUESTION');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadInquiries();
    }, []);

    const loadInquiries = async () => {
        const user = AuthService.getCurrentUser();
        if (user) {
            const data = await SupportService.getInquiriesByUser(user.id);
            setInquiries(data);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = AuthService.getCurrentUser();
        if (!user) return;

        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await SupportService.createInquiry({
                userId: user.id,
                userName: user.name,
                category,
                title,
                content
            });
            alert('문의가 등록되었습니다.');
            setTitle('');
            setContent('');
            setActiveTab('list');
            loadInquiries();
        } catch (error) {
            console.error(error);
            alert('문의 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <button onClick={() => navigate('/student/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1rem' }}>
                    <ChevronLeft size={20} /> 대시보드
                </button>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '1rem', color: '#1e293b' }}>
                    📞 1:1 고객센터
                </h1>
                <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                    학습 중 발생하는 문제나 궁금한 점을 문의해주세요. (운영시간 09:00 ~ 18:00)
                </p>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1px' }}>
                <button
                    onClick={() => setActiveTab('create')}
                    style={{
                        padding: '1rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'create' ? '2px solid #3b82f6' : '2px solid transparent',
                        color: activeTab === 'create' ? '#3b82f6' : '#64748b',
                        fontWeight: activeTab === 'create' ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    문의하기
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                    style={{
                        padding: '1rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'list' ? '2px solid #3b82f6' : '2px solid transparent',
                        color: activeTab === 'list' ? '#3b82f6' : '#64748b',
                        fontWeight: activeTab === 'list' ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    내 문의 내역
                    {inquiries.length > 0 && (
                        <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: '1rem', padding: '0.1rem 0.5rem', fontSize: '0.8rem' }}>
                            {inquiries.length}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'create' ? (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #f1f5f9' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>문의 유형</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {[
                                    { id: 'QUESTION', label: '학습 질문', icon: <HelpCircle size={18} /> },
                                    { id: 'ERROR', label: '오류 신고', icon: <AlertCircle size={18} /> },
                                    { id: 'OTHER', label: '기타 문의', icon: <MessageCircle size={18} /> }
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setCategory(type.id as any)}
                                        style={{
                                            flex: 1,
                                            padding: '1rem',
                                            borderRadius: '0.5rem',
                                            border: category === type.id ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                                            background: category === type.id ? '#eff6ff' : 'white',
                                            color: category === type.id ? '#3b82f6' : '#64748b',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {type.icon}
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>제목</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="문의 제목을 입력해주세요"
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
                            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>내용</label>
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="문의 내용을 상세히 적어주시면 더 빠르고 정확한 답변이 가능합니다."
                                rows={8}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    resize: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                padding: '1rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.7 : 1,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'background 0.2s'
                            }}
                        >
                            {isSubmitting ? '전송 중...' : (
                                <>
                                    <Send size={20} /> 문의 등록하기
                                </>
                            )}
                        </button>
                    </form>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {inquiries.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', background: 'white', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                            <div style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '1rem' }}>
                                등록된 문의 내역이 없습니다.
                            </div>
                            <button
                                onClick={() => setActiveTab('create')}
                                style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                                첫 문의 남기기
                            </button>
                        </div>
                    ) : (
                        inquiries.map((inq) => (
                            <div key={inq.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            background: inq.status === 'RESOLVED' ? '#dcfce7' : '#f1f5f9',
                                            color: inq.status === 'RESOLVED' ? '#16a34a' : '#64748b'
                                        }}>
                                            {inq.status === 'RESOLVED' ? '답변 완료' : '대기 중'}
                                        </span>
                                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                            {new Date(inq.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: inq.category === 'ERROR' ? '#ef4444' : '#3b82f6' }}>
                                        {inq.category === 'ERROR' ? '오류 신고' : inq.category === 'QUESTION' ? '학습 질문' : '기타 문의'}
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
                                    {inq.title}
                                </h3>
                                <p style={{ color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>
                                    {inq.content}
                                </p>

                                {inq.answer && (
                                    <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem', borderLeft: '4px solid #3b82f6' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#3b82f6', fontWeight: 700 }}>
                                            <CheckCircle2 size={18} /> 관리자 답변
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400 }}>{inq.answeredAt && new Date(inq.answeredAt).toLocaleDateString()}</span>
                                        </div>
                                        <p style={{ color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                            {inq.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
