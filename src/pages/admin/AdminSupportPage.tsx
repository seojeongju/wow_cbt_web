import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MessageCircle, CheckCircle2, User, Clock, Trash2 } from 'lucide-react';
import { SupportService } from '../../services/supportService';
import { Inquiry } from '../../types';

const ITEMS_PER_PAGE = 10;

export const AdminSupportPage = () => {
    const navigate = useNavigate();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Reply State
    const [replyingId, setReplyingId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        loadInquiries();
    }, []);

    const loadInquiries = async () => {
        setLoading(true);
        const data = await SupportService.getAllInquiries();
        // Sort: Pending first, then by date desc
        data.sort((a, b) => {
            if (a.status === b.status) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return a.status === 'PENDING' ? -1 : 1;
        });
        setInquiries(data);
        setLoading(false);
    };

    const handleReplySubmit = async (id: string) => {
        if (!replyContent.trim()) {
            alert('답변 내용을 입력해주세요.');
            return;
        }

        const success = await SupportService.updateInquiry(id, replyContent);
        if (success) {
            alert('답변이 등록되었습니다.');
            setReplyingId(null);
            setReplyContent('');
            loadInquiries();
        } else {
            alert('답변 등록 실패');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('정말로 이 문의 내역을 삭제하시겠습니까?')) {
            const success = await SupportService.deleteInquiry(id);
            if (success) {
                alert('삭제되었습니다.');
                loadInquiries();
            } else {
                alert('삭제 실패');
            }
        }
    };

    const filteredInquiries = filter === 'ALL'
        ? inquiries
        : inquiries.filter(i => i.status === filter);

    // Pagination
    const totalPages = Math.ceil(filteredInquiries.length / ITEMS_PER_PAGE);
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedInquiries = filteredInquiries.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    const handleFilterChange = (f: 'ALL' | 'PENDING' | 'RESOLVED') => {
        setFilter(f);
        setCurrentPage(1); // Reset to first page on filter change
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <button onClick={() => navigate('/admin/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1rem', marginBottom: '1rem' }}>
                    <ChevronLeft size={18} /> 대시보드
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>
                            💬 1:1 문의 관리
                        </h2>
                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                            수강생들의 문의를 확인하고 답변을 등록합니다.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                {['ALL', 'PENDING', 'RESOLVED'].map((f) => (
                    <button
                        key={f}
                        onClick={() => handleFilterChange(f as any)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '2rem',
                            border: 'none',
                            background: filter === f ? '#3b82f6' : 'white',
                            color: filter === f ? 'white' : '#64748b',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {f === 'ALL' ? '전체 문의' : f === 'PENDING' ? '답변 대기' : '처리 완료'}
                        <span style={{ marginLeft: '0.5rem', opacity: 0.8, fontSize: '0.9rem' }}>
                            {inquiries.filter(i => f === 'ALL' ? true : i.status === f).length}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>로딩 중...</div>
            ) : filteredInquiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '1.2rem', color: '#94a3b8' }}>해당하는 문의가 없습니다.</div>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {paginatedInquiries.map((inq) => (
                            <div key={inq.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
                                        }}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{inq.userName}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Clock size={14} /> {new Date(inq.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{
                                            padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700,
                                            background: inq.status === 'PENDING' ? '#fee2e2' : '#dcfce7',
                                            color: inq.status === 'PENDING' ? '#ef4444' : '#16a34a'
                                        }}>
                                            {inq.status === 'PENDING' ? '답변 필요' : '처리 완료'}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(inq.id)}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1',
                                                padding: '0.5rem', borderRadius: '0.5rem', transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'none'; }}
                                            title="문의 내역 삭제"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div style={{ paddingLeft: '3.5rem' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: inq.category === 'ERROR' ? '#ef4444' : '#3b82f6', marginRight: '0.5rem' }}>
                                            [{inq.category === 'ERROR' ? '오류 신고' : inq.category === 'QUESTION' ? '학습 질문' : '기타 문의'}]
                                        </span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>{inq.title}</span>
                                    </div>
                                    <p style={{ color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem' }}>
                                        {inq.content}
                                    </p>

                                    {/* Answer Section */}
                                    {inq.status === 'RESOLVED' ? (
                                        <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #dbeafe' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#2563eb', fontWeight: 700 }}>
                                                <CheckCircle2 size={18} /> 답변 완료
                                                <span style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 400 }}>{inq.answeredAt && new Date(inq.answeredAt).toLocaleString()}</span>
                                            </div>
                                            <p style={{ color: '#1e40af', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                {inq.answer}
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            {replyingId === inq.id ? (
                                                <div style={{ marginTop: '1rem' }}>
                                                    <textarea
                                                        value={replyContent}
                                                        onChange={e => setReplyContent(e.target.value)}
                                                        placeholder="답변을 입력하세요..."
                                                        rows={5}
                                                        style={{
                                                            width: '100%', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1',
                                                            marginBottom: '1rem', fontFamily: 'inherit', resize: 'vertical'
                                                        }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => { setReplyingId(null); setReplyContent(''); }}
                                                            style={{ padding: '0.75rem 1.5rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '0.5rem', cursor: 'pointer', color: '#64748b' }}
                                                        >
                                                            취소
                                                        </button>
                                                        <button
                                                            onClick={() => handleReplySubmit(inq.id)}
                                                            style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', color: 'white', fontWeight: 600 }}
                                                        >
                                                            답변 등록
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => { setReplyingId(inq.id); setReplyContent(''); }}
                                                    style={{
                                                        padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white',
                                                        border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600,
                                                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                                                    }}
                                                >
                                                    <MessageCircle size={18} /> 답변하기
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginTop: '2rem',
                            padding: '1rem',
                            background: 'white',
                            borderRadius: '1rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem',
                                    background: currentPage === 1 ? '#f1f5f9' : 'white',
                                    color: currentPage === 1 ? '#94a3b8' : '#334155',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontWeight: 500
                                }}
                            >
                                <ChevronLeft size={16} /> 이전
                            </button>

                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        if (totalPages <= 7) return true;
                                        if (page === 1 || page === totalPages) return true;
                                        if (Math.abs(page - currentPage) <= 1) return true;
                                        return false;
                                    })
                                    .map((page, idx, arr) => (
                                        <>
                                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                                                <span key={`ellipsis-${page}`} style={{ padding: '0.5rem', color: '#94a3b8' }}>...</span>
                                            )}
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    border: currentPage === page ? 'none' : '1px solid #e2e8f0',
                                                    borderRadius: '0.5rem',
                                                    background: currentPage === page ? '#3b82f6' : 'white',
                                                    color: currentPage === page ? 'white' : '#334155',
                                                    cursor: 'pointer',
                                                    fontWeight: 600
                                                }}
                                            >
                                                {page}
                                            </button>
                                        </>
                                    ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: '0.5rem 1rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem',
                                    background: currentPage === totalPages ? '#f1f5f9' : 'white',
                                    color: currentPage === totalPages ? '#94a3b8' : '#334155',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontWeight: 500
                                }}
                            >
                                다음 <ChevronRight size={16} />
                            </button>
                        </div>
                    )}

                    {/* Page Info */}
                    <div style={{ textAlign: 'center', marginTop: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                        총 {filteredInquiries.length}건 중 {startIdx + 1}-{Math.min(startIdx + ITEMS_PER_PAGE, filteredInquiries.length)}건 표시
                    </div>
                </>
            )}
        </div>
    );
};
