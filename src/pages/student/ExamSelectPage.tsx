import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Search, Clock, AlertCircle, FileText, X, CheckCircle, RotateCcw } from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import { ExamService } from '../../services/examService';
import { AuthService } from '../../services/authService';
import { Exam, ExamResult, User } from '../../types';

export const ExamSelectPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [exams, setExams] = useState<Exam[]>([]);
    // const [allExams, setAllExams] = useState<Exam[]>([]); // Removed unused state
    const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // Filter states
    const [searchText, setSearchText] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [selectedTopic, setSelectedTopic] = useState<string>('all');
    const [selectedRound, setSelectedRound] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 'all', 'taken', 'not-taken'
    const [examHistory, setExamHistory] = useState<ExamResult[]>([]);

    // URL에서 과정명 가져오기
    const courseFilter = searchParams.get('course');

    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
    }, [navigate]);

    useEffect(() => {
        if (user) {
            loadExams();
        }
    }, [courseFilter, user]);

    // Apply filters whenever filter values change
    useEffect(() => {
        applyFilters();
    }, [exams, selectedSubject, selectedTopic, selectedRound, selectedStatus, searchText, examHistory]);

    const loadExams = async () => {
        try {
            setLoading(true);
            setError(null);

            const [allExamsList, historyData] = await Promise.all([
                ExamService.getExamList(),
                ExamService.getExamHistory()
            ]);

            setExamHistory(historyData);

            if (!user) {
                setExams([]);
                return;
            }

            const activeEnrollments = (user.courseEnrollments || [])
                .filter(enrollment => {
                    if (enrollment.status === 'expired') return false;
                    if (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()) return false;
                    return enrollment.status === 'active' || enrollment.status === 'approved';
                });

            const activeNames = activeEnrollments.map(e => e.courseName);
            const activeIds = activeEnrollments.map(e => e.courseId);

            let filteredByEnrollment = allExamsList.filter(exam => {
                const examCourse = (exam.courseName || '').trim();
                const matchesName = activeNames.includes(examCourse);
                const matchesId = activeIds.includes(examCourse);
                return matchesName || matchesId;
            });

            if (courseFilter) {
                const targetCourseName = courseFilter.trim();
                const targetEnrollment = activeEnrollments.find(e => e.courseName === targetCourseName);
                const targetCourseId = targetEnrollment?.courseId;

                filteredByEnrollment = filteredByEnrollment.filter(exam => {
                    const examCourse = (exam.courseName || '').trim();
                    return examCourse === targetCourseName || (targetCourseId && examCourse === targetCourseId);
                });
            }

            setExams(filteredByEnrollment);
        } catch (err) {
            console.error('❌ Error loading exams:', err);
            setError('시험 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...exams];

        // Subject filter (중분류)
        if (selectedSubject !== 'all') {
            result = result.filter(exam => exam.subjectName === selectedSubject);
        }

        // Topic filter (소분류 - title)
        if (selectedTopic !== 'all') {
            result = result.filter(exam => exam.title === selectedTopic);
        }

        // Round filter (차시)
        if (selectedRound !== 'all') {
            result = result.filter(exam => exam.round === selectedRound);
        }

        // Status filter (응시 여부)
        if (selectedStatus !== 'all') {
            result = result.filter(exam => {
                const status = getExamStatus(exam.id);
                if (selectedStatus === 'taken') return status?.taken;
                if (selectedStatus === 'not-taken') return !status?.taken;
                return true;
            });
        }

        // Search filter
        if (searchText.trim()) {
            const search = searchText.toLowerCase();
            result = result.filter(exam =>
                exam.title?.toLowerCase().includes(search) ||
                exam.subjectName?.toLowerCase().includes(search) ||
                exam.round?.toLowerCase().includes(search)
            );
        }

        setFilteredExams(result);
    };

    const resetFilters = () => {
        setSelectedSubject('all');
        setSelectedTopic('all');
        setSelectedRound('all');
        setSelectedStatus('all');
        setSearchText('');
    };

    const getExamStatus = (examId: string) => {
        const results = examHistory.filter(r => r.examId === examId);
        if (results.length === 0) return null;

        // Find best score
        const bestResult = results.reduce((prev, current) => {
            return (prev.score > current.score) ? prev : current;
        });

        return {
            taken: true,
            passed: bestResult.passed,
            score: bestResult.score,
            count: results.length
        };
    };

    // ⭐️ Dynamic Options Calculation (Hierarchical)

    // 1. Subjects: Always from full list (exams)
    const subjects = ['all', ...Array.from(new Set(exams.map(e => e.subjectName).filter(Boolean))).sort()];

    // 2. Topics: Filtered by selectedSubject
    const filteredForTopics = selectedSubject === 'all'
        ? exams
        : exams.filter(e => e.subjectName === selectedSubject);
    const topics = ['all', ...Array.from(new Set(filteredForTopics.map(e => e.title).filter(Boolean))).sort()];

    // 3. Rounds: Filtered by selectedSubject AND selectedTopic
    const filteredForRounds = filteredForTopics.filter(e => selectedTopic === 'all' || e.title === selectedTopic);
    const rounds = ['all', ...Array.from(new Set(filteredForRounds.map(e => e.round).filter(Boolean))).sort()];

    const hasActiveFilters = selectedSubject !== 'all' || selectedTopic !== 'all' || selectedRound !== 'all' || selectedStatus !== 'all' || searchText.trim();
    const displayExams = hasActiveFilters || exams.length > 0 ? filteredExams : exams;

    return (
        <MainLayout>
            <div className="container" style={{ padding: '2rem 1rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <button onClick={() => navigate('/student/dashboard')} style={{ display: 'flex', alignItems: 'center', color: 'var(--slate-500)' }}>
                            <ChevronLeft /> 뒤로가기
                        </button>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                            {courseFilter ? `${courseFilter} - ` : ''}실전 모의고사 선택
                        </h1>
                    </div>

                    {/* Filter Toggle & Search Bar */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {/* Search Bar */}
                        <div style={{ flex: '1 1 300px', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                            <input
                                type="text"
                                placeholder="시험 검색..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.75rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid var(--slate-200)',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </div>


                        {/* Reset Button */}
                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '0.75rem',
                                    border: 'none',
                                    background: 'var(--slate-100)',
                                    color: 'var(--slate-600)',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={16} />
                                초기화
                            </button>
                        )}
                    </div>

                    {/* Filter Panel - Always Visible */}
                    <div style={{
                        padding: '1.5rem',
                        background: 'white',
                        borderRadius: '1rem',
                        border: '1px solid var(--slate-200)',
                        marginBottom: '1rem'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            {/* Subject Filter */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
                                    중분류 (과목)
                                </label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => {
                                        setSelectedSubject(e.target.value);
                                        setSelectedTopic('all');
                                        setSelectedRound('all');
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--slate-200)',
                                        fontSize: '0.95rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">전체</option>
                                    {subjects.filter(s => s !== 'all').map(subject => (
                                        <option key={subject} value={subject}>{subject}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Topic Filter */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
                                    소분류 (주제)
                                </label>
                                <select
                                    value={selectedTopic}
                                    onChange={(e) => {
                                        setSelectedTopic(e.target.value);
                                        setSelectedRound('all');
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--slate-200)',
                                        fontSize: '0.95rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">전체</option>
                                    {topics.filter(t => t !== 'all').map(topic => (
                                        <option key={topic} value={topic}>{topic}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Round Filter */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
                                    차시 (회차)
                                </label>
                                <select
                                    value={selectedRound}
                                    onChange={(e) => setSelectedRound(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--slate-200)',
                                        fontSize: '0.95rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">전체</option>
                                    {rounds.filter(r => r !== 'all').map(round => (
                                        <option key={round || ''} value={round || ''}>{round || '미분류'}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
                                    응시 여부
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--slate-200)',
                                        fontSize: '0.95rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">전체</option>
                                    <option value="taken">응시 완료</option>
                                    <option value="not-taken">미응시</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Current Filter Info */}
                    {courseFilter && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            background: '#eff6ff',
                            borderRadius: '0.5rem',
                            border: '1px solid #bfdbfe'
                        }}>
                            <FileText size={16} color="#3b82f6" />
                            <span style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: 600 }}>
                                "{courseFilter}" 과정의 시험만 표시 중
                            </span>
                            <button
                                onClick={() => navigate('/student/exams')}
                                style={{
                                    marginLeft: 'auto',
                                    padding: '0.25rem 0.75rem',
                                    background: '#3b82f6',
                                    color: 'white',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}
                            >
                                전체 보기
                            </button>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>로딩중...</div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#e11d48' }}>
                        <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
                        <p>{error}</p>
                        <button
                            onClick={() => loadExams()}
                            className="btn btn-primary"
                            style={{ marginTop: '1rem' }}
                        >
                            다시 시도
                        </button>
                    </div>
                ) : displayExams.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
                        <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p>{hasActiveFilters ? '검색 조건에 맞는 시험이 없습니다.' : '현재 수강 중인 과정에 등록된 시험이 없습니다.'}</p>
                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="btn btn-secondary"
                                style={{ marginTop: '1rem' }}
                            >
                                필터 초기화
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Results Count */}
                        <div style={{ marginBottom: '1rem', color: 'var(--slate-600)', fontSize: '0.95rem', fontWeight: 500 }}>
                            총 {displayExams.length}개의 시험
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {displayExams.map((exam) => {
                                const status = getExamStatus(exam.id);
                                return (
                                    <div key={exam.id} className="glass-card" style={{
                                        padding: '1.5rem',
                                        background: 'white',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        border: status?.passed ? '1px solid #86efac' : (status?.taken ? '1px solid #fee2e2' : '1px solid white'),
                                        boxShadow: status?.passed ? '0 4px 12px rgba(22, 163, 74, 0.1)' : undefined
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-100)', color: 'var(--primary-600)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                            }}>
                                                <FileText size={24} />
                                            </div>
                                            {status?.taken && (
                                                <div style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '1rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    background: status.passed ? '#dcfce7' : '#fee2e2',
                                                    color: status.passed ? '#15803d' : '#b91c1c',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}>
                                                    {status.passed ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                                    {status.passed ? `합격 (${status.score}점)` : `불합격 (${status.score}점)`}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            {/* 중분류 (과목) */}
                                            {exam.subjectName && (
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--primary-600)',
                                                    fontWeight: 600,
                                                    marginBottom: '0.25rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.025em'
                                                }}>
                                                    {exam.subjectName}
                                                </div>
                                            )}

                                            {/* 소분류 (시험지 제목) */}
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem', lineHeight: 1.3 }}>
                                                {exam.title}
                                            </h3>

                                            {/* 차시 (회차) */}
                                            {exam.round && (
                                                <div style={{
                                                    fontSize: '0.85rem',
                                                    color: 'var(--slate-600)',
                                                    fontWeight: 500,
                                                    marginBottom: '0.5rem'
                                                }}>
                                                    {exam.round}
                                                </div>
                                            )}

                                            <div style={{ fontSize: '0.9rem', color: 'var(--slate-500)', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Clock size={14} /> {exam.timeLimit > 0 ? `${exam.timeLimit}분` : '제한없음'}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <AlertCircle size={14} /> {exam.questions?.length || exam.questionsCount || 0}문항
                                                </span>
                                                {status?.taken && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b' }}>
                                                        <RotateCcw size={14} /> {status.count > 1 ? `${status.count}회 응시` : '1회 응시'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/exam/${exam.id}`)}
                                            style={{
                                                marginTop: 'auto',
                                                width: '100%',
                                                justifyContent: 'center',
                                                padding: '0.8rem',
                                                borderRadius: '0.5rem',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontWeight: 700,
                                                fontSize: '1rem',
                                                background: status?.taken ? 'var(--slate-800)' : 'var(--primary-600)',
                                                color: 'white',
                                                boxShadow: status?.taken ? '0 4px 6px -1px rgba(71, 85, 105, 0.2)' : '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            {status?.taken ? (
                                                <><RotateCcw size={18} /> 재응시하기</>
                                            ) : (
                                                '시험 응시하기'
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
};
