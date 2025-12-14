import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, User, Edit, Save, X, BookOpen, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { User as TypeUser, CourseEnrollment } from '../../types';

export const UserManagement = () => {
    const [users, setUsers] = useState<TypeUser[]>([]);
    // ⭐️ Updated Filter State
    const [filter, setFilter] = useState<'all' | 'pendingSignup' | 'pendingCourse' | 'active'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Edit Modal State
    const [editingUser, setEditingUser] = useState<TypeUser | null>(null);
    const [editForm, setEditForm] = useState<{
        name: string,
        email: string,
        phone?: string,
        role: 'student' | 'admin',
        approved: boolean
    }>({ name: '', email: '', phone: '', role: 'student', approved: false });

    // ⭐️ Course Approval Modal State
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [approvalData, setApprovalData] = useState<{
        userId: string;
        courseName: string;
        userName: string;
    } | null>(null);
    const [durationType, setDurationType] = useState<'preset' | 'custom'>('preset');
    const [presetDuration, setPresetDuration] = useState<number | undefined>(3);
    const [customEndDate, setCustomEndDate] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const data = await AuthService.getAllUsers();
        setUsers(data);
    };

    const handleApprove = async (id: string, name: string) => {
        if (confirm(`${name} 님의 가입을 승인하시겠습니까?`)) {
            await AuthService.approveUser(id);
            loadUsers();
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`${name} 님의 계정을 삭제하시겠습니까?`)) {
            await AuthService.deleteUser(id);
            loadUsers();
        }
    };

    // ⭐️ 과정 승인 모달 열기
    const handleApproveCourse = async (userId: string, courseName: string, userName: string) => {
        setApprovalData({ userId, courseName, userName });
        setShowCourseModal(true);
        setDurationType('preset');
        setPresetDuration(3);
        setCustomEndDate('');
    };

    // ⭐️ 과정 승인 처리
    const confirmApproval = async () => {
        if (!approvalData) return;

        let durationMonths: number | undefined;

        if (durationType === 'preset') {
            durationMonths = presetDuration;
        } else {
            if (!customEndDate) {
                alert('만료일을 선택해주세요.');
                return;
            }
            const endDate = new Date(customEndDate);
            const diffMs = endDate.getTime() - Date.now();
            durationMonths = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30));

            if (durationMonths <= 0) {
                alert('만료일은 오늘 이후여야 합니다.');
                return;
            }
        }

        await AuthService.approveCourseRequest(approvalData.userId, approvalData.courseName, durationMonths);
        loadUsers();
        setShowCourseModal(false);
        alert('승인되었습니다.');
    };

    const handleRejectCourse = async (userId: string, courseName: string, userName: string) => {
        if (confirm(`${userName} 님의 "${courseName}" 과정 신청을 거절하시겠습니까?`)) {
            await AuthService.rejectCourseRequest(userId, courseName);
            loadUsers();
        }
    };

    const runEdit = (user: TypeUser) => {
        setEditingUser(user);
        setEditForm({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            approved: user.approved || false
        });
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        try {
            await AuthService.updateUser({ ...editingUser, ...editForm });
            alert('수정되었습니다.');
            setEditingUser(null);
            loadUsers();
        } catch (e) {
            alert('수정 중 오류가 발생했습니다.');
        }
    };

    // ⭐️ Updated Filtering Logic
    const filteredUsers = users.filter(user => {
        if (filter === 'pendingSignup') return !user.approved;
        if (filter === 'pendingCourse') return user.approved && user.pendingCourses && user.pendingCourses.length > 0;
        if (filter === 'active') return user.approved && (!user.pendingCourses || user.pendingCourses.length === 0);
        return true;
    });

    // ⭐️ Counts
    const pendingSignupCount = users.filter(u => !u.approved).length;
    const pendingCourseCount = users.filter(u => u.approved && u.pendingCourses && u.pendingCourses.length > 0).length;

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const durationPresets = [
        { label: '1개월', value: 1 },
        { label: '3개월', value: 3 },
        { label: '6개월', value: 6 },
        { label: '1년', value: 12 },
        { label: '무제한', value: undefined }
    ];

    // ⭐️ 최소 날짜 (오늘)
    const minDate = new Date().toISOString().split('T')[0];

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>수강생 관리</h1>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
                    <button
                        onClick={() => setFilter('all')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600,
                            background: filter === 'all' ? 'white' : 'transparent',
                            color: filter === 'all' ? '#0f172a' : '#64748b',
                            boxShadow: filter === 'all' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        전체 ({users.length})
                    </button>
                    <button
                        onClick={() => setFilter('pendingSignup')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600,
                            background: filter === 'pendingSignup' ? 'white' : 'transparent',
                            color: filter === 'pendingSignup' ? '#dc2626' : '#64748b',
                            boxShadow: filter === 'pendingSignup' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                            display: 'flex', alignItems: 'center', gap: '0.25rem'
                        }}
                    >
                        가입 승인 대기
                        {pendingSignupCount > 0 && (
                            <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontSize: '0.75rem' }}>
                                {pendingSignupCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter('pendingCourse')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600,
                            background: filter === 'pendingCourse' ? 'white' : 'transparent',
                            color: filter === 'pendingCourse' ? '#d97706' : '#64748b',
                            boxShadow: filter === 'pendingCourse' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                            display: 'flex', alignItems: 'center', gap: '0.25rem'
                        }}
                    >
                        과정 승인 대기
                        {pendingCourseCount > 0 && (
                            <span style={{ background: '#fef3c7', color: '#d97706', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontSize: '0.75rem' }}>
                                {pendingCourseCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 600,
                            background: filter === 'active' ? 'white' : 'transparent',
                            color: filter === 'active' ? '#10b981' : '#64748b',
                            boxShadow: filter === 'active' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        정상 이용 ({users.length - pendingSignupCount - pendingCourseCount})
                    </button>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>사용자 목록 ({filteredUsers.length})</div>
                </div>

                {filteredUsers.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                        표시할 사용자가 없습니다.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#f3f4f6' }}>
                        {paginatedUsers.map(user => (
                            <div key={user.id} style={{ background: 'white', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                                    {/* User Info */}
                                    <div style={{ flex: 1, minWidth: '250px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-100)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <User size={20} color="var(--primary-600)" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user.name}</div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>{user.email}</div>
                                            </div>
                                            {user.role === 'admin' && (
                                                <span style={{ padding: '0.25rem 0.75rem', background: '#fef3c7', color: '#92400e', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    관리자
                                                </span>
                                            )}
                                            {!user.approved && (
                                                <span style={{ padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    승인 대기
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginTop: '0.5rem' }}>
                                            전화: {user.phone || '-'}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {!user.approved && (
                                            <button
                                                onClick={() => handleApprove(user.id, user.name)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary-600)', color: 'white', borderRadius: '0.5rem' }}
                                            >
                                                <CheckCircle size={16} /> 승인
                                            </button>
                                        )}
                                        <button
                                            onClick={() => runEdit(user)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--slate-100)', color: 'var(--slate-700)', borderRadius: '0.5rem' }}
                                        >
                                            <Edit size={16} /> 수정
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id, user.name)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem' }}
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Course Info (Students only) */}
                                {user.role === 'student' && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                        {/* Enrolled Courses */}
                                        <div style={{ flex: 1, minWidth: '250px' }}>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                color: '#334155',
                                                marginBottom: '0.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                <BookOpen size={16} color="#10b981" />
                                                승인된 과정 ({user.courseEnrollments?.length || 0})
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {user.courseEnrollments && user.courseEnrollments.length > 0 ? (
                                                    user.courseEnrollments.map((enrollment: CourseEnrollment) => {
                                                        const isExpired = enrollment.status === 'expired' ||
                                                            (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date());
                                                        const daysRemaining = enrollment.expiresAt ?
                                                            Math.ceil((new Date(enrollment.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                                                        return (
                                                            <div key={enrollment.courseName} style={{
                                                                padding: '0.5rem 0.75rem',
                                                                background: isExpired ? '#fee2e2' : '#dcfce7',
                                                                color: isExpired ? '#991b1b' : '#166534',
                                                                borderRadius: '0.375rem',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 500,
                                                                border: `1px solid ${isExpired ? '#fecaca' : '#bbf7d0'}`,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '0.25rem'
                                                            }}>
                                                                <div style={{ fontWeight: 600 }}>{enrollment.courseName}</div>
                                                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                                    {enrollment.expiresAt ? (
                                                                        isExpired ?
                                                                            `❌ 만료됨 (${new Date(enrollment.expiresAt).toLocaleDateString()})` :
                                                                            daysRemaining !== null && daysRemaining <= 7 ?
                                                                                `⚠️ ${daysRemaining}일 남음` :
                                                                                `📅 ${new Date(enrollment.expiresAt).toLocaleDateString()}까지`
                                                                    ) : '♾️ 무제한'}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>없음</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Pending Courses */}
                                        <div style={{ flex: 1, minWidth: '250px' }}>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                color: '#334155',
                                                marginBottom: '0.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                <Clock size={16} color="#f59e0b" />
                                                대기 중인 과정 ({user.pendingCourses?.length || 0})
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {user.pendingCourses && user.pendingCourses.length > 0 ? (
                                                    user.pendingCourses.map((course: string) => (
                                                        <div key={course} style={{
                                                            padding: '0.5rem 0.75rem',
                                                            background: '#fef3c7',
                                                            borderRadius: '0.375rem',
                                                            border: '1px solid #fde68a',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            gap: '0.5rem'
                                                        }}>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#92400e' }}>{course}</span>
                                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                                <button
                                                                    onClick={() => handleApproveCourse(user.id, course, user.name)}
                                                                    style={{
                                                                        padding: '0.25rem 0.75rem',
                                                                        background: '#10b981',
                                                                        color: 'white',
                                                                        borderRadius: '0.25rem',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 600
                                                                    }}
                                                                >
                                                                    승인
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectCourse(user.id, course, user.name)}
                                                                    style={{
                                                                        padding: '0.25rem 0.75rem',
                                                                        background: '#ef4444',
                                                                        color: 'white',
                                                                        borderRadius: '0.25rem',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 600
                                                                    }}
                                                                >
                                                                    거절
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>없음</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {filteredUsers.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderTop: '1px solid #e5e7eb', background: 'white' }}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #e5e7eb',
                                background: currentPage === 1 ? '#f3f4f6' : 'white',
                                color: currentPage === 1 ? '#9ca3af' : '#374151',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                            {currentPage} / {totalPages || 1}
                        </span>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #e5e7eb',
                                background: currentPage === totalPages ? '#f3f4f6' : 'white',
                                color: currentPage === totalPages ? '#9ca3af' : '#374151',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* ⭐️ Course Approval Modal */}
            {showCourseModal && approvalData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }} onClick={() => setShowCourseModal(false)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'white',
                            width: '90%',
                            maxWidth: '500px',
                            borderRadius: '1rem',
                            padding: '2rem',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        {/* Header */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                        과정 승인
                                    </h3>
                                    <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem' }}>
                                        <strong>{approvalData.userName}</strong> 님의 <strong>"{approvalData.courseName}"</strong> 과정
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCourseModal(false)}
                                    style={{ padding: '0.5rem', borderRadius: '0.5rem', background: '#f3f4f6' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Duration Type */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: '#334155' }}>
                                수강 기간 설정 방식
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setDurationType('preset')}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: `2px solid ${durationType === 'preset' ? 'var(--primary-600)' : '#e5e7eb'}`,
                                        background: durationType === 'preset' ? 'var(--primary-50)' : 'white',
                                        color: durationType === 'preset' ? 'var(--primary-600)' : '#6b7280',
                                        fontWeight: 600,
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    📋 프리셋 선택
                                </button>
                                <button
                                    onClick={() => setDurationType('custom')}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: `2px solid ${durationType === 'custom' ? 'var(--primary-600)' : '#e5e7eb'}`,
                                        background: durationType === 'custom' ? 'var(--primary-50)' : 'white',
                                        color: durationType === 'custom' ? 'var(--primary-600)' : '#6b7280',
                                        fontWeight: 600,
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    📅 직접 선택
                                </button>
                            </div>
                        </div>

                        {/* Preset Duration */}
                        {durationType === 'preset' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: '#334155' }}>
                                    기간 선택
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                                    {durationPresets.map(preset => (
                                        <button
                                            key={preset.label}
                                            onClick={() => setPresetDuration(preset.value)}
                                            style={{
                                                padding: '0.75rem 0.5rem',
                                                borderRadius: '0.5rem',
                                                border: `2px solid ${presetDuration === preset.value ? 'var(--primary-600)' : '#e5e7eb'}`,
                                                background: presetDuration === preset.value ? 'var(--primary-600)' : 'white',
                                                color: presetDuration === preset.value ? 'white' : '#6b7280',
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Custom Date */}
                        {durationType === 'custom' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: '#334155' }}>
                                    <Calendar size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                    만료일 선택
                                </label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    min={minDate}
                                    className="input-field"
                                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                                />
                                {customEndDate && (
                                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#eff6ff', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#1e40af' }}>
                                        ℹ️ 선택한 날짜: <strong>{new Date(customEndDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={confirmApproval}
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', fontWeight: 600 }}
                            >
                                승인하기
                            </button>
                            <button
                                onClick={() => setShowCourseModal(false)}
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', fontWeight: 600 }}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }} onClick={() => setEditingUser(null)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'white',
                            width: '90%',
                            maxWidth: '500px',
                            borderRadius: '1rem',
                            padding: '2rem'
                        }}
                    >
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>사용자 수정</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>이름</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="input-field"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>이메일</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="input-field"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>전화번호</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="input-field"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>역할</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'student' | 'admin' })}
                                    className="input-field"
                                    style={{ width: '100%' }}
                                >
                                    <option value="student">수강생</option>
                                    <option value="admin">관리자</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={editForm.approved}
                                        onChange={(e) => setEditForm({ ...editForm, approved: e.target.checked })}
                                    />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>승인됨</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                <button
                                    onClick={handleSaveEdit}
                                    className="btn btn-primary"
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <Save size={16} /> 저장
                                </button>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <X size={16} /> 취소
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
