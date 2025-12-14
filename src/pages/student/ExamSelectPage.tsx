import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, FileText, Clock, AlertCircle } from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import { ExamService } from '../../services/examService';
import { AuthService } from '../../services/authService';
import { Exam } from '../../types';

export const ExamSelectPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const user = AuthService.getCurrentUser();

    // ⭐️ URL에서 과정명 가져오기
    const courseFilter = searchParams.get('course');

    useEffect(() => {
        loadExams();
    }, [courseFilter]);

    const loadExams = async () => {
        // Fetch exams filtered by course if filter parameter exists
        // If courseFilter is present, we pass course NAME? But API expects ID.
        // We have a mismatch: frontend uses Names, backend uses IDs mostly but sometimes names in older code?
        // Let's rely on ExamService.getExamList() which fetches ALL or mock. 
        // Wait, getExamList implementation might be mocked or partial.

        // Let's use getExamsByCourse if filter exists, else get all.
        // But we need to filter by ACTIVE courses the user is enrolled in.

        let allExams: Exam[] = [];

        // Fetch ALL exams first (inefficient but safe for now)
        // Or fetch for each active course.

        // Get active courses from User
        const activeCourseNames = (user?.courseEnrollments || [])
            .filter(enrollment => {
                if (enrollment.status === 'expired') return false;
                if (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()) return false;
                return true;
            })
            .map(e => e.courseName);

        // If we have courseFilter and it is NOT in active courses (and user is not admin), maybe block?
        // But for now just filter.

        // We need to fetch exams for all active courses.
        // We don't have a "get all exams" endpoint, only get by course?
        // Actually ExamService.getExamList calls `getExamsByCourse` for all courses? 
        // Let's check `getExamList` implementation in previous step.
        // Yes, it iterates all courses and fetches exams. So it is compatible.

        allExams = await ExamService.getExamList();

        let filteredExams = allExams.filter(exam =>
            activeCourseNames.includes(exam.courseName || '')
        );

        // ⭐️ 과정 필터가 있으면 추가 필터링
        if (courseFilter) {
            filteredExams = filteredExams.filter(exam => exam.courseName === courseFilter);
        }

        setExams(filteredExams);
        setLoading(false);
    };

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
                    {/* ⭐️ 현재 필터 표시 */}
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
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {exams.map((exam) => (
                            <div key={exam.id} className="glass-card" style={{ padding: '1.5rem', background: 'white', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-100)', color: 'var(--primary-600)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem'
                                }}>
                                    <FileText size={24} />
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>{exam.title}</h3>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--slate-500)', display: 'flex', gap: '1rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} /> {exam.timeLimit}분</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertCircle size={14} /> {exam.questions.length}문항</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate(`/exam/${exam.id}`)}
                                    className="btn btn-primary"
                                    style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}
                                >
                                    시험 응시하기
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};
