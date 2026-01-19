import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight, ChevronLeft, Search, CheckCircle,
    X, Eye, Save, ArrowLeft,
    CheckSquare, Square
} from 'lucide-react';
import { Question, Course } from '../../types';
import { CourseService } from '../../services/courseService';
import { SubjectService } from '../../services/subjectService';
import { ExamService } from '../../services/examService';
import { motion } from 'framer-motion';

type Step = 1 | 2 | 3 | 4;
type SelectionMode = 'manual' | 'random';

export const MockExamGenerator = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<Step>(1);

    // Step 1: 문제 선택
    const [courses, setCourses] = useState<Course[]>([]);
    const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
    const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
    const [categories, setCategories] = useState<string[]>([]);

    // Step 2: 출제 옵션
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('manual');
    const [randomOptions, setRandomOptions] = useState({
        totalQuestions: 20,
        distributionType: 'random' as 'random' | 'equal' | 'custom',
        categoryQuestions: {} as { [category: string]: number }
    });
    const [selectedQuestionsOrder, setSelectedQuestionsOrder] = useState<Question[]>([]);

    // Step 3: 시험 설정
    const [examSettings, setExamSettings] = useState({
        title: '',
        timeLimit: 60,
        passScore: 60,
        description: '',
        courseId: '',
        subjectId: '',
        // 🆕 Advanced grading criteria
        averagePassScore: null as number | null,
        useAverageScore: false,
        subjectMinScores: {} as { [subjectId: string]: number },
        useSubjectMinScore: false
    });

    // Step 4: 미리보기
    const [isGenerating, setIsGenerating] = useState(false);

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        const courseList = await CourseService.getCourses();
        setCourses(courseList);
        // Don't load all subjects initially - load them when a course is selected
    };

    // ⭐ Load subjects when course changes
    useEffect(() => {
        const loadSubjects = async () => {
            if (selectedCourseId) {
                const subjectList = await SubjectService.getSubjects(selectedCourseId);
                setSubjects(subjectList);
            } else {
                setSubjects([]);
            }
        };
        loadSubjects();
    }, [selectedCourseId]);

    // Load questions when filters change
    useEffect(() => {
        if (selectedCourseId) {
            loadQuestions();
        } else {
            setAllQuestions([]);
            setFilteredQuestions([]);
        }
    }, [selectedCourseId, selectedSubjectId]);

    // Filter questions
    useEffect(() => {
        let filtered = [...allQuestions];

        if (searchKeyword) {
            filtered = filtered.filter(q =>
                q.text.toLowerCase().includes(searchKeyword.toLowerCase())
            );
        }

        if (selectedCategory) {
            filtered = filtered.filter(q => q.category === selectedCategory);
        }

        setFilteredQuestions(filtered);
    }, [allQuestions, searchKeyword, selectedCategory]);

    // Extract categories
    useEffect(() => {
        const cats = Array.from(new Set(allQuestions.map(q => q.category))).sort();
        setCategories(cats);
    }, [allQuestions]);

    const loadQuestions = async () => {
        try {
            const response = await fetch(
                `/api/questions?courseId=${selectedCourseId}${selectedSubjectId ? `&subjectId=${selectedSubjectId}` : ''}`
            );
            const data = await response.json();
            if (data.success && data.questions) {
                const questions = data.questions.map((q: any) => ({
                    id: q.id,
                    category: q.category,
                    text: q.text,
                    imageUrl: q.image_url,
                    options: q.options || [],
                    correctAnswer: q.correct_answer,
                    explanation: q.explanation
                }));
                setAllQuestions(questions);
                setFilteredQuestions(questions);
            }
        } catch (error) {
            console.error('Load questions error:', error);
            alert('문제를 불러오는 중 오류가 발생했습니다.');
        }
    };

    const toggleQuestionSelection = (questionId: string) => {
        const newSet = new Set(selectedQuestionIds);
        if (newSet.has(questionId)) {
            newSet.delete(questionId);
        } else {
            newSet.add(questionId);
        }
        setSelectedQuestionIds(newSet);
    };

    const selectAllQuestions = () => {
        const allIds = new Set(filteredQuestions.map(q => q.id));
        setSelectedQuestionIds(allIds);
    };

    const deselectAllQuestions = () => {
        setSelectedQuestionIds(new Set());
    };

    const handleRandomSelection = (options = randomOptions): Set<string> => {
        if (filteredQuestions.length === 0) {
            alert('선택 가능한 문제가 없습니다.');
            return new Set();
        }

        if (options.distributionType === 'custom') {
            // 카테고리별 지정 문항수
            const categoryGroups: { [key: string]: Question[] } = {};
            filteredQuestions.forEach(q => {
                if (!categoryGroups[q.category]) {
                    categoryGroups[q.category] = [];
                }
                categoryGroups[q.category].push(q);
            });

            const newSelected = new Set<string>();

            // 각 카테고리별로 지정된 문항수만큼 선택
            Object.entries(options.categoryQuestions).forEach(([category, count]) => {
                const group = categoryGroups[category];
                if (group && count > 0) {
                    const shuffled = [...group].sort(() => Math.random() - 0.5);
                    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
                    selected.forEach(q => newSelected.add(q.id));
                }
            });

            return newSelected;
        } else if (options.distributionType === 'equal') {
            // 카테고리별 균등 분배
            const categoryGroups: { [key: string]: Question[] } = {};
            filteredQuestions.forEach(q => {
                if (!categoryGroups[q.category]) {
                    categoryGroups[q.category] = [];
                }
                categoryGroups[q.category].push(q);
            });

            const numCategories = Object.keys(categoryGroups).length;
            if (numCategories === 0) return new Set();

            const questionsPerCategory = Math.floor(options.totalQuestions / numCategories);
            const remainder = options.totalQuestions % numCategories;
            const newSelected = new Set<string>();

            let selectedCount = 0;
            Object.values(categoryGroups).forEach((group, index) => {
                const shuffled = [...group].sort(() => Math.random() - 0.5);
                const count = questionsPerCategory + (index < remainder ? 1 : 0);
                shuffled.slice(0, Math.min(count, shuffled.length)).forEach(q => {
                    newSelected.add(q.id);
                    selectedCount++;
                });
            });

            // 부족한 경우 추가 선택
            if (selectedCount < options.totalQuestions) {
                const remaining = filteredQuestions.filter(q => !newSelected.has(q.id));
                const shuffled = [...remaining].sort(() => Math.random() - 0.5);
                const needed = options.totalQuestions - selectedCount;
                shuffled.slice(0, needed).forEach(q => newSelected.add(q.id));
            }

            return newSelected;
        } else {
            // 완전 랜덤
            const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(options.totalQuestions, shuffled.length));
            return new Set(selected.map(q => q.id));
        }
    };

    const proceedToStep2 = () => {
        if (selectedQuestionIds.size === 0) {
            alert('최소 1개 이상의 문제를 선택해주세요.');
            return;
        }

        const selected = allQuestions.filter(q => selectedQuestionIds.has(q.id));
        setSelectedQuestionsOrder(selected);
        setCurrentStep(2);
    };

    const proceedToStep3 = () => {
        let finalSelectedIds: Set<string>;

        if (selectionMode === 'random') {
            // 자동 출제: 최종 확인을 위해 다시 선택 (이미 Step 2에서 선택되었지만 재확인)
            finalSelectedIds = handleRandomSelection();
            if (finalSelectedIds.size === 0) {
                alert('문제를 선택할 수 없습니다. 필터 조건을 확인해주세요.');
                return;
            }
            setSelectedQuestionIds(finalSelectedIds);
        } else {
            // 수동 출제: 기존 선택 유지
            finalSelectedIds = selectedQuestionIds;
            if (finalSelectedIds.size === 0) {
                alert('최소 1개 이상의 문제를 선택해주세요.');
                return;
            }
        }

        const selected = allQuestions.filter(q => finalSelectedIds.has(q.id));
        if (selected.length === 0) {
            alert('선택된 문제가 없습니다.');
            return;
        }
        setSelectedQuestionsOrder(selected);
        setExamSettings(prev => ({
            ...prev,
            courseId: selectedCourseId,
            subjectId: selectedSubjectId
        }));
        setCurrentStep(3);
    };

    const proceedToStep4 = () => {
        if (!examSettings.title.trim()) {
            alert('시험 제목을 입력해주세요.');
            return;
        }
        if (selectedQuestionsOrder.length === 0) {
            alert('선택된 문제가 없습니다.');
            return;
        }
        setCurrentStep(4);
    };

    const generateExam = async () => {
        setIsGenerating(true);
        try {
            const result = await ExamService.generateMockExam({
                title: examSettings.title,
                courseId: examSettings.courseId,
                subjectId: examSettings.subjectId || undefined,
                timeLimit: examSettings.timeLimit,
                passScore: examSettings.passScore,
                description: examSettings.description,
                questionIds: selectedQuestionsOrder.map(q => q.id),
                mode: selectionMode,
                randomOptions: selectionMode === 'random' ? randomOptions : undefined,
                // 🆕 Advanced grading criteria
                averagePassScore: examSettings.useAverageScore ? examSettings.averagePassScore : undefined,
                useAverageScore: examSettings.useAverageScore,
                subjectMinScores: examSettings.useSubjectMinScore ? examSettings.subjectMinScores : undefined,
                useSubjectMinScore: examSettings.useSubjectMinScore
            });

            if (result.success && result.examId) {
                alert('모의고사가 성공적으로 생성되었습니다!');
                navigate('/admin/questions');
            } else {
                alert(result.message || '모의고사 생성 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Generate exam error:', error);
            alert('모의고사 생성 중 오류가 발생했습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

    const getCategoryCount = (category: string) => {
        return selectedQuestionsOrder.filter(q => q.category === category).length;
    };

    // 🆕 과목별 문제 분류 헬퍼 함수
    const getSubjectDistribution = () => {
        const distribution: { [subjectId: string]: { name: string; questions: Question[]; count: number } } = {};

        selectedQuestionsOrder.forEach(question => {
            // subjectId가 있으면 사용, 없으면 'general' 사용
            const sid = question.subjectId || selectedSubjectId || 'general';
            const subjectName = subjects.find(s => s.id === sid)?.name || '일반';

            if (!distribution[sid]) {
                distribution[sid] = {
                    name: subjectName,
                    questions: [],
                    count: 0
                };
            }

            distribution[sid].questions.push(question);
            distribution[sid].count++;
        });

        return distribution;
    };

    // 🆕 과목별 기본 과락 점수 자동 계산 (40% 기준)
    const getDefaultSubjectMinScore = () => {
        return 40; // 100점 만점 기준 40점
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/admin/questions')}
                    style={{
                        padding: '0.5rem',
                        background: 'transparent',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ArrowLeft size={20} color="#64748b" />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                        모의고사 출제
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                        문제은행에서 문제를 선택하여 모의고사를 생성합니다
                    </p>
                </div>
            </div>

            {/* Step Indicator */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'white',
                borderRadius: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                {[1, 2, 3, 4].map((step) => (
                    <div key={step} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: currentStep >= step ? '#6366f1' : '#e2e8f0',
                                color: currentStep >= step ? 'white' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.875rem'
                            }}>
                                {currentStep > step ? <CheckCircle size={20} /> : step}
                            </div>
                            <div style={{ marginLeft: '0.75rem', flex: 1 }}>
                                <div style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: currentStep >= step ? '#1e293b' : '#94a3b8'
                                }}>
                                    {step === 1 && '문제 선택'}
                                    {step === 2 && '출제 옵션'}
                                    {step === 3 && '시험 설정'}
                                    {step === 4 && '미리보기'}
                                </div>
                            </div>
                        </div>
                        {step < 4 && (
                            <ChevronRight
                                size={20}
                                color={currentStep > step ? '#6366f1' : '#cbd5e1'}
                                style={{ margin: '0 1rem' }}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: 문제 선택 */}
            {currentStep === 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '2rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                >
                    {/* Filters */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                            필터 설정
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1rem'
                        }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                    과정
                                </label>
                                <select
                                    value={selectedCourseId}
                                    onChange={(e) => {
                                        setSelectedCourseId(e.target.value);
                                        setSelectedSubjectId('');
                                        setSelectedQuestionIds(new Set());
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    <option value="">전체 과정</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                    과목
                                </label>
                                <select
                                    value={selectedSubjectId}
                                    onChange={(e) => {
                                        setSelectedSubjectId(e.target.value);
                                        setSelectedQuestionIds(new Set());
                                    }}
                                    disabled={!selectedCourseId}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        opacity: selectedCourseId ? 1 : 0.5
                                    }}
                                >
                                    <option value="">전체 과목</option>
                                    {subjects.map(subject => (
                                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                    카테고리
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    <option value="">전체 카테고리</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                                    검색
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={18} style={{
                                        position: 'absolute',
                                        left: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#94a3b8'
                                    }} />
                                    <input
                                        type="text"
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        placeholder="문제 내용 검색..."
                                        style={{
                                            width: '100%',
                                            padding: '0.625rem 0.625rem 0.625rem 2.5rem',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.875rem'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Question List */}
                    <div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem'
                        }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                    문제 목록
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                    총 {filteredQuestions.length}개 문제 중 {selectedQuestionIds.size}개 선택됨
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={selectAllQuestions}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: '#f1f5f9',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    전체 선택
                                </button>
                                <button
                                    onClick={deselectAllQuestions}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: '#f1f5f9',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    전체 해제
                                </button>
                            </div>
                        </div>

                        {!selectedCourseId ? (
                            <div style={{
                                padding: '3rem',
                                textAlign: 'center',
                                color: '#94a3b8',
                                background: '#f8fafc',
                                borderRadius: '0.5rem'
                            }}>
                                과정을 선택하면 해당 과정의 문제가 표시됩니다.
                            </div>
                        ) : filteredQuestions.length === 0 ? (
                            <div style={{
                                padding: '3rem',
                                textAlign: 'center',
                                color: '#94a3b8',
                                background: '#f8fafc',
                                borderRadius: '0.5rem'
                            }}>
                                선택한 조건에 맞는 문제가 없습니다.
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gap: '0.75rem',
                                maxHeight: '600px',
                                overflowY: 'auto'
                            }}>
                                {filteredQuestions.map((question) => (
                                    <div
                                        key={question.id}
                                        style={{
                                            padding: '1rem',
                                            border: selectedQuestionIds.has(question.id)
                                                ? '2px solid #6366f1'
                                                : '1px solid #e2e8f0',
                                            borderRadius: '0.75rem',
                                            background: selectedQuestionIds.has(question.id)
                                                ? '#eef2ff'
                                                : 'white',
                                            display: 'flex',
                                            alignItems: 'start',
                                            gap: '1rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => toggleQuestionSelection(question.id)}
                                    >
                                        <div style={{ marginTop: '0.25rem' }}>
                                            {selectedQuestionIds.has(question.id) ? (
                                                <CheckSquare size={20} color="#6366f1" />
                                            ) : (
                                                <Square size={20} color="#cbd5e1" />
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'start',
                                                marginBottom: '0.5rem'
                                            }}>
                                                <div>
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem',
                                                        background: '#e0e7ff',
                                                        color: '#6366f1',
                                                        borderRadius: '0.25rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        marginRight: '0.5rem'
                                                    }}>
                                                        {question.category}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewQuestion(question);
                                                    }}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        background: 'transparent',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '0.25rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    <Eye size={14} /> 미리보기
                                                </button>
                                            </div>
                                            <p style={{
                                                fontSize: '0.875rem',
                                                color: '#1e293b',
                                                lineHeight: 1.5,
                                                margin: 0,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {question.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: '2rem',
                        paddingTop: '2rem',
                        borderTop: '1px solid #e2e8f0'
                    }}>
                        <button
                            onClick={proceedToStep2}
                            disabled={selectedQuestionIds.size === 0}
                            style={{
                                padding: '0.75rem 2rem',
                                background: selectedQuestionIds.size === 0 ? '#e2e8f0' : '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: selectedQuestionIds.size === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            다음 단계 <ChevronRight size={18} />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Step 2: 출제 옵션 */}
            {currentStep === 2 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '2rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                >
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                        출제 방식 선택
                    </h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '1rem',
                        marginBottom: '2rem'
                    }}>
                        <button
                            onClick={() => setSelectionMode('manual')}
                            style={{
                                padding: '1.5rem',
                                border: selectionMode === 'manual' ? '2px solid #6366f1' : '1px solid #e2e8f0',
                                borderRadius: '0.75rem',
                                background: selectionMode === 'manual' ? '#eef2ff' : 'white',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                수동 출제
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                선택한 문제를 그대로 사용합니다
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                setSelectionMode('random');
                                // 자동 출제 선택 시 즉시 랜덤 선택 실행
                                const newSelected = handleRandomSelection(randomOptions);
                                if (newSelected.size > 0) {
                                    setSelectedQuestionIds(newSelected);
                                } else {
                                    alert('선택 가능한 문제가 없습니다. 필터 조건을 확인해주세요.');
                                }
                            }}
                            style={{
                                padding: '1.5rem',
                                border: selectionMode === 'random' ? '2px solid #6366f1' : '1px solid #e2e8f0',
                                borderRadius: '0.75rem',
                                background: selectionMode === 'random' ? '#eef2ff' : 'white',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                자동 출제 (랜덤)
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                필터링된 문제 중에서 랜덤으로 출제합니다
                            </div>
                        </button>
                    </div>

                    {selectionMode === 'random' && (
                        <div style={{
                            padding: '1.5rem',
                            background: '#f8fafc',
                            borderRadius: '0.75rem',
                            marginBottom: '2rem'
                        }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    출제 문제 수
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={filteredQuestions.length}
                                    value={randomOptions.totalQuestions}
                                    onChange={(e) => {
                                        const newValue = parseInt(e.target.value) || 1;
                                        const newOptions = {
                                            ...randomOptions,
                                            totalQuestions: newValue
                                        };
                                        setRandomOptions(newOptions);
                                        // 자동 출제 모드일 때 문제 수 변경 시 즉시 재선택
                                        if (selectionMode === 'random') {
                                            const newSelected = handleRandomSelection(newOptions);
                                            if (newSelected.size > 0) {
                                                setSelectedQuestionIds(newSelected);
                                            }
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem'
                                    }}
                                />
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                    최대 {filteredQuestions.length}개까지 선택 가능
                                </p>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    분배 방식
                                </label>
                                <select
                                    value={randomOptions.distributionType}
                                    onChange={(e) => {
                                        const newOptions = {
                                            ...randomOptions,
                                            distributionType: e.target.value as 'random' | 'equal' | 'custom'
                                        };
                                        setRandomOptions(newOptions);
                                        // 분배 방식 변경 시 즉시 재선택 (custom은 제외)
                                        if (selectionMode === 'random' && newOptions.distributionType !== 'custom') {
                                            const newSelected = handleRandomSelection(newOptions);
                                            if (newSelected.size > 0) {
                                                setSelectedQuestionIds(newSelected);
                                            }
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    <option value="random">완전 랜덤</option>
                                    <option value="equal">카테고리별 균등 분배</option>
                                    <option value="custom">카테고리별 지정</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Category-wise Question Count Input */}
                    {selectionMode === 'random' && randomOptions.distributionType === 'custom' && (
                        <div style={{
                            padding: '1.5rem',
                            background: '#f8fafc',
                            borderRadius: '0.75rem',
                            marginBottom: '2rem'
                        }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                                카테고리별 문항수 지정
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                                각 카테고리별로 출제할 문항수를 입력하세요.
                            </p>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                gap: '1rem'
                            }}>
                                {categories.map(category => {
                                    const availableCount = filteredQuestions.filter(q => q.category === category).length;
                                    const currentCount = randomOptions.categoryQuestions[category] || 0;

                                    return (
                                        <div key={category} style={{
                                            padding: '1rem',
                                            background: 'white',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                marginBottom: '0.5rem',
                                                color: '#1e293b'
                                            }}>
                                                {category}
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={availableCount}
                                                value={currentCount}
                                                onChange={(e) => {
                                                    const newValue = Math.max(0, Math.min(parseInt(e.target.value) || 0, availableCount));
                                                    const newCategoryQuestions = {
                                                        ...randomOptions.categoryQuestions,
                                                        [category]: newValue
                                                    };
                                                    setRandomOptions({
                                                        ...randomOptions,
                                                        categoryQuestions: newCategoryQuestions
                                                    });
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '0.375rem',
                                                    fontSize: '0.875rem',
                                                    marginBottom: '0.5rem'
                                                }}
                                            />
                                            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                                                최대 {availableCount}개 가능
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                background: '#eef2ff',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                                    총 문항수
                                </span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#6366f1' }}>
                                    {Object.values(randomOptions.categoryQuestions).reduce((sum: number, count) => sum + (count as number || 0), 0)}개
                                </span>
                            </div>

                            <button
                                onClick={() => {
                                    const newSelected = handleRandomSelection(randomOptions);
                                    if (newSelected.size > 0) {
                                        setSelectedQuestionIds(newSelected);
                                    } else {
                                        alert('선택 가능한 문제가 없습니다.');
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    marginTop: '1rem',
                                    padding: '0.75rem',
                                    background: '#6366f1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                문제 선택 적용
                            </button>
                        </div>
                    )}

                    {/* Selected Questions Preview */}
                    <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                            {selectionMode === 'random'
                                ? `선택된 문제 (${selectedQuestionIds.size}개 / 설정: ${randomOptions.totalQuestions}개)`
                                : `선택된 문제 (${selectedQuestionIds.size}개)`
                            }
                        </h4>
                        <div style={{
                            maxHeight: '400px',
                            overflowY: 'auto',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            padding: '1rem'
                        }}>
                            {allQuestions
                                .filter(q => selectedQuestionIds.has(q.id))
                                .map((question, index) => (
                                    <div
                                        key={question.id}
                                        style={{
                                            padding: '0.75rem',
                                            background: '#f8fafc',
                                            borderRadius: '0.5rem',
                                            marginBottom: '0.5rem',
                                            display: 'flex',
                                            alignItems: 'start',
                                            gap: '0.75rem'
                                        }}
                                    >
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: '#6366f1',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            flexShrink: 0
                                        }}>
                                            {index + 1}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: '#6366f1',
                                                fontWeight: 600,
                                                marginBottom: '0.25rem'
                                            }}>
                                                {question.category}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>
                                                {question.text.substring(0, 100)}...
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '2rem',
                        paddingTop: '2rem',
                        borderTop: '1px solid #e2e8f0'
                    }}>
                        <button
                            onClick={() => setCurrentStep(1)}
                            style={{
                                padding: '0.75rem 2rem',
                                background: '#f1f5f9',
                                color: '#475569',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <ChevronLeft size={18} /> 이전
                        </button>
                        <button
                            onClick={proceedToStep3}
                            style={{
                                padding: '0.75rem 2rem',
                                background: '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            다음 단계 <ChevronRight size={18} />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Step 3: 시험 설정 */}
            {currentStep === 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '2rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                >
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                        시험 정보 설정
                    </h3>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                시험 제목 <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={examSettings.title}
                                onChange={(e) => setExamSettings({ ...examSettings, title: e.target.value })}
                                placeholder="예: 2025년 1차 모의고사"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    시간 제한 (분)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={examSettings.timeLimit}
                                    onChange={(e) => setExamSettings({ ...examSettings, timeLimit: parseInt(e.target.value) || 60 })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    전체 합격 점수 (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={examSettings.passScore}
                                    onChange={(e) => setExamSettings({ ...examSettings, passScore: parseInt(e.target.value) || 60 })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>
                        </div>

                        {/* 🆕 평균 점수 기준 설정 */}
                        <div style={{
                            padding: '1.5rem',
                            background: '#f8fafc',
                            borderRadius: '0.75rem',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={examSettings.useAverageScore}
                                        onChange={(e) => setExamSettings({
                                            ...examSettings,
                                            useAverageScore: e.target.checked,
                                            averagePassScore: e.target.checked ? 60 : null
                                        })}
                                        style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
                                    />
                                    평균 점수 기준 사용
                                </label>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', marginLeft: '1.625rem' }}>
                                    모든 과목의 평균 점수가 기준 이상이어야 합격 처리됩니다
                                </p>
                            </div>

                            {examSettings.useAverageScore && (
                                <div style={{ marginLeft: '1.625rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        평균 합격 점수 (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={examSettings.averagePassScore || 60}
                                        onChange={(e) => setExamSettings({
                                            ...examSettings,
                                            averagePassScore: parseInt(e.target.value) || 60
                                        })}
                                        style={{
                                            width: '200px',
                                            padding: '0.625rem',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.875rem',
                                            background: 'white'
                                        }}
                                    />
                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                                        점 이상
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* 🆕 과목별 과락 설정 */}
                        <div style={{
                            padding: '1.5rem',
                            background: '#f8fafc',
                            borderRadius: '0.75rem',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={examSettings.useSubjectMinScore}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            const distribution = getSubjectDistribution();
                                            const defaultScores: { [key: string]: number } = {};

                                            if (isChecked) {
                                                Object.keys(distribution).forEach(subjectId => {
                                                    defaultScores[subjectId] = getDefaultSubjectMinScore();
                                                });
                                            }

                                            setExamSettings({
                                                ...examSettings,
                                                useSubjectMinScore: isChecked,
                                                subjectMinScores: isChecked ? defaultScores : {}
                                            });
                                        }}
                                        style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
                                    />
                                    과목별 과락 기준 사용
                                </label>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', marginLeft: '1.625rem' }}>
                                    각 과목별로 최소 득점 기준을 설정할 수 있습니다
                                </p>
                            </div>

                            {examSettings.useSubjectMinScore && (() => {
                                const distribution = getSubjectDistribution();
                                return (
                                    <div style={{ marginLeft: '1.625rem', display: 'grid', gap: '1rem' }}>
                                        {Object.entries(distribution).map(([subjectId, data]) => (
                                            <div key={subjectId} style={{
                                                padding: '1rem',
                                                background: 'white',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                                                            {data.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                            문제 {data.count}개
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <label style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                            최소 점수:
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={examSettings.subjectMinScores[subjectId] || 40}
                                                            onChange={(e) => setExamSettings({
                                                                ...examSettings,
                                                                subjectMinScores: {
                                                                    ...examSettings.subjectMinScores,
                                                                    [subjectId]: parseInt(e.target.value) || 0
                                                                }
                                                            })}
                                                            style={{
                                                                width: '80px',
                                                                padding: '0.5rem',
                                                                border: '1px solid #e2e8f0',
                                                                borderRadius: '0.375rem',
                                                                fontSize: '0.875rem',
                                                                textAlign: 'center'
                                                            }}
                                                        />
                                                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>점</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                시험 설명
                            </label>
                            <textarea
                                value={examSettings.description}
                                onChange={(e) => setExamSettings({ ...examSettings, description: e.target.value })}
                                placeholder="시험에 대한 설명을 입력하세요..."
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    </div>

                    {/* Navigation */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '2rem',
                        paddingTop: '2rem',
                        borderTop: '1px solid #e2e8f0'
                    }}>
                        <button
                            onClick={() => setCurrentStep(2)}
                            style={{
                                padding: '0.75rem 2rem',
                                background: '#f1f5f9',
                                color: '#475569',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <ChevronLeft size={18} /> 이전
                        </button>
                        <button
                            onClick={proceedToStep4}
                            style={{
                                padding: '0.75rem 2rem',
                                background: '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            다음 단계 <ChevronRight size={18} />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Step 4: 미리보기 */}
            {currentStep === 4 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '2rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                >
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                        모의고사 미리보기
                    </h3>

                    {/* Statistics */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{
                            padding: '1.5rem',
                            background: '#f8fafc',
                            borderRadius: '0.75rem',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>총 문제 수</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b' }}>
                                {selectedQuestionsOrder.length}
                            </div>
                        </div>
                        <div style={{
                            padding: '1.5rem',
                            background: '#f8fafc',
                            borderRadius: '0.75rem',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>시간 제한</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b' }}>
                                {examSettings.timeLimit}분
                            </div>
                        </div>
                        <div style={{
                            padding: '1.5rem',
                            background: '#f8fafc',
                            borderRadius: '0.75rem',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>합격 점수</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b' }}>
                                {examSettings.passScore}%
                            </div>
                        </div>
                    </div>

                    {/* Category Distribution */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>카테고리별 문제 수</h4>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '0.75rem'
                        }}>
                            {Array.from(new Set(selectedQuestionsOrder.map(q => q.category))).map(category => (
                                <div
                                    key={category}
                                    style={{
                                        padding: '1rem',
                                        background: '#eef2ff',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #c7d2fe'
                                    }}
                                >
                                    <div style={{ fontSize: '0.75rem', color: '#6366f1', marginBottom: '0.25rem' }}>
                                        {category}
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                                        {getCategoryCount(category)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Question List Preview */}
                    <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>문제 목록</h4>
                        <div style={{
                            maxHeight: '500px',
                            overflowY: 'auto',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            padding: '1rem'
                        }}>
                            {selectedQuestionsOrder.map((question, index) => (
                                <div
                                    key={question.id}
                                    style={{
                                        padding: '1rem',
                                        background: '#f8fafc',
                                        borderRadius: '0.5rem',
                                        marginBottom: '0.75rem',
                                        border: '1px solid #e2e8f0'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'start',
                                        gap: '1rem'
                                    }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: '#6366f1',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.875rem',
                                            fontWeight: 700,
                                            flexShrink: 0
                                        }}>
                                            {index + 1}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: '#6366f1',
                                                fontWeight: 600,
                                                marginBottom: '0.5rem'
                                            }}>
                                                {question.category}
                                            </div>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: '#1e293b',
                                                lineHeight: 1.6
                                            }}>
                                                {question.text}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '2rem',
                        paddingTop: '2rem',
                        borderTop: '1px solid #e2e8f0'
                    }}>
                        <button
                            onClick={() => setCurrentStep(3)}
                            style={{
                                padding: '0.75rem 2rem',
                                background: '#f1f5f9',
                                color: '#475569',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <ChevronLeft size={18} /> 이전
                        </button>
                        <button
                            onClick={generateExam}
                            disabled={isGenerating}
                            style={{
                                padding: '0.75rem 2rem',
                                background: isGenerating ? '#94a3b8' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: isGenerating ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {isGenerating ? (
                                <>생성 중...</>
                            ) : (
                                <>
                                    <Save size={18} /> 모의고사 생성
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Question Preview Modal */}
            {previewQuestion && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '2rem'
                }}
                    onClick={() => setPreviewQuestion(null)}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '1rem',
                            padding: '2rem',
                            maxWidth: '800px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>문제 미리보기</h3>
                            <button
                                onClick={() => setPreviewQuestion(null)}
                                style={{
                                    padding: '0.5rem',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    borderRadius: '0.5rem'
                                }}
                            >
                                <X size={20} color="#64748b" />
                            </button>
                        </div>

                        <div style={{
                            padding: '1.5rem',
                            background: '#f8fafc',
                            borderRadius: '0.75rem',
                            marginBottom: '1rem'
                        }}>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#6366f1',
                                fontWeight: 600,
                                marginBottom: '0.75rem'
                            }}>
                                {previewQuestion.category}
                            </div>
                            <div style={{
                                fontSize: '1rem',
                                color: '#1e293b',
                                lineHeight: 1.6,
                                marginBottom: '1rem'
                            }}>
                                {previewQuestion.text}
                            </div>
                            {previewQuestion.imageUrl && (
                                <img
                                    src={previewQuestion.imageUrl}
                                    alt="Question"
                                    style={{
                                        width: '100%',
                                        maxHeight: '300px',
                                        objectFit: 'contain',
                                        borderRadius: '0.5rem',
                                        marginBottom: '1rem'
                                    }}
                                />
                            )}
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {previewQuestion.options.map((option, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: '0.75rem',
                                            background: previewQuestion.correctAnswer === idx
                                                ? '#dcfce7'
                                                : 'white',
                                            border: previewQuestion.correctAnswer === idx
                                                ? '2px solid #10b981'
                                                : '1px solid #e2e8f0',
                                            borderRadius: '0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem'
                                        }}
                                    >
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: previewQuestion.correctAnswer === idx
                                                ? '#10b981'
                                                : '#e2e8f0',
                                            color: previewQuestion.correctAnswer === idx
                                                ? 'white'
                                                : '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: 700
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <div style={{ flex: 1, fontSize: '0.875rem' }}>
                                            {option}
                                        </div>
                                        {previewQuestion.correctAnswer === idx && (
                                            <CheckCircle size={18} color="#10b981" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            {previewQuestion.explanation && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    background: '#fef3c7',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    color: '#92400e'
                                }}>
                                    <strong>해설:</strong> {previewQuestion.explanation}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

