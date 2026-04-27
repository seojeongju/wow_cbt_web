import { useEffect, useMemo, useState } from 'react';
import { CourseService } from '../../services/courseService';
import { SubjectService } from '../../services/subjectService';
import { AuthService } from '../../services/authService';
import { useSearchParams } from 'react-router-dom';

type Course = { id: string; name: string };
type Subject = { id: string; name: string };
type CbtCreateTemplate = {
    id: string;
    name: string;
    courseId: string;
    subjectId: string;
    timeLimit: number;
    passScore: number;
    topicFilter: string;
    roundFilter: string;
    categoryFilter: string;
    createdAt: string;
};
type Question = {
    id: string;
    category: string;
    text: string;
    subjectId?: string | null;
    topic?: string | null;
    round?: string | null;
    examTitle?: string | null;
};
type QuestionPoolCourse = { id: string; name: string; examCount: number; questionCount: number };
type QuestionPoolSubject = { id: string; name: string; questionCount: number };
type CbtExam = {
    id: string;
    title: string;
    description?: string;
    courseId?: string | null;
    subjectId?: string | null;
    topic?: string | null;
    round?: string | null;
    timeLimit: number;
    passScore: number;
    isActive?: boolean;
    questionCount: number;
};

type CbtExamDetail = CbtExam & { questions: Question[] };
type CbtAdminLog = {
    id: string;
    action: string;
    cbt_exam_id?: string | null;
    exam_title?: string | null;
    note?: string | null;
    admin_user_id?: string | null;
    admin_user_name?: string | null;
    admin_name_from_users?: string | null;
    created_at: string;
};

export const CbtExamManagement = () => {
    const TEMPLATE_STORAGE_KEY = 'wow_cbt_create_templates_v1';
    const currentAdmin = AuthService.getCurrentUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const [courses, setCourses] = useState<Course[]>([]);
    const [questionPoolCourses, setQuestionPoolCourses] = useState<QuestionPoolCourse[]>([]);
    const [questionPoolSubjects, setQuestionPoolSubjects] = useState<QuestionPoolSubject[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [pool, setPool] = useState<Question[]>([]);
    const [exams, setExams] = useState<CbtExam[]>([]);
    const [logs, setLogs] = useState<CbtAdminLog[]>([]);
    const [editingExamId, setEditingExamId] = useState<string | null>(null);
    const [editingExamDetail, setEditingExamDetail] = useState<CbtExamDetail | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const [poolCategoryFilter, setPoolCategoryFilter] = useState('all');
    const [poolTopicFilter, setPoolTopicFilter] = useState('all');
    const [poolRoundFilter, setPoolRoundFilter] = useState('all');
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [templates, setTemplates] = useState<CbtCreateTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [templateSubjectIdToApply, setTemplateSubjectIdToApply] = useState('');
    const [examSearch, setExamSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'create' | 'list' | 'logs'>('create');
    const [logActionFilter, setLogActionFilter] = useState<'all' | 'create_exam' | 'update_exam' | 'copy_exam'>('all');
    const [logDateFilter, setLogDateFilter] = useState<'all' | 'today' | '7days'>('all');
    const initialStatus = searchParams.get('status');
    const initialEditExamId = searchParams.get('editExamId');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
        initialStatus === 'active' || initialStatus === 'inactive' ? initialStatus : 'all'
    );
    const [courseId, setCourseId] = useState('');
    const [subjectId, setSubjectId] = useState('');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [topic, setTopic] = useState('');
    const [round, setRound] = useState('');
    const [timeLimit, setTimeLimit] = useState(60);
    const [passScore, setPassScore] = useState(60);
    const [isActiveEdit, setIsActiveEdit] = useState(true);

    const filteredExams = useMemo(() => {
        let result = exams;
        if (statusFilter === 'active') result = result.filter(e => e.isActive);
        else if (statusFilter === 'inactive') result = result.filter(e => !e.isActive);

        if (examSearch.trim()) {
            const keyword = examSearch.trim().toLowerCase();
            result = result.filter(e =>
                (e.title || '').toLowerCase().includes(keyword) ||
                (e.topic || '').toLowerCase().includes(keyword) ||
                (e.round || '').toLowerCase().includes(keyword)
            );
        }
        return result;
    }, [exams, statusFilter, examSearch]);

    const stats = useMemo(() => {
        const total = exams.length;
        const active = exams.filter(e => e.isActive).length;
        const inactive = total - active;
        return { total, active, inactive, logs: logs.length };
    }, [exams, logs]);

    const filteredLogs = useMemo(() => {
        let result = logs;
        if (logActionFilter !== 'all') {
            result = result.filter(log => log.action === logActionFilter);
        }
        if (logDateFilter !== 'all') {
            const now = Date.now();
            const threshold = logDateFilter === 'today'
                ? new Date(new Date().toDateString()).getTime()
                : now - (7 * 24 * 60 * 60 * 1000);
            result = result.filter(log => new Date(log.created_at).getTime() >= threshold);
        }
        return result;
    }, [logs, logActionFilter, logDateFilter]);

    const isCreateTab = activeTab === 'create';

    useEffect(() => {
        const next = new URLSearchParams(window.location.search);
        if (statusFilter === 'all') next.delete('status');
        else next.set('status', statusFilter);
        setSearchParams(next, { replace: true });
    }, [statusFilter, setSearchParams]);

    const filteredPoolBase = useMemo(() => {
        let result = pool;
        if (poolCategoryFilter !== 'all') {
            result = result.filter(q => (q.category || '') === poolCategoryFilter);
        }
        if (poolTopicFilter !== 'all') {
            result = result.filter(q => (q.topic || '') === poolTopicFilter);
        }
        if (poolRoundFilter !== 'all') {
            result = result.filter(q => (q.round || '') === poolRoundFilter);
        }
        if (search.trim()) {
            const lower = search.toLowerCase();
            result = result.filter(q =>
                (q.text || '').toLowerCase().includes(lower) ||
                (q.category || '').toLowerCase().includes(lower) ||
                (q.topic || '').toLowerCase().includes(lower) ||
                (q.round || '').toLowerCase().includes(lower) ||
                (q.examTitle || '').toLowerCase().includes(lower)
            );
        }
        return result;
    }, [pool, search, poolCategoryFilter, poolTopicFilter, poolRoundFilter]);

    const filteredPool = useMemo(() => {
        if (!showSelectedOnly) return filteredPoolBase;
        return filteredPoolBase.filter(q => selectedIds.has(q.id));
    }, [filteredPoolBase, showSelectedOnly, selectedIds]);

    const poolCategoryOptions = useMemo(() => {
        return Array.from(new Set(pool.map(q => q.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }, [pool]);
    const poolTopicOptions = useMemo(() => {
        return Array.from(new Set(pool.map(q => q.topic || '').filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }, [pool]);
    const poolRoundOptions = useMemo(() => {
        return Array.from(new Set(pool.map(q => q.round || '').filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }, [pool]);

    const loadExams = async () => {
        const res = await fetch('/api/cbt/exams?includeInactive=true');
        const data = await res.json();
        setExams(data.exams || []);
    };

    const loadLogs = async () => {
        const res = await fetch('/api/cbt/admin/logs?limit=80');
        const data = await res.json();
        setLogs(data.logs || []);
    };

    const loadPool = async (selectedCourseId: string, selectedSubjectId: string) => {
        if (!selectedCourseId) {
            setPool([]);
            return;
        }
        const query = new URLSearchParams({
            courseId: selectedCourseId,
            ...(selectedSubjectId ? { subjectId: selectedSubjectId } : {})
        });
        const res = await fetch(`/api/cbt/admin/question-pool?${query.toString()}`);
        const data = await res.json();
        setPool(data.questions || []);
        setSelectedIds(new Set());
        setPoolCategoryFilter('all');
        setPoolTopicFilter('all');
        setPoolRoundFilter('all');
        setShowSelectedOnly(false);
    };

    const loadQuestionPoolCourses = async () => {
        const res = await fetch('/api/cbt/admin/question-pool?scope=courses');
        const data = await res.json();
        setQuestionPoolCourses(data.courses || []);
    };

    const loadTemplates = () => {
        try {
            const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
            if (!raw) return setTemplates([]);
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setTemplates(parsed);
            else setTemplates([]);
        } catch {
            setTemplates([]);
        }
    };

    const saveTemplates = (nextTemplates: CbtCreateTemplate[]) => {
        setTemplates(nextTemplates);
        localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(nextTemplates));
    };

    const saveCurrentAsTemplate = () => {
        if (!courseId) {
            alert('템플릿 저장 전 과정을 먼저 선택해주세요.');
            return;
        }
        const name = prompt('템플릿 이름을 입력하세요.', `${title || 'CBT 템플릿'}_${new Date().toISOString().slice(0, 10)}`);
        if (!name || !name.trim()) return;
        const template: CbtCreateTemplate = {
            id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: name.trim(),
            courseId,
            subjectId: subjectId || '',
            timeLimit,
            passScore,
            topicFilter: poolTopicFilter,
            roundFilter: poolRoundFilter,
            categoryFilter: poolCategoryFilter,
            createdAt: new Date().toISOString()
        };
        saveTemplates([template, ...templates].slice(0, 30));
        setSelectedTemplateId(template.id);
        alert('템플릿이 저장되었습니다.');
    };

    const applyTemplate = (templateId: string) => {
        setSelectedTemplateId(templateId);
        if (!templateId) return;
        const tpl = templates.find(t => t.id === templateId);
        if (!tpl) return;
        setTemplateSubjectIdToApply(tpl.subjectId || '');
        setCourseId(tpl.courseId || '');
        setTimeLimit(tpl.timeLimit || 60);
        setPassScore(tpl.passScore || 60);
        setPoolTopicFilter(tpl.topicFilter || 'all');
        setPoolRoundFilter(tpl.roundFilter || 'all');
        setPoolCategoryFilter(tpl.categoryFilter || 'all');
    };

    const deleteTemplate = () => {
        if (!selectedTemplateId) return;
        const target = templates.find(t => t.id === selectedTemplateId);
        if (!target) return;
        const ok = confirm(`"${target.name}" 템플릿을 삭제할까요?`);
        if (!ok) return;
        const next = templates.filter(t => t.id !== selectedTemplateId);
        saveTemplates(next);
        setSelectedTemplateId('');
    };

    const loadQuestionPoolSubjects = async (selectedCourseId: string) => {
        if (!selectedCourseId) {
            setQuestionPoolSubjects([]);
            return;
        }
        const res = await fetch(`/api/cbt/admin/question-pool?scope=subjects&courseId=${encodeURIComponent(selectedCourseId)}`);
        const data = await res.json();
        setQuestionPoolSubjects(data.subjects || []);
    };

    useEffect(() => {
        const load = async () => {
            const courseList = await CourseService.getCourses();
            setCourses(courseList);
            loadTemplates();
            await loadQuestionPoolCourses();
            await loadExams();
            await loadLogs();
            if (initialEditExamId) {
                await beginEdit(initialEditExamId);
            }
        };
        load();
    }, []);

    useEffect(() => {
        const loadSubjects = async () => {
            if (!courseId) {
                setSubjects([]);
                setQuestionPoolSubjects([]);
                setSubjectId('');
                return;
            }
            const subjectList = await SubjectService.getSubjects(courseId);
            setSubjects(subjectList);
            await loadQuestionPoolSubjects(courseId);
            const nextSubjectId = templateSubjectIdToApply || '';
            setSubjectId(nextSubjectId);
            setTemplateSubjectIdToApply('');
            await loadPool(courseId, nextSubjectId);
        };
        loadSubjects();
    }, [courseId, templateSubjectIdToApply]);

    useEffect(() => {
        if (!courseId) return;
        loadPool(courseId, subjectId);
    }, [subjectId]);

    const toggleQuestion = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const selectAllFilteredQuestions = () => {
        if (filteredPool.length === 0) return;
        const next = new Set(selectedIds);
        filteredPool.forEach(q => next.add(q.id));
        setSelectedIds(next);
    };

    const deselectFilteredQuestions = () => {
        if (filteredPool.length === 0) return;
        const idsToRemove = new Set(filteredPool.map(q => q.id));
        const next = new Set(Array.from(selectedIds).filter(id => !idsToRemove.has(id)));
        setSelectedIds(next);
    };

    const clearAllSelectedQuestions = () => {
        setSelectedIds(new Set());
        setShowSelectedOnly(false);
    };

    const createCbtExam = async () => {
        if (!title.trim()) {
            alert('시험 제목을 입력해주세요.');
            return;
        }
        if (!courseId) {
            alert('과정을 선택해주세요.');
            return;
        }
        const courseWithQuestions = questionPoolCourses.find(c => c.id === courseId);
        if (!courseWithQuestions || courseWithQuestions.questionCount === 0) {
            alert('선택한 과정에는 문제은행 문항이 없습니다. 과정 또는 문항 구성을 확인해주세요.');
            return;
        }
        if (selectedIds.size === 0) {
            alert('최소 1개 이상의 문제를 선택해주세요.');
            return;
        }
        if (selectionQuality.warnings.length > 0) {
            const proceed = confirm(
                `문항 구성 경고가 있습니다:\n- ${selectionQuality.warnings.join('\n- ')}\n\n그래도 생성하시겠습니까?`
            );
            if (!proceed) return;
        }

        const response = await fetch('/api/cbt/exams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                topic: topic || null,
                round: round || null,
                courseId,
                subjectId: subjectId || null,
                timeLimit,
                passScore,
                questionIds: Array.from(selectedIds),
                adminUserId: currentAdmin?.id || null,
                adminUserName: currentAdmin?.name || null
            })
        });
        const result = await response.json();
        if (!result.success) {
            alert(result.message || 'CBT 시험 생성에 실패했습니다.');
            return;
        }

        alert('CBT 시험이 생성되었습니다.');
        setTitle('');
        setDescription('');
        setTopic('');
        setRound('');
        setSelectedIds(new Set());
        await loadExams();
        await loadLogs();
        await loadQuestionPoolCourses();
    };

    const beginEdit = async (examId: string) => {
        const res = await fetch(`/api/cbt/exams/${examId}?includeInactive=true`);
        const data = await res.json();
        if (!data.success || !data.exam) {
            alert(data.message || '시험 상세를 불러오지 못했습니다.');
            return;
        }

        const exam = data.exam;
        setEditingExamId(examId);
        setEditingExamDetail({
            id: exam.id,
            title: exam.title,
            description: exam.description,
            courseId: exam.courseId,
            subjectId: exam.subjectId,
            topic: exam.topic,
            round: exam.round,
            timeLimit: exam.timeLimit,
            passScore: exam.passScore,
            questionCount: exam.questionCount,
            questions: exam.questions || []
        });
        setIsActiveEdit(true);
    };

    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        if (!editingExamDetail) return;
        const next = [...editingExamDetail.questions];
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setEditingExamDetail({ ...editingExamDetail, questions: next });
    };

    const removeQuestion = (id: string) => {
        if (!editingExamDetail) return;
        setEditingExamDetail({
            ...editingExamDetail,
            questions: editingExamDetail.questions.filter(q => q.id !== id),
            questionCount: Math.max(0, editingExamDetail.questions.length - 1)
        });
    };

    const addSelectedPoolQuestionsToEdit = () => {
        if (!editingExamDetail) return;
        const existing = new Set(editingExamDetail.questions.map(q => q.id));
        const toAdd = pool.filter(q => selectedIds.has(q.id) && !existing.has(q.id));
        if (toAdd.length === 0) return;
        setEditingExamDetail({
            ...editingExamDetail,
            questions: [...editingExamDetail.questions, ...toAdd],
            questionCount: editingExamDetail.questions.length + toAdd.length
        });
    };

    const saveEdit = async () => {
        if (!editingExamId || !editingExamDetail) return;
        if (!editingExamDetail.title.trim()) {
            alert('시험 제목을 입력해주세요.');
            return;
        }
        if (editingExamDetail.questions.length === 0) {
            alert('최소 1개 이상의 문항이 필요합니다.');
            return;
        }
        setSavingEdit(true);
        try {
            const res = await fetch(`/api/cbt/exams/${editingExamId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editingExamDetail.title,
                    description: editingExamDetail.description || '',
                    courseId: editingExamDetail.courseId || null,
                    subjectId: editingExamDetail.subjectId || null,
                    topic: editingExamDetail.topic || null,
                    round: editingExamDetail.round || null,
                    timeLimit: editingExamDetail.timeLimit,
                    passScore: editingExamDetail.passScore,
                    isActive: isActiveEdit,
                    questionIds: editingExamDetail.questions.map(q => q.id),
                    adminUserId: currentAdmin?.id || null,
                    adminUserName: currentAdmin?.name || null
                })
            });
            const result = await res.json();
            if (!result.success) {
                alert(result.message || '수정 저장에 실패했습니다.');
                return;
            }
            alert('CBT 시험 수정이 완료되었습니다.');
            setEditingExamId(null);
            setEditingExamDetail(null);
            await loadExams();
        } finally {
            setSavingEdit(false);
        }
    };

    const handleToggle = async (exam: CbtExam) => {
        const makeActive = !exam.isActive;
        const next = confirm(`"${exam.title}" 시험을 ${makeActive ? '활성화' : '비활성화'} 처리할까요?`);
        if (!next) return;
        const res = await fetch(`/api/cbt/exams/${exam.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                isActive: makeActive,
                adminUserId: currentAdmin?.id || null,
                adminUserName: currentAdmin?.name || null
            })
        });
        const result = await res.json();
        if (!result.success) {
            alert(result.message || '상태 변경 실패');
            return;
        }
        await loadExams();
        await loadLogs();
    };

    const copyExam = async (exam: CbtExam) => {
        const defaultSuffix = `복제본 ${new Date().toISOString().slice(0, 10)}`;
        const suffix = prompt('복제본 제목 suffix를 입력하세요.', defaultSuffix);
        if (suffix === null) return;
        const moveToEdit = confirm('복제 후 바로 편집 화면으로 이동할까요?');
        const res = await fetch(`/api/cbt/exams/${exam.id}/copy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                titleSuffix: suffix || '복제본',
                adminUserId: currentAdmin?.id || null,
                adminUserName: currentAdmin?.name || null
            })
        });
        const result = await res.json();
        if (!result.success) {
            alert(result.message || '복제 실패');
            return;
        }
        alert(`복제 완료: ${result.examTitle || '복제본'} (기본 비활성)`);
        if (moveToEdit && result.examId) {
            const next = new URLSearchParams(window.location.search);
            next.set('editExamId', result.examId);
            setSearchParams(next, { replace: true });
            await beginEdit(result.examId);
        }
        await loadExams();
    };

    const availableCourseIds = new Set(questionPoolCourses.map(c => c.id));
    const selectableCourses = courses.filter(c => availableCourseIds.has(c.id));
    const availableSubjectIds = new Set(questionPoolSubjects.map(s => s.id));
    const selectableSubjects = subjects.filter(s => availableSubjectIds.has(s.id));
    const selectedCourseMeta = questionPoolCourses.find(c => c.id === courseId);
    const selectedSubjectMeta = questionPoolSubjects.find(s => s.id === subjectId);
    const selectedSubjectQuestionCount = subjectId
        ? pool.filter(q => q.subjectId === subjectId).length
        : pool.length;
    const selectedQuestionList = useMemo(() => {
        const selectedSet = selectedIds;
        return pool.filter(q => selectedSet.has(q.id));
    }, [pool, selectedIds]);
    const selectionQuality = useMemo(() => {
        const total = selectedQuestionList.length;
        const byCategory: Record<string, number> = {};
        const byTopic: Record<string, number> = {};

        selectedQuestionList.forEach(q => {
            const categoryKey = q.category || '미분류';
            const topicKey = q.topic || '미분류';
            byCategory[categoryKey] = (byCategory[categoryKey] || 0) + 1;
            byTopic[topicKey] = (byTopic[topicKey] || 0) + 1;
        });

        const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
        const topicEntries = Object.entries(byTopic).sort((a, b) => b[1] - a[1]);
        const warnings: string[] = [];

        if (total > 0) {
            if (categoryEntries.length <= 1 && total >= 8) warnings.push('카테고리가 1개로만 구성되어 있습니다.');
            if (topicEntries.length <= 1 && total >= 8) warnings.push('토픽이 1개로만 구성되어 있습니다.');
            const [topCategoryName, topCategoryCount] = categoryEntries[0] || ['', 0];
            if (topCategoryCount / total >= 0.7 && total >= 10) {
                warnings.push(`카테고리 편중이 큽니다. (${topCategoryName} ${topCategoryCount}/${total})`);
            }
            const [topTopicName, topTopicCount] = topicEntries[0] || ['', 0];
            if (topTopicCount / total >= 0.7 && total >= 10) {
                warnings.push(`토픽 편중이 큽니다. (${topTopicName} ${topTopicCount}/${total})`);
            }
        }

        return { total, categoryEntries, topicEntries, warnings };
    }, [selectedQuestionList]);

    const parseLogNote = (note?: string | null) => {
        if (!note) return { summary: '', details: [] as string[] };
        if (!note.startsWith('diff_json:')) return { summary: note, details: [] as string[] };
        try {
            const raw = JSON.parse(note.slice('diff_json:'.length)) as Record<string, { before: unknown; after: unknown }>;
            const labels: Record<string, string> = {
                title: '제목',
                courseId: '과정',
                subjectId: '과목',
                topic: '토픽',
                round: '차시',
                timeLimit: '제한시간',
                passScore: '합격점수',
                isActive: '활성여부',
                questionCount: '문항수'
            };
            const details = Object.entries(raw).map(([key, value]) => {
                const label = labels[key] || key;
                return `${label}: ${String(value.before ?? '-')} -> ${String(value.after ?? '-')}`;
            });
            return { summary: details.length ? `변경 ${details.length}건` : '변경 없음', details };
        } catch {
            return { summary: note, details: [] as string[] };
        }
    };

    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            <section className="glass-card" style={{ background: 'white', padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.85rem' }}>
                        <div style={{ color: '#64748b', fontSize: '0.82rem' }}>전체 CBT 시험</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.total}</div>
                    </div>
                    <div style={{ border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '0.85rem', background: '#f0fdf4' }}>
                        <div style={{ color: '#166534', fontSize: '0.82rem' }}>활성 시험</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534' }}>{stats.active}</div>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.85rem', background: '#f8fafc' }}>
                        <div style={{ color: '#475569', fontSize: '0.82rem' }}>비활성 시험</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#334155' }}>{stats.inactive}</div>
                    </div>
                    <div style={{ border: '1px solid #dbeafe', borderRadius: '0.75rem', padding: '0.85rem', background: '#eff6ff' }}>
                        <div style={{ color: '#1d4ed8', fontSize: '0.82rem' }}>최근 로그(표시)</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8' }}>{stats.logs}</div>
                    </div>
                </div>
            </section>

            <section className="glass-card" style={{ background: 'white', padding: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className={activeTab === 'create' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setActiveTab('create')}>시험 생성</button>
                    <button className={activeTab === 'list' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setActiveTab('list')}>시험 목록</button>
                    <button className={activeTab === 'logs' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setActiveTab('logs')}>작업 로그</button>
                </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: isCreateTab ? '1fr' : '1.15fr 1fr', gap: '1rem' }}>
            <section className="glass-card" style={{ display: isCreateTab ? 'block' : 'none', background: 'white', padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem' }}>CBT 시험 생성</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>시험 정보 입력 후 문항을 선택해 바로 생성할 수 있습니다.</p>
                    <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <select
                            value={selectedTemplateId}
                            onChange={e => applyTemplate(e.target.value)}
                            style={{ padding: '0.45rem 0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', minWidth: '220px' }}
                        >
                            <option value="">템플릿 불러오기</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                        <button className="btn btn-secondary" onClick={saveCurrentAsTemplate}>현재 설정 템플릿 저장</button>
                        <button className="btn btn-secondary" onClick={deleteTemplate} disabled={!selectedTemplateId}>선택 템플릿 삭제</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.9rem', padding: '1rem', background: '#f8fafc' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>시험 기본 정보</h3>
                        <div style={{ display: 'grid', gap: '0.6rem' }}>
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="시험 제목" className="input" style={{ padding: '0.72rem 0.8rem' }} />
                            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="시험 설명" rows={4} style={{ padding: '0.72rem 0.8rem', borderRadius: '0.55rem', border: '1px solid #e2e8f0', resize: 'vertical' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="소분류(토픽)" className="input" style={{ padding: '0.72rem 0.8rem' }} />
                                <input value={round} onChange={e => setRound(e.target.value)} placeholder="차시(회차)" className="input" style={{ padding: '0.72rem 0.8rem' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                <select value={courseId} onChange={e => setCourseId(e.target.value)} style={{ padding: '0.72rem 0.8rem', borderRadius: '0.55rem', border: '1px solid #e2e8f0' }}>
                                    <option value="">문제은행 과정 선택</option>
                                    {selectableCourses.map(c => {
                                        const meta = questionPoolCourses.find(item => item.id === c.id);
                                        return (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({meta?.questionCount || 0}문항)
                                            </option>
                                        );
                                    })}
                                </select>
                                <select value={subjectId} onChange={e => setSubjectId(e.target.value)} style={{ padding: '0.72rem 0.8rem', borderRadius: '0.55rem', border: '1px solid #e2e8f0' }}>
                                    <option value="">과목 선택(선택)</option>
                                    {selectableSubjects.map(s => {
                                        const meta = questionPoolSubjects.find(item => item.id === s.id);
                                        return (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({meta?.questionCount || 0}문항)
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            {courseId && (
                                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                                    선택 과정 문제은행 현황: {selectedCourseMeta?.questionCount || 0}문항 · {selectedCourseMeta?.examCount || 0}개 시험
                                </div>
                            )}
                            {subjectId && (
                                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                                    선택 과목 문제은행 현황: {selectedSubjectMeta?.questionCount || 0}문항
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                <input type="number" value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value) || 60)} placeholder="제한시간(분)" className="input" style={{ padding: '0.72rem 0.8rem' }} />
                                <input type="number" value={passScore} onChange={e => setPassScore(parseInt(e.target.value) || 60)} placeholder="합격점수" className="input" style={{ padding: '0.72rem 0.8rem' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.9rem', padding: '1rem' }}>
                        <div style={{ border: '1px solid #dbeafe', borderRadius: '0.7rem', padding: '0.65rem 0.7rem', background: '#eff6ff', marginBottom: '0.7rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '0.88rem', color: '#1e3a8a' }}>선택 문항 {selectedIds.size}개</strong>
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                    <button className="btn btn-secondary" onClick={selectAllFilteredQuestions}>필터 결과 전체 선택</button>
                                    <button className="btn btn-secondary" onClick={deselectFilteredQuestions}>필터 결과 선택 해제</button>
                                    <button className="btn btn-secondary" onClick={clearAllSelectedQuestions}>전체 해제</button>
                                    <button className="btn btn-secondary" onClick={() => setShowSelectedOnly(v => !v)}>
                                        {showSelectedOnly ? '전체 보기' : '선택 문항만 보기'}
                                    </button>
                                </div>
                            </div>
                            {selectedQuestionList.length > 0 && (
                                <div style={{ marginTop: '0.45rem', maxHeight: '78px', overflowY: 'auto', fontSize: '0.78rem', color: '#334155' }}>
                                    {selectedQuestionList.slice(0, 25).map((q, idx) => (
                                        <div key={q.id}>
                                            {idx + 1}. {q.text}
                                        </div>
                                    ))}
                                    {selectedQuestionList.length > 25 && (
                                        <div style={{ color: '#64748b' }}>...외 {selectedQuestionList.length - 25}문항</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>
                                문항 선택 <span style={{ color: '#2563eb' }}>({selectedIds.size})</span>
                            </h3>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="문항 검색" style={{ padding: '0.55rem 0.7rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', minWidth: '190px' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: '0.45rem', marginBottom: '0.6rem' }}>
                            <select
                                value={poolTopicFilter}
                                onChange={e => setPoolTopicFilter(e.target.value)}
                                style={{ padding: '0.5rem 0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                            >
                                <option value="all">전체 토픽</option>
                                {poolTopicOptions.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                            <select
                                value={poolRoundFilter}
                                onChange={e => setPoolRoundFilter(e.target.value)}
                                style={{ padding: '0.5rem 0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                            >
                                <option value="all">전체 차시</option>
                                {poolRoundOptions.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                            <select
                                value={poolCategoryFilter}
                                onChange={e => setPoolCategoryFilter(e.target.value)}
                                style={{ padding: '0.5rem 0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                            >
                                <option value="all">전체 카테고리</option>
                                {poolCategoryOptions.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.55rem' }}>
                            표시 {filteredPool.length}문항 (선택 과목 기준 {selectedSubjectQuestionCount}문항) · 선택 {selectedIds.size}문항
                        </div>
                        {selectionQuality.total > 0 && (
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.65rem', padding: '0.55rem 0.65rem', marginBottom: '0.6rem', background: '#f8fafc' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: '#334155' }}>선택 문항 분포 점검</div>
                                <div style={{ fontSize: '0.77rem', color: '#475569' }}>
                                    카테고리: {selectionQuality.categoryEntries.slice(0, 4).map(([k, v]) => `${k} ${v}`).join(' · ') || '-'}
                                </div>
                                <div style={{ fontSize: '0.77rem', color: '#475569', marginTop: '0.2rem' }}>
                                    토픽: {selectionQuality.topicEntries.slice(0, 4).map(([k, v]) => `${k} ${v}`).join(' · ') || '-'}
                                </div>
                                {selectionQuality.warnings.length > 0 && (
                                    <div style={{ marginTop: '0.35rem', fontSize: '0.77rem', color: '#b45309' }}>
                                        경고: {selectionQuality.warnings.join(' / ')}
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.45rem' }}>
                            {filteredPool.map(q => (
                                <label key={q.id} style={{ display: 'block', padding: '0.65rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(q.id)}
                                        onChange={() => toggleQuestion(q.id)}
                                        style={{ marginRight: '0.5rem' }}
                                    />
                                    <span style={{ fontSize: '0.75rem', color: '#4f46e5', marginRight: '0.35rem' }}>[{q.category || '기타'}]</span>
                                    <span style={{ fontSize: '0.92rem' }}>{q.text}</span>
                                    {(q.topic || q.round) && (
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.45rem' }}>
                                            {q.topic ? `토픽:${q.topic}` : ''}{q.topic && q.round ? ' · ' : ''}{q.round ? `차시:${q.round}` : ''}
                                        </span>
                                    )}
                                </label>
                            ))}
                            {filteredPool.length === 0 && <div style={{ color: '#64748b', padding: '1rem' }}>조건에 맞는 문항이 없습니다.</div>}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" style={{ minWidth: '170px', padding: '0.72rem 1rem' }} onClick={createCbtExam}>
                        CBT 시험 생성
                    </button>
                </div>
            </section>

            <section className="glass-card" style={{ display: activeTab === 'logs' ? 'block' : 'none', gridColumn: '1 / -1', background: 'white', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={{ fontSize: '1.22rem', fontWeight: 800, marginBottom: '0.2rem' }}>CBT 관리자 작업 로그</h2>
                        <p style={{ fontSize: '0.86rem', color: '#64748b' }}>액션 유형과 기간으로 로그를 빠르게 필터링할 수 있습니다.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                            value={logActionFilter}
                            onChange={e => setLogActionFilter(e.target.value as 'all' | 'create_exam' | 'update_exam' | 'copy_exam')}
                            style={{ padding: '0.45rem 0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                        >
                            <option value="all">전체 액션</option>
                            <option value="create_exam">시험 생성</option>
                            <option value="update_exam">시험 수정</option>
                            <option value="copy_exam">시험 복제</option>
                        </select>
                        <select
                            value={logDateFilter}
                            onChange={e => setLogDateFilter(e.target.value as 'all' | 'today' | '7days')}
                            style={{ padding: '0.45rem 0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                        >
                            <option value="all">전체 기간</option>
                            <option value="today">오늘</option>
                            <option value="7days">최근 7일</option>
                        </select>
                        <button className="btn btn-secondary" onClick={loadLogs}>새로고침</button>
                    </div>
                </div>
                <div style={{ marginBottom: '0.55rem', fontSize: '0.82rem', color: '#64748b' }}>
                    조회 결과 {filteredLogs.length}건
                </div>
                <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.8rem', background: '#f8fafc' }}>
                    {filteredLogs.length === 0 ? (
                        <div style={{ padding: '1rem', color: '#64748b' }}>작업 로그가 없습니다.</div>
                    ) : filteredLogs.map(log => {
                        const parsedNote = parseLogNote(log.note);
                        return (
                        <div key={log.id} style={{ padding: '0.8rem 0.85rem', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '190px 120px 1fr 220px', gap: '0.65rem', alignItems: 'center', background: 'white' }}>
                            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{new Date(log.created_at).toLocaleString()}</div>
                            <div style={{ fontWeight: 700, color: '#334155' }}>
                                {log.action === 'create_exam' && '시험 생성'}
                                {log.action === 'update_exam' && '시험 수정'}
                                {log.action === 'copy_exam' && '시험 복제'}
                                {!['create_exam', 'update_exam', 'copy_exam'].includes(log.action) && log.action}
                            </div>
                            <div style={{ fontSize: '0.88rem', color: '#475569' }}>
                                <div>{(log.exam_title || log.cbt_exam_id || 'N/A')} {log.note ? `· ${parsedNote.summary}` : ''}</div>
                                {parsedNote.details.length > 0 && (
                                    <div style={{ marginTop: '0.2rem', fontSize: '0.78rem', color: '#64748b' }}>
                                        {parsedNote.details.slice(0, 3).join(' / ')}
                                    </div>
                                )}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                                작업자: {log.admin_user_name || log.admin_name_from_users || '-'} ({log.admin_user_id || '-'})
                            </div>
                        </div>
                    )})}
                </div>
            </section>

            <section className="glass-card" style={{ display: activeTab === 'list' ? 'block' : 'none', background: 'white', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={{ fontSize: '1.22rem', fontWeight: 800, marginBottom: '0.2rem' }}>CBT 시험 목록</h2>
                        <p style={{ fontSize: '0.86rem', color: '#64748b' }}>상태/키워드 기반으로 시험을 검색하고 즉시 운영 작업을 수행할 수 있습니다.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                        <button className="btn btn-secondary" onClick={() => setActiveTab('create')}>
                            + 새 시험 만들기
                        </button>
                        <input
                            value={examSearch}
                            onChange={e => setExamSearch(e.target.value)}
                            placeholder="시험명/토픽/회차 검색"
                            style={{ padding: '0.45rem 0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', minWidth: '160px' }}
                        />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                            style={{ padding: '0.45rem 0.6rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                        >
                            <option value="all">전체</option>
                            <option value="active">활성</option>
                            <option value="inactive">비활성</option>
                        </select>
                    </div>
                </div>
                <div style={{ marginBottom: '0.55rem', fontSize: '0.82rem', color: '#64748b' }}>
                    조회 결과 {filteredExams.length}건
                </div>
                <div style={{ display: 'grid', gap: '0.65rem', maxHeight: '760px', overflowY: 'auto' }}>
                    {filteredExams.map(exam => (
                        <div key={exam.id} style={{ border: '1px solid #e2e8f0', borderRadius: '0.85rem', padding: '0.9rem', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 700 }}>{exam.title}</div>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '999px',
                                    background: exam.isActive ? '#dcfce7' : '#e2e8f0',
                                    color: exam.isActive ? '#166534' : '#334155'
                                }}>
                                    {exam.isActive ? '활성' : '비활성'}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                {exam.timeLimit}분 · {exam.questionCount}문항 · 합격 {exam.passScore}점
                            </div>
                            <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                                {exam.courseId && (
                                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: '#f1f5f9', color: '#334155' }}>
                                        과정: {exam.courseId}
                                    </span>
                                )}
                                {exam.subjectId && (
                                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: '#eef2ff', color: '#4338ca' }}>
                                        과목: {exam.subjectId}
                                    </span>
                                )}
                                {exam.topic && (
                                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: '#ecfeff', color: '#0e7490' }}>
                                        토픽: {exam.topic}
                                    </span>
                                )}
                                {exam.round && (
                                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: '#fffbeb', color: '#b45309' }}>
                                        회차: {exam.round}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.7rem', flexWrap: 'wrap' }}>
                                <button className="btn btn-secondary" onClick={() => beginEdit(exam.id)}>수정</button>
                                <button className="btn btn-secondary" onClick={() => copyExam(exam)}>복제</button>
                                <button className="btn btn-secondary" onClick={() => handleToggle(exam)}>
                                    {exam.isActive ? '비활성화' : '재활성화'}
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredExams.length === 0 && <div style={{ color: '#64748b' }}>조건에 맞는 CBT 시험이 없습니다.</div>}
                </div>
            </section>
            </div>

            {editingExamDetail && (
                <section className="glass-card" style={{ gridColumn: '1 / -1', background: 'white', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>CBT 시험 수정</h2>
                        <button className="btn btn-secondary" onClick={() => { setEditingExamId(null); setEditingExamDetail(null); }}>
                            닫기
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <input value={editingExamDetail.title} onChange={e => setEditingExamDetail({ ...editingExamDetail, title: e.target.value })} placeholder="시험 제목" className="input" />
                        <input value={editingExamDetail.description || ''} onChange={e => setEditingExamDetail({ ...editingExamDetail, description: e.target.value })} placeholder="시험 설명" className="input" />
                        <input value={editingExamDetail.topic || ''} onChange={e => setEditingExamDetail({ ...editingExamDetail, topic: e.target.value })} placeholder="토픽" className="input" />
                        <input value={editingExamDetail.round || ''} onChange={e => setEditingExamDetail({ ...editingExamDetail, round: e.target.value })} placeholder="회차" className="input" />
                        <input type="number" value={editingExamDetail.timeLimit} onChange={e => setEditingExamDetail({ ...editingExamDetail, timeLimit: parseInt(e.target.value) || 60 })} placeholder="제한시간" className="input" />
                        <input type="number" value={editingExamDetail.passScore} onChange={e => setEditingExamDetail({ ...editingExamDetail, passScore: parseInt(e.target.value) || 60 })} placeholder="합격점수" className="input" />
                    </div>

                    <label style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <input type="checkbox" checked={isActiveEdit} onChange={e => setIsActiveEdit(e.target.checked)} />
                        활성 상태 유지
                    </label>

                    <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <strong>문항 재편집 ({editingExamDetail.questions.length})</strong>
                        <button className="btn btn-secondary" onClick={addSelectedPoolQuestionsToEdit}>선택 문항 추가</button>
                    </div>
                    <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.5rem' }}>
                        {editingExamDetail.questions.map((q, idx) => (
                            <div key={`${q.id}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '50px 1fr auto', gap: '0.5rem', alignItems: 'center', borderBottom: '1px solid #f1f5f9', padding: '0.45rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{idx + 1}</div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#4f46e5' }}>[{q.category || '기타'}]</span>{' '}
                                    <span style={{ fontSize: '0.9rem' }}>{q.text}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                    <button className="btn btn-secondary" onClick={() => moveQuestion(idx, 'up')}>↑</button>
                                    <button className="btn btn-secondary" onClick={() => moveQuestion(idx, 'down')}>↓</button>
                                    <button className="btn btn-secondary" onClick={() => removeQuestion(q.id)}>삭제</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '0.9rem' }}>
                        <button className="btn btn-primary" onClick={saveEdit} disabled={savingEdit}>
                            {savingEdit ? '저장중...' : '수정 저장'}
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
};
