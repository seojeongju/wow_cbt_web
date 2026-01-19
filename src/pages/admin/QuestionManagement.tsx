import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Trash2, FileUp, Folder, FileText, LayoutGrid, BookOpen, Edit2, Image as ImageIcon, Settings, BrainCircuit, Key as KeyIcon, Sparkles, X, CheckCircle, Printer } from 'lucide-react';
import { Question } from '../../types';
import { ExamService } from '../../services/examService';
import { CategoryService } from '../../services/categoryService';
import { CourseService } from '../../services/courseService';
import { SubjectService } from '../../services/subjectService'; // Added
import { OpenAIService } from '../../services/openAiService'; // ⭐️ 추가
// import { AIService } from '../../services/aiService'; // ⭐️ AI 해설 생성용 (TODO: UI 추가 후 활성화)
// import { AIExplanationButton } from '../../components/admin/AIExplanationButton'; // TODO: UI에 추가 예정
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import * as XLSX from 'xlsx';
import DOMPurify from 'dompurify';

export const QuestionManagement = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // --- Context State (Course > Exam) ---
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [selectedExamId, setSelectedExamId] = useState('');

    // ⭐️ API Key State
    const [apiKey, setApiKey] = useState('');
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [isAiProcessing, setIsAiProcessing] = useState(false);

    // ⭐️ AI 유사 문제 생성 State
    const [showSimilarModal, setShowSimilarModal] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
    const [generatingForQuestion, setGeneratingForQuestion] = useState<Question | null>(null);

    // ⭐️ Load courses from CourseService
    const [courses, setCourses] = useState<string[]>([]);
    const [fullCourses, setFullCourses] = useState<any[]>([]); // Store full course objects

    // ⭐️ Load exams from ExamService
    // Added subjectId optional type
    const [exams, setExams] = useState<{
        id: string;
        title: string;
        course: string;
        courseId?: string;
        subjectId?: string | null;
        subjectName?: string;
        topic?: string | null;
        round?: string | null;
        questionsCount?: number; // ⭐️ Added for deletion check
    }[]>([]);

    // ⭐️ Course Description Editing State
    const [showCourseEditModal, setShowCourseEditModal] = useState(false);
    const [editCourseDetails, setEditCourseDetails] = useState({
        description: '',
        targets: '',
        features: '',
        howToUse: ''
    });

    // ⭐️ Subject Management State (3단계 분류)
    const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [showSubjectModal, setShowSubjectModal] = useState(false); // For managing subjects
    const [editingSubject, setEditingSubject] = useState<{ id: string; name: string } | null>(null);
    const [subjectInputName, setSubjectInputName] = useState('');

    // ⭐️ Exam Move Modal State
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [moveTargetExamId, setMoveTargetExamId] = useState<string | null>(null);
    const [moveTargetCourseId, setMoveTargetCourseId] = useState<string>('');
    const [moveTargetSubjectId, setMoveTargetSubjectId] = useState<string>('');
    const [moveTargetSubjects, setMoveTargetSubjects] = useState<{ id: string; name: string }[]>([]);

    // ⭐️ Exam Edit Modal State
    const [isExamEditModalOpen, setIsExamEditModalOpen] = useState(false);
    const [editExamData, setEditExamData] = useState({
        id: '',
        title: '',
        timeLimit: 60,
        subjectName: '',
        topic: '',
        round: '',
        description: ''
    });

    // ⭐️ AI Explanation Generation State (TODO: UI에 추가 예정)
    // const [generatingExplanation, setGeneratingExplanation] = useState(false);

    // ⭐️ Load initial data
    useEffect(() => {
        loadInitialData();
        // Load API Key
        const savedKey = localStorage.getItem('openai_api_key');
        if (savedKey) setApiKey(savedKey);
    }, []);

    const loadInitialData = async () => {
        // Load courses from CourseService
        const courseList = await CourseService.getCourses();
        setFullCourses(courseList); // Set full course objects
        let currentCourses = courseList.map((c: any) => c.name); // Derive names for `courses` state

        // Load exams from ExamService
        const examList = await ExamService.getExamList();
        console.log('📝 Loaded exams from ExamService:', examList);

        const examsWithCourse = examList.map(exam => ({
            id: exam.id,
            title: exam.title,
            course: exam.courseName || '미분류',
            courseId: exam.courseId,
            subjectId: exam.subjectId, // Ensure this is mapped (Requires ExamService update to return it)
            subjectName: exam.subjectName,
            topic: exam.topic,
            round: exam.round,
            questionsCount: exam.questionsCount // ⭐️ Map question count
        }));
        setExams(examsWithCourse);

        // Orphan Check Logic (Legacy: might not be needed with DB, but keeping safely)
        // With D1, we trust the DB primarily. Or we can auto-create courses if missing.
        // For now, let's just rely on fetched courses.

        setCourses(currentCourses);
        console.log('📚 Final course list:', currentCourses);
    };

    // ⭐️ Subject Management Handlers
    const handleAddSubject = async () => {
        if (!selectedCourse || !subjectInputName.trim()) return;
        const courseObj = fullCourses.find(c => c.name === selectedCourse);
        if (!courseObj) return;

        const result = await SubjectService.addSubject(courseObj.id, subjectInputName.trim());
        if (result.success) {
            const subs = await SubjectService.getSubjects(courseObj.id);
            setSubjects(subs);
            setSubjectInputName('');
            alert('분류(과목)가 추가되었습니다.');
        } else {
            alert('추가 실패');
        }
    };

    const handleDeleteSubject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        // ⭐ Check if any exams are using this subject
        const examsUsingSubject = exams.filter(exam => exam.subjectId === id);

        if (examsUsingSubject.length > 0) {
            const examTitles = examsUsingSubject.slice(0, 5).map(e => e.title).join(', ');
            const moreCount = examsUsingSubject.length > 5 ? ` 외 ${examsUsingSubject.length - 5}개` : '';
            alert(
                `이 분류(과목)를 사용하는 시험지가 ${examsUsingSubject.length}개 있습니다.\n\n` +
                `시험지: ${examTitles}${moreCount}\n\n` +
                `시험지를 먼저 삭제하거나 다른 분류로 이동한 후 삭제해주세요.`
            );
            return;
        }

        if (!confirm('정말 이 분류를 삭제하시겠습니까?')) return;

        const success = await SubjectService.deleteSubject(id);
        if (success) {
            const courseObj = fullCourses.find(c => c.name === selectedCourse);
            if (courseObj) {
                const subs = await SubjectService.getSubjects(courseObj.id);
                setSubjects(subs);
            }
            if (selectedSubjectId === id) setSelectedSubjectId(null);
            alert('분류가 삭제되었습니다.');
        } else {
            alert('분류 삭제에 실패했습니다.');
        }
    };

    const handleUpdateSubject = async () => {
        if (!editingSubject || !subjectInputName.trim()) return;
        const success = await SubjectService.updateSubject(editingSubject.id, subjectInputName.trim());
        if (success) {
            const courseObj = fullCourses.find(c => c.name === selectedCourse);
            if (courseObj) {
                const subs = await SubjectService.getSubjects(courseObj.id);
                setSubjects(subs);
            }
            setEditingSubject(null);
            setSubjectInputName('');
            setShowSubjectModal(false);
        }
    };

    // ⭐️ Exam Move Handlers
    const openMoveModal = (examId: string) => {
        setMoveTargetExamId(examId);
        // Default to current course
        const currentExam = exams.find(e => e.id === examId);
        if (currentExam) {
            // Find current course ID
            const cObj = fullCourses.find(c => c.name === currentExam.course);
            if (cObj) {
                setMoveTargetCourseId(cObj.id);
                // Load subjects for this course
                SubjectService.getSubjects(cObj.id).then(subs => setMoveTargetSubjects(subs));
            }
            setMoveTargetSubjectId(currentExam.subjectId || '');
        }
        setShowMoveModal(true);
    };

    // When modal course changes
    useEffect(() => {
        if (showMoveModal && moveTargetCourseId) {
            SubjectService.getSubjects(moveTargetCourseId).then(subs => setMoveTargetSubjects(subs));
        }
    }, [moveTargetCourseId, showMoveModal]);

    const handleMoveExam = async () => {
        if (!moveTargetExamId || !moveTargetCourseId) return;

        const result = await ExamService.updateExam(moveTargetExamId, {
            courseId: moveTargetCourseId,
            subjectId: moveTargetSubjectId || undefined // Allow clearing subject if empty string? Actually DB field is nullable
        });

        if (result.success) {
            alert('이동되었습니다.');
            setShowMoveModal(false);
            loadInitialData(); // Reload everything
        } else {
            alert('이동 실패: ' + result.message);
        }
    };

    // ⭐️ Course Details Editing Handlers
    const openCourseEditModal = () => {
        if (!selectedCourse) return;
        const currentCourse = fullCourses.find((c: any) => c.name === selectedCourse);
        if (currentCourse) {
            let details = currentCourse.details;
            try {
                if (typeof details === 'string') details = JSON.parse(details);
            } catch (e) {
                // Ignore parse error
            }

            setEditCourseDetails({
                description: details?.description || '',
                targets: details?.targets ? details.targets.join(', ') : '',
                features: details?.features ? details.features.join(', ') : '',
                howToUse: details?.howToUse ? details.howToUse.join('\n') : ''
            });
            setShowCourseEditModal(true);
        }
    };

    const handleSaveCourseDetails = async () => {
        if (!selectedCourse) return;
        const currentCourse = fullCourses.find((c: any) => c.name === selectedCourse);
        if (!currentCourse) return;

        const detailsObj = {
            description: editCourseDetails.description,
            targets: editCourseDetails.targets.split(',').map((s: string) => s.trim()).filter(Boolean),
            features: editCourseDetails.features.split(',').map((s: string) => s.trim()).filter(Boolean),
            howToUse: editCourseDetails.howToUse.split('\n').map((s: string) => s.trim()).filter(Boolean)
        };

        if (confirm(`${selectedCourse} 과정 소개 내용을 저장하시겠습니까?`)) {
            await CourseService.updateCourse(currentCourse.id, currentCourse.name, detailsObj);
            alert('저장되었습니다.');
            setShowCourseEditModal(false);
            loadInitialData(); // Reload to get updated details
        }
    };

    // Load Subjects when Course changes
    useEffect(() => {
        if (selectedCourse) {
            const courseObj = fullCourses.find(c => c.name === selectedCourse);
            if (courseObj) {
                SubjectService.getSubjects(courseObj.id).then(subs => {
                    setSubjects(subs);
                    // Select first subject if available, or 'all' if we want defaults
                    // Let's keep null as 'All' or 'Uncategorized' view
                    setSelectedSubjectId(null);
                });
            }
        } else {
            setSubjects([]);
        }
    }, [selectedCourse, fullCourses]); // dependency on fullCourses

    // Derived state for exam dropdown/list
    // Filter by Course AND Subject
    const availableExams = exams.filter(e => {
        const matchCourse = e.course === selectedCourse;
        if (!matchCourse) return false;

        return true;
    });

    // Initial Load: Reset exam selection when filtering changes
    useEffect(() => {
        setSelectedExamId('');
        setMainSelectedSubjectName('');
        setMainSelectedTitle('');
        // Don't auto-select first exam automatically to avoid confusion when switching categories
    }, [selectedCourse, selectedSubjectId]);

    // ⭐️ Main View Hierarchical Selection State
    const [mainSelectedSubjectName, setMainSelectedSubjectName] = useState('');
    const [mainSelectedTitle, setMainSelectedTitle] = useState('');

    // Sync hierarchy when selectedExamId changes (e.g. externally set or after creation)
    useEffect(() => {
        if (selectedExamId && availableExams.length > 0) {
            const target = availableExams.find(e => e.id === selectedExamId);
            if (target) {
                // Update parent categories if they don't match (Auto-fill)
                // Use a functional update or check to avoid unnecessary re-renders if needed, 
                // but React bails out on same value.
                if (target.subjectName !== mainSelectedSubjectName) setMainSelectedSubjectName(target.subjectName || '');
                if (target.title !== mainSelectedTitle) setMainSelectedTitle(target.title);
            }
        }
    }, [selectedExamId, availableExams]);

    // Load questions when exam changes
    useEffect(() => {
        if (selectedExamId) {
            loadQuestions(selectedExamId);
            setCurrentPage(1);
        } else {
            setQuestions([]);
        }
    }, [selectedExamId]);

    const loadQuestions = async (examId: string) => {
        console.log(`📡 Loading questions for exam: ${examId}`);
        const data = await ExamService.getAllQuestions(examId);
        console.log(`✅ Loaded ${data.length} questions`);
        setQuestions(data);
        setSelectedQuestionIds([]); // Reset selection on load
    };

    // ⭐️ Multi-select & Batch Move State
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
    const [isBatchMoveModalOpen, setIsBatchMoveModalOpen] = useState(false);
    const [batchMoveTargetCourseId, setBatchMoveTargetCourseId] = useState('');
    const [batchMoveTargetExams, setBatchMoveTargetExams] = useState<any[]>([]);

    // New States for Hierarchical Selection
    const [batchMoveSelectedSubjectName, setBatchMoveSelectedSubjectName] = useState('');
    const [batchMoveSelectedTitle, setBatchMoveSelectedTitle] = useState('');
    const [batchMoveTargetExamId, setBatchMoveTargetExamId] = useState('');
    const [batchMoveTargetSubjects, setBatchMoveTargetSubjects] = useState<{ id: string; name: string }[]>([]);

    // ⭐️ Batch Category Update State
    const [isBatchCategoryModalOpen, setIsBatchCategoryModalOpen] = useState(false);
    const [batchCategoryTarget, setBatchCategoryTarget] = useState('');


    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newQuestion, setNewQuestion] = useState<any>({
        category: '기타',
        options: ['', '', '', ''],
        correctAnswer: 0,
        optionImages: []
    });

    // Category Management State
    const [categories, setCategories] = useState<string[]>([]);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [categoryInput, setCategoryInput] = useState('');

    // ⭐️ Exam Creation Modal State
    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [newExamData, setNewExamData] = useState({
        title: '',
        timeLimit: 60,
        subjectName: '',
        topic: '',
        courseName: '',
        round: ''
    });



    // We need to find the ID corresponding to the name.

    // Ideally we should store generic Course objects in `courses` state, not just strings.
    // but refactoring that is big.
    // Let's modify CategoryService to accept name IF backend supports it? 
    // No, backend expects ID.

    // Workaround: We fetch all courses in loadInitialData, we should store them as objects.
    // But for now, let's query the API or find from a list.

    // Let's assume we can fetch by course ID. But we only have name. Eek.
    // We need to update the `courses` state to be objects `{id, name}` to proceed properly.
    // But `courses` is used as string[] everywhere. 

    // Quick fix: Fetch all courses, find the one with matching name, get its ID.



    // ⭐️ Load categories and subjects when selectedCourse changes
    useEffect(() => {
        const loadContextData = async () => {
            // Reset
            setCategories([]);
            setSubjects([]);

            if (!selectedCourse) return;

            // Wait for fullCourses to be loaded
            if (fullCourses.length === 0) return;

            const courseObj = fullCourses.find(c => c.name === selectedCourse);

            if (courseObj) {
                try {
                    // Load Categories
                    const cats = await CategoryService.getCategories(courseObj.id);
                    setCategories(cats.map((c: any) => c.name));

                    // Load Subjects
                    const subs = await SubjectService.getSubjects(courseObj.id);
                    setSubjects(subs);
                } catch (error) {
                    console.error("Error loading context data:", error);
                }
            }
        };

        loadContextData();
    }, [selectedCourse, fullCourses]);

    // ⭐️ Update newQuestion category when categories are loaded
    useEffect(() => {
        if (categories.length > 0 && !editingId) {
            setNewQuestion((prev: any) => ({
                ...prev,
                category: categories[0]
            }));
        }
    }, [categories]);


    // ⭐️ Dynamic Subject Loading for Modal
    // No need for courseName dependency here since we reverted to Read-Only Course
    // But actually, we want to allow selecting subjects in modal based on "selectedCourse" which is fixed.
    // So the subjects[] state is already correct from the effect above.

    // ...

    // ...

    // ⭐️ Batch Move Handlers
    const toggleQuestionSelection = (id: string) => {
        setSelectedQuestionIds(prev =>
            prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
        );
    };

    // ⭐️ Category-wise Batch Selection
    const selectQuestionsByCategory = (category: string) => {
        const categoryIds = questions
            .filter(q => q.category === category)
            .map(q => q.id);

        if (categoryIds.length === 0) return;

        setSelectedQuestionIds(prev => {
            // If all of them are already selected, we might want to toggle them off? 
            // Better to just "Add them all" to existing selection consistently.
            const newSelection = new Set([...prev, ...categoryIds]);
            return Array.from(newSelection);
        });
    };

    const toggleAllQuestions = () => {
        if (selectedQuestionIds.length === questions.length) {
            setSelectedQuestionIds([]);
        } else {
            setSelectedQuestionIds(questions.map(q => q.id));
        }
    };

    const openBatchMoveModal = () => {
        if (selectedQuestionIds.length === 0) return alert('이동할 문제를 선택해주세요.');

        // Init target selectors
        const currentCourseObj = fullCourses.find(c => c.name === selectedCourse);
        if (currentCourseObj) {
            setBatchMoveTargetCourseId(currentCourseObj.id);
            setBatchMoveSelectedSubjectName(''); // Reset
            setBatchMoveSelectedTitle(''); // Reset
            setBatchMoveTargetExamId('');

            // ⭐️ Pre-load exams from current view
            if (availableExams && availableExams.length > 0) {
                setBatchMoveTargetExams(availableExams);
            } else {
                ExamService.getExamsByCourse(currentCourseObj.name).then(exams => setBatchMoveTargetExams(exams));
            }
        }
        setIsBatchMoveModalOpen(true);
    };

    const handleBatchMoveQuestions = async () => {
        if (!batchMoveTargetExamId) return alert('이동할 대상 시험지를 선택해주세요.');
        if (batchMoveTargetExamId === selectedExamId) return alert('현재 시험지로 이동할 수 없습니다.');

        const confirmMsg = `${selectedQuestionIds.length}개의 문제를 선택한 시험지로 이동하시겠습니까?`;
        if (confirm(confirmMsg)) {
            const result = await ExamService.moveQuestions(selectedQuestionIds, batchMoveTargetExamId);
            if (result.success) {
                alert(result.message || '이동되었습니다.'); // Some might fail, but treat as success roughly
                setIsBatchMoveModalOpen(false);
                setSelectedQuestionIds([]);
                loadQuestions(selectedExamId); // Reload current list (moved items should disappear if filtered by exam, which they are)
            } else {
                alert(result.message || '이동 실패');
            }
        }
    };

    // ⭐️ Batch Update Category Handler
    const handleBatchUpdateCategory = async () => {
        if (!batchCategoryTarget) return alert('변경할 카테고리를 선택해주세요.');
        if (selectedQuestionIds.length === 0) return;

        const confirmMsg = `${selectedQuestionIds.length}개의 문제 카테고리를 '${batchCategoryTarget}'(으)로 일괄 변경하시겠습니까?`;
        if (confirm(confirmMsg)) {
            let successCount = 0;
            let failCount = 0;

            // 순차적으로 업데이트 (트랜잭션 대용)
            for (const qId of selectedQuestionIds) {
                const questionToUpdate = questions.find(q => q.id === qId);
                if (questionToUpdate) {
                    try {
                        const updatedQ = { ...questionToUpdate, category: batchCategoryTarget };
                        await ExamService.updateQuestionInExam(selectedExamId, updatedQ);
                        successCount++;
                    } catch (error) {
                        console.error(`Failed to update category for question ${qId}:`, error);
                        failCount++;
                    }
                }
            }

            if (failCount === 0) {
                alert(`${successCount}개의 문제 카테고리가 변경되었습니다.`);
            } else {
                alert(`${successCount}개 성공, ${failCount}개 실패하였습니다.`);
            }

            setIsBatchCategoryModalOpen(false);
            setSelectedQuestionIds([]);
            loadQuestions(selectedExamId);
        }
    };

    // Effect to reload exams when batch target course changes
    useEffect(() => {
        if (!isBatchMoveModalOpen || !batchMoveTargetCourseId) return;

        const loadExamsAndSubjects = async () => {
            const cObj = fullCourses.find(c => c.id === batchMoveTargetCourseId);
            if (cObj) {
                // Optimization: If target course is same as currently selected course in main view, use cached exams
                if (cObj.name === selectedCourse && exams.length > 0) {
                    setBatchMoveTargetExams(exams);
                } else {
                    const fetchedExams = await ExamService.getExamsByCourse(cObj.name);
                    setBatchMoveTargetExams(fetchedExams);
                }

                // ⭐ Load subjects for the selected course from the database
                const subjects = await SubjectService.getSubjects(batchMoveTargetCourseId);
                setBatchMoveTargetSubjects(subjects);
            } else {
                setBatchMoveTargetExams([]);
                setBatchMoveTargetSubjects([]);
            }
        };
        loadExamsAndSubjects();
    }, [batchMoveTargetCourseId, isBatchMoveModalOpen, fullCourses, exams, selectedCourse]);


    // ⭐️ Category Management Handlers (Async)
    const handleAddCategory = async () => {
        if (!selectedCourse) {
            alert('과정을 먼저 선택해주세요.');
            return;
        }

        if (!categoryInput.trim()) {
            alert('카테고리 이름을 입력해주세요.');
            return;
        }

        const allCourses = await CourseService.getCourses();
        const courseObj = allCourses.find((c: any) => c.name === selectedCourse);
        if (!courseObj) return;

        const success = await CategoryService.addCategory(categoryInput.trim(), courseObj.id);
        if (success) {
            // Reload
            const cats = await CategoryService.getCategories(courseObj.id);
            setCategories(cats.map(c => c.name));
            setCategoryInput('');
            alert('카테고리가 추가되었습니다.');
        } else {
            alert('이미 존재하는 카테고리이거나 오류가 발생했습니다.');
        }
    };

    const handleUpdateCategory = async () => {
        if (!selectedCourse || !editingCategory || !categoryInput.trim()) return;

        const allCourses = await CourseService.getCourses();
        const courseObj = allCourses.find((c: any) => c.name === selectedCourse);
        if (!courseObj) return;

        // Need category ID to update.
        // We only have name. We have to fetch categories to find the ID.
        const cats = await CategoryService.getCategories(courseObj.id);
        const targetCat = cats.find(c => c.name === editingCategory);

        if (targetCat) {
            const success = await CategoryService.updateCategory(targetCat.id, categoryInput.trim());
            if (success) {
                const refreshedCats = await CategoryService.getCategories(courseObj.id);
                setCategories(refreshedCats.map(c => c.name));
                setEditingCategory(null);
                setCategoryInput('');
                alert('카테고리가 수정되었습니다.');
            } else {
                alert('수정에 실패했습니다.');
            }
        }
    };

    const handleDeleteCategory = async (category: string) => {
        if (!selectedCourse) return;

        if (confirm(`'${category}' 카테고리를 삭제하시겠습니까?`)) {
            const allCourses = await CourseService.getCourses();
            const courseObj = allCourses.find((c: any) => c.name === selectedCourse);
            if (!courseObj) return;

            const cats = await CategoryService.getCategories(courseObj.id);
            const targetCat = cats.find(c => c.name === category);

            if (targetCat) {
                const success = await CategoryService.deleteCategory(targetCat.id);
                if (success) {
                    const refreshedCats = await CategoryService.getCategories(courseObj.id);
                    setCategories(refreshedCats.map(c => c.name));
                    alert('카테고리가 삭제되었습니다.');
                } else {
                    alert('삭제에 실패했습니다.');
                }
            }
        }
    };

    const startEditCategory = (category: string) => {
        setEditingCategory(category);
        setCategoryInput(category);
    };

    const cancelEditCategory = () => {
        setEditingCategory(null);
        setCategoryInput('');
    };

    // ⭐️ Exam Creation Handlers
    const handleCreateExam = () => {
        // Init modal with current context
        setNewExamData(prev => ({
            ...prev,
            courseName: selectedCourse || '',
            subjectName: '',
            topic: '',
            title: '',
            timeLimit: 60,
            round: ''
        }));
        setIsExamModalOpen(true);
    };

    const handleSaveNewExam = async () => {
        if (!newExamData.title.trim()) {
            alert('시험지 제목을 입력해주세요.');
            return;
        }

        if (!newExamData.title.trim()) {
            alert('시험지 제목을 입력해주세요.');
            return;
        }

        if (!newExamData.courseName.trim()) {
            alert('과정 이름을 입력해주세요.');
            return;
        }

        let courseIdToUse = '';
        const courseNameInput = newExamData.courseName.trim();

        // Check if course exists
        const existingCourse = fullCourses.find(c => c.name === courseNameInput);

        if (existingCourse) {
            courseIdToUse = existingCourse.id;
        } else {
            // Create new course
            if (confirm(`'${courseNameInput}' 과정이 존재하지 않습니다. 새로 생성하시겠습니까?`)) {
                const courseResult = await CourseService.addCourse(courseNameInput);
                if (courseResult.success && courseResult.courseId) {
                    courseIdToUse = courseResult.courseId;
                    // Refresh course list in background? 
                    // Ideally we should reload courses but for now we proceed with the ID.
                } else {
                    alert(courseResult.message || '과정 생성에 실패했습니다.');
                    return;
                }
            } else {
                return;
            }
        }

        let subjectIdToUse = selectedSubjectId; // 기본적으로 현재 선택된 과목 사용 (NOTE: This might be stale if course changed)

        // If course changed, we shouldn't use the selectedSubjectId from the *previous* course context
        if (existingCourse && existingCourse.name !== selectedCourse) {
            subjectIdToUse = ''; // Reset subject if course changed from the main UI selection
        } else if (!existingCourse) {
            subjectIdToUse = ''; // Reset if it's a new course
        }

        // 모달에서 과목명을 입력했다면, 해당 과목명 우선
        if (newExamData.subjectName && newExamData.subjectName.trim()) {
            const inputName = newExamData.subjectName.trim();

            // We need to check subjects for the *resolved* course, not just the currently loaded 'subjects' state
            // which might be for the *previously* selected course.
            // But we don't have the subjects for the *new* course loaded if it's different.

            // If it's a new course, it definitely has no subjects.
            // If it's an existing course but different from selectedCourse, we'd need to fetch its subjects to check for duplicates.
            // OR, we can just try to add it and let the backend handle duplicates? 
            // SubjectService.addSubject takes courseId. 

            // Let's rely on addSubject to return existing ID if we try to add? 
            // No, addSubject creates new. We need to check existence.

            let targetSubjects = subjects;
            if (courseIdToUse !== (fullCourses.find(c => c.name === selectedCourse)?.id)) {
                // If the course is different, we can't trust `subjects` state.
                // We should fetch them or just assume we need to create/find.
                // For now, let's just fetch them quickly.
                targetSubjects = await SubjectService.getSubjects(courseIdToUse);
            }

            const existingSubject = targetSubjects.find(s => s.name === inputName);

            if (existingSubject) {
                subjectIdToUse = existingSubject.id;
            } else {
                // 새 과목 생성
                const createResult = await SubjectService.addSubject(courseIdToUse, inputName);
                if (createResult.success && createResult.id) {
                    subjectIdToUse = createResult.id;
                } else {
                    alert('새 분류(과목) 생성에 실패했습니다.');
                    return;
                }
            }
        }

        const result = await ExamService.createExam({
            title: newExamData.title,
            courseName: courseIdToUse, // Pass ID here
            timeLimit: newExamData.timeLimit,
            subjectId: subjectIdToUse || undefined,
            topic: newExamData.topic || undefined, // Pass topic
            round: newExamData.round || undefined // Pass round
        } as any);

        if (result.success) {
            alert('시험지가 생성되었습니다!');
            setIsExamModalOpen(false);
            setNewExamData({ title: '', timeLimit: 60, subjectName: '', topic: '', courseName: '', round: '' });

            // Reload data
            await loadInitialData();

            // Auto-select new exam
            if (result.examId) {
                setSelectedExamId(result.examId);
            }
        } else {
            alert(result.message || '시험지 생성에 실패했습니다.');
        }
    };



    // ⭐️ Delete Exam Handler
    const handleDeleteExam = async () => {
        if (!selectedExamId) return;

        const currentExam = exams.find(e => e.id === selectedExamId);
        if (!currentExam) return;

        // ⭐️ Check for existing questions
        if (currentExam.questionsCount && currentExam.questionsCount > 0) {
            if (!confirm(`🚨 경고: '${currentExam.title}' 시험지에는 ${currentExam.questionsCount}개의 문제가 등록되어 있습니다.\n\n시험지를 삭제하면 포함된 모든 문제와 풀이 기록이 "영구적으로 삭제"됩니다.\n\n정말 삭제하시겠습니까?`)) {
                return;
            }
        } else {
            if (!confirm(`'${currentExam.title}' 시험지를 정말 삭제하시겠습니까?`)) return;
        }

        const result = await ExamService.deleteExam(selectedExamId);
        if (result.success) {
            alert('시험지가 삭제되었습니다.');
            setSelectedExamId('');
            await loadInitialData();
            setQuestions([]); // Clear question list
        } else {
            alert('삭제에 실패했습니다.');
        }
    };

    // ⭐️ Open Edit Exam Modal
    const openExamEditModal = async () => {
        if (!selectedExamId) return;
        const currentExam = exams.find(e => e.id === selectedExamId);
        if (!currentExam) return;

        // Load full details for timeLimit etc.
        const fullDetail = await ExamService.getExamById(selectedExamId);

        setEditExamData({
            id: selectedExamId,
            title: currentExam.title,
            timeLimit: fullDetail?.timeLimit || 60,
            subjectName: currentExam.subjectName || '',
            topic: currentExam.topic || '',
            round: currentExam.round || '',
            description: fullDetail?.description || ''
        });
        setIsExamEditModalOpen(true);
    };

    // ⭐️ Handle Update Exam
    const handleUpdateExam = async () => {
        if (!editExamData.title.trim()) return alert('제목을 입력해주세요.');

        const currentExam = exams.find(e => e.id === selectedExamId);
        if (!currentExam) return;

        // Find Subject ID logic
        let subjectIdToUse: string | null | undefined = undefined;

        // Check if subject name has changed strictly
        const currentSubjectName = currentExam.subjectName || '';
        const newSubjectName = editExamData.subjectName || '';

        if (newSubjectName !== currentSubjectName) {
            // Subject has changed
            if (!newSubjectName.trim()) {
                // Cleared -> Set to null to remove from DB
                subjectIdToUse = null;
            } else {
                // Changed to a text -> Find ID or Create
                if (currentExam.courseId) {
                    const subjects = await SubjectService.getSubjects(currentExam.courseId);
                    const sub = subjects.find(s => s.name === newSubjectName);
                    if (sub) {
                        subjectIdToUse = sub.id;
                    } else {
                        // Auto-create new subject if not found
                        const newSub = await SubjectService.addSubject(currentExam.courseId, newSubjectName);
                        if (newSub.success && newSub.id) subjectIdToUse = newSub.id;
                    }
                }
            }
        }
        // If name hasn't changed, subjectIdToUse remains undefined (no update sent)

        const result = await ExamService.updateExam(editExamData.id, {
            title: editExamData.title,
            timeLimit: editExamData.timeLimit,
            subjectId: subjectIdToUse,
            topic: editExamData.topic,
            round: editExamData.round,
            description: editExamData.description
        });

        if (result.success) {
            alert('수정되었습니다.');
            setIsExamEditModalOpen(false);
            await loadInitialData();
        } else {
            alert('수정 실패: ' + result.message);
        }
    };

    // Create New Course Handler
    const handleCreateCourse = async () => {
        const newCourse = prompt('새로운 과정명을 입력하세요 (예: 정보처리기사)');
        if (newCourse) {
            if (courses.includes(newCourse)) {
                alert('이미 존재하는 과정입니다.');
                return;
            }
            await CourseService.addCourse(newCourse);
            await loadInitialData();
            alert(`'${newCourse}' 과정이 추가되었습니다.`);
        }
    };

    // Edit Course Handler
    const handleEditCourse = async (e: React.MouseEvent, oldName: string) => {
        e.stopPropagation(); // prevent card click
        const newName = prompt('수정할 과정명을 입력하세요:', oldName);
        if (newName && newName !== oldName) {
            if (courses.includes(newName)) {
                alert('이미 존재하는 과정명입니다.');
                return;
            }

            try {
                // Find ID
                const courseObj = fullCourses.find(c => c.name === oldName);
                if (!courseObj) {
                    alert('Error: Course ID not found');
                    return;
                }

                // 1. Update Course
                await CourseService.updateCourse(courseObj.id, newName);

                // 2. Refresh
                await loadInitialData();

                alert('과정명이 수정되었습니다.');

            } catch (err) {
                console.error('Failed to update course name:', err);
                alert('과정명 수정 중 오류가 발생했습니다.');
            }
        }
    };

    // ⭐️ Delete Course Handler
    const handleDeleteCourse = async (e: React.MouseEvent, courseName: string) => {
        e.stopPropagation(); // prevent card click

        const relatedExams = exams.filter(ex => ex.course === courseName);
        const count = relatedExams.length;

        if (count > 0) {
            if (!confirm(`🚨 경고: '${courseName}' 과정에는 ${count}개의 시험지가 등록되어 있습니다.\n\n과정을 삭제하면 포함된 모든 시험지와 문제 데이터가 "영구적으로 삭제"됩니다.\n\n정말 삭제하시겠습니까?`)) {
                return;
            }
        } else {
            if (!confirm(`'${courseName}' 과정을 삭제하시겠습니까?`)) {
                return;
            }
        }

        const courseObj = fullCourses.find(c => c.name === courseName);
        if (!courseObj) {
            alert('Error: Course ID not found');
            return;
        }

        // Delete all related exams
        for (const exam of relatedExams) {
            const result = await ExamService.deleteExam(exam.id);
            if (!result.success) {
                alert(`시험지 삭제 중 오류가 발생했습니다: ${exam.title}`);
                return;
            }
        }

        // Delete Course
        await CourseService.deleteCourse(courseObj.id);

        // Refresh
        await loadInitialData();
        setQuestions([]);

        alert('과정이 삭제되었습니다.');
    };

    const handleEditQuestion = (q: Question) => {
        setEditingId(q.id);

        // ⭐️ Robust Parsing for optionImages (Handling Array, JSON String, or Double-Encoded String)
        let safeOptionImages: (string | null)[] = [];
        try {
            const raw = q.optionImages;
            if (Array.isArray(raw)) {
                safeOptionImages = raw;
            } else if (typeof raw === 'string') {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    safeOptionImages = parsed;
                } else if (typeof parsed === 'string') {
                    // Try parsing one more time for double-encoded strings
                    const deepParsed = JSON.parse(parsed);
                    if (Array.isArray(deepParsed)) safeOptionImages = deepParsed;
                }
            }
        } catch (e) {
            console.error('Failed to parse optionImages for editing:', e);
            safeOptionImages = [];
        }

        setNewQuestion({ ...q, optionImages: safeOptionImages });
        setIsFormOpen(true);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ⭐️ Image Compression Utility
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1024; // Limit width to 1024px
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Canvas context not available'));
                        return;
                    }

                    // ⭐️ Fill white background for transparent PNGs
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);

                    ctx.drawImage(img, 0, 0, width, height);
                    // Compress to JPEG with 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    // Image Upload Handler (with Compression)
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedDataUrl = await compressImage(file);
                setNewQuestion({ ...newQuestion, imageUrl: compressedDataUrl });
            } catch (error) {
                console.error('Image compression failed:', error);
                alert('이미지 처리 중 오류가 발생했습니다.');
            }
        }
    };

    // ⭐️ Paste Image Handler (Ctrl+V) with Compression
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            if (!isFormOpen) return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        try {
                            const compressedDataUrl = await compressImage(blob);
                            setNewQuestion((prev: any) => ({ ...prev, imageUrl: compressedDataUrl }));
                        } catch (error) {
                            console.error('Paste image compression failed:', error);
                        }
                        e.preventDefault();
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isFormOpen]);

    // ⭐️ String Image Compression Utility (for existing base64 strings)
    const compressStringImage = (dataUrl: string): Promise<string> => {
        return new Promise((resolve) => {
            // If not a data URL or already short/compressed (heuristic), return as is
            if (!dataUrl || !dataUrl.startsWith('data:image')) {
                resolve(dataUrl);
                return;
            }

            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(dataUrl);
                    return;
                }

                // ⭐️ Fill white background for transparent PNGs
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);

                ctx.drawImage(img, 0, 0, width, height);
                // Force JPEG 0.7
                const compressed = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressed);
            };
            img.onerror = () => {
                // If loading fails, return original
                resolve(dataUrl);
            };
        });
    };

    const handleSave = async () => {
        if (!selectedExamId) return alert('시험지를 먼저 선택해주세요.');
        if (!newQuestion.text) {
            alert('문제 내용을 입력해주세요.');
            return;
        }

        const isSubjective = !newQuestion.options || newQuestion.options.length === 0;

        if (isSubjective && (newQuestion.correctAnswer === undefined || newQuestion.correctAnswer === '')) {
            if (!confirm('정답이 입력되지 않았습니다. 그래도 저장하시겠습니까?')) return;
        }

        // ⭐️ Auto-compress images before saving (Crucial for existing uncompressed data)
        let processedImageUrl = newQuestion.imageUrl;
        if (processedImageUrl && typeof processedImageUrl === 'string') {
            try {
                processedImageUrl = await compressStringImage(processedImageUrl);
            } catch (e) {
                console.error('Image compression error:', e);
            }
        }

        let processedOptionImages: (string | null)[] = [];
        if (newQuestion.optionImages && Array.isArray(newQuestion.optionImages)) {
            processedOptionImages = await Promise.all(newQuestion.optionImages.map(async (img: any) => {
                if (img && typeof img === 'string') {
                    return await compressStringImage(img);
                }
                return img;
            }));
        }

        // 이미지 삭제 처리: null, undefined, 빈 문자열 모두 null로 처리
        let imageUrlValue: string | null | undefined;
        if (processedImageUrl === null || processedImageUrl === '' || processedImageUrl === undefined) {
            // 이미지가 삭제된 경우 명시적으로 null 전달
            imageUrlValue = null;
        } else {
            imageUrlValue = processedImageUrl;
        }

        console.log('저장할 문제 데이터(압축됨):', {
            id: editingId || `q_${Date.now()} `,
            imageUrlLength: imageUrlValue?.length || 0,
            isNull: imageUrlValue === null
        });

        // Option images 처리
        let optionImagesValue: (string | null)[] | undefined;
        if (processedOptionImages.length > 0) {
            optionImagesValue = processedOptionImages.map((img: string | null | undefined) =>
                (img === null || img === '' || img === undefined) ? null : img
            );
        }

        const q: Question = {
            id: editingId || `q_${Date.now()} `,
            text: newQuestion.text,
            category: newQuestion.category || '기타',
            options: isSubjective ? [] : (newQuestion.options as string[]),
            correctAnswer: newQuestion.correctAnswer ?? (isSubjective ? -1 : 0),
            explanation: newQuestion.explanation || '해설 없음',
            imageUrl: imageUrlValue,
            optionImages: optionImagesValue
        };

        try {
            if (editingId) {
                console.log('문제 수정 시작:', q);
                await ExamService.updateQuestionInExam(selectedExamId, q);
                alert('문제가 수정되었습니다.');
            } else {
                await ExamService.addQuestionToExam(selectedExamId, q);
                alert('문제가 등록되었습니다.');
            }

            setIsFormOpen(false);
            setEditingId(null);
            setNewQuestion({ category: categories.length > 0 ? categories[0] : '기타', options: ['', '', '', ''], correctAnswer: 0, optionImages: [] });
            // 문제 목록 다시 불러오기
            await loadQuestions(selectedExamId);
        } catch (error) {
            console.error('문제 저장 오류:', error);
            alert('문제 저장 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
        }
    };

    const handleDelete = async (id: string) => {
        if (!selectedExamId) return;
        if (confirm('정말 삭제하시겠습니까?')) {
            await ExamService.removeQuestionFromExam(selectedExamId, id);
            loadQuestions(selectedExamId);
        }
    };

    // ⭐️ AI 해설 자동 생성 (TODO: UI 버튼 추가 후 활성화)
    /*
    const handleGenerateExplanation = async () => {
        // 문제 텍스트와 선택지, 정답이 모두 입력되었는지 확인
        if (!newQuestion.text.trim()) {
            alert('문제 내용을 먼저 입력해주세요.');
            return;
        }

        if (!newQuestion.options || newQuestion.options.length < 2) {
            alert('최소 2개 이상의 선택지를 입력해주세요.');
            return;
        }

        if (newQuestion.correctAnswer === undefined || newQuestion.correctAnswer === null || newQuestion.correctAnswer === '') {
            alert('정답을 먼저 선택해주세요.');
            return;
        }

        setGeneratingExplanation(true);
        try {
            const explanation = await AIService.generateExplanation({
                text: newQuestion.text,
                options: newQuestion.options,
                correctAnswer: typeof newQuestion.correctAnswer === 'string'
                    ? parseInt(newQuestion.correctAnswer)
                    : newQuestion.correctAnswer
            });

            setNewQuestion({ ...newQuestion, explanation });
            alert('AI 해설이 생성되었습니다!');
        } catch (error: any) {
            console.error('AI 해설 생성 오류:', error);
            alert(`AI 해설 생성 중 오류가 발생했습니다:\n${error.message || '알 수 없는 오류'}`);
        } finally {
            setGeneratingExplanation(false);
        }
    };
    */

    const handleOptionChange = (idx: number, val: string) => {
        const newOpts = [...(newQuestion.options || [])];
        newOpts[idx] = val;
        setNewQuestion({ ...newQuestion, options: newOpts });
    };

    // ⭐️ Debug: Monitor optionImages state
    useEffect(() => {
        console.log('Current newQuestion.optionImages:', newQuestion.optionImages);
    }, [newQuestion.optionImages]);

    // Option Image Upload Handler (Improved with functional update and compression)
    const handleOptionImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log(`Uploading image for Option ${idx + 1}...`);
            try {
                const compressedDataUrl = await compressImage(file);
                console.log(`Compression successful for Option ${idx + 1}. Length: ${compressedDataUrl.length}`);

                setNewQuestion((prev: any) => {
                    // Ensure we are working with an array
                    let currentImages = Array.isArray(prev.optionImages) ? [...prev.optionImages] : [];

                    // Fill with nulls if shorter than idx
                    while (currentImages.length <= idx) {
                        currentImages.push(null);
                    }

                    currentImages[idx] = compressedDataUrl;

                    console.log('Updated optionImages array:', currentImages);
                    return { ...prev, optionImages: currentImages };
                });
            } catch (error) {
                console.error('Option image compression failed:', error);
                alert('보기 이미지 처리 중 오류가 발생했습니다.');
            }
        }
        e.target.value = ''; // Reset input
    };

    // ⭐️ Handle Paste for Option Inputs
    const handleOptionPaste = async (idx: number, e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (file) {
                    try {
                        const compressedDataUrl = await compressImage(file);
                        setNewQuestion((prev: any) => {
                            let currentImages = Array.isArray(prev.optionImages) ? [...prev.optionImages] : [];
                            while (currentImages.length <= idx) {
                                currentImages.push(null);
                            }
                            currentImages[idx] = compressedDataUrl;
                            return { ...prev, optionImages: currentImages };
                        });
                        console.log(`Pasted image to option ${idx + 1}`);
                    } catch (error) {
                        console.error('Paste image compression failed:', error);
                    }
                }
                break;
            }
        }
    };

    // Option Image Delete Handler (Improved with functional update)
    const handleOptionImageDelete = (idx: number) => {
        console.log(`Deleting option image at index ${idx}`);
        setNewQuestion((prev: any) => {
            const currentImages = Array.isArray(prev.optionImages) ? [...prev.optionImages] : [];
            // Ensure array is long enough to set null at idx
            while (currentImages.length <= idx) {
                currentImages.push(null);
            }
            currentImages[idx] = null;
            return { ...prev, optionImages: currentImages };
        });
    };

    // ⭐️ AI 유사 문제 생성 핸들러 (과정 컨텍스트 포함)
    const handleGenerateSimilar = async (question: Question) => {
        if (!apiKey) {
            alert('OpenAI API Key를 먼저 설정해주세요.');
            setShowApiKeyModal(true);
            return;
        }

        setGeneratingForQuestion(question);
        setIsAiProcessing(true);
        setGeneratedQuestions([]);
        setShowSimilarModal(true);

        // 현재 선택된 시험 정보 가져오기
        const currentExam = exams.find(e => e.id === selectedExamId);
        const examTitle = currentExam?.title || '';

        try {
            const generated = await OpenAIService.generateSimilarQuestions(
                {
                    text: question.text,
                    options: question.options,
                    correctAnswer: typeof question.correctAnswer === 'number' ? question.correctAnswer : 0,
                    explanation: question.explanation,
                    category: question.category // 카테고리 정보 추가
                },
                apiKey,
                3, // 3개의 유사문제 생성
                selectedCourse || undefined, // 과정명 전달
                examTitle // 시험명 전달
            );
            setGeneratedQuestions(generated);
        } catch (error: any) {
            console.error('AI 생성 오류:', error);
            alert('유사 문제 생성 실패: ' + error.message);
            setShowSimilarModal(false);
        } finally {
            setIsAiProcessing(false);
        }
    };

    // 생성된 문제 하나 추가
    const handleAddGeneratedQuestion = async (genQ: any, index: number) => {
        if (!selectedExamId) return;

        const newQ: Question = {
            id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: genQ.text,
            options: genQ.options,
            correctAnswer: genQ.correctAnswer,
            category: generatingForQuestion?.category || 'AI 추출',
            explanation: genQ.explanation
        };

        await ExamService.addQuestionToExam(selectedExamId, newQ);

        // 추가한 문제는 목록에서 제거
        setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));

        alert(`문제가 추가되었습니다!`);
        loadQuestions(selectedExamId);
    };

    // 생성된 문제 모두 추가
    const handleAddAllGeneratedQuestions = async () => {
        if (!selectedExamId || generatedQuestions.length === 0) return;

        for (const genQ of generatedQuestions) {
            const newQ: Question = {
                id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: genQ.text,
                options: genQ.options,
                correctAnswer: genQ.correctAnswer,
                category: generatingForQuestion?.category || 'AI 추출',
                explanation: genQ.explanation
            };
            await ExamService.addQuestionToExam(selectedExamId, newQ);
        }

        alert(`${generatedQuestions.length}개의 문제가 모두 추가되었습니다!`);
        setGeneratedQuestions([]);
        setShowSimilarModal(false);
        loadQuestions(selectedExamId);
    };

    // Excel Upload Handler
    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedExamId) return alert('시험지를 먼저 선택해주세요.');
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                const data: any[] = XLSX.utils.sheet_to_json(ws);
                let successCount = 0;

                for (const row of data) {
                    if (!row.text) continue;

                    const q: Question = {
                        id: `q_bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)} `,
                        text: row.text,
                        category: row.category || '기타',
                        options: [
                            row.option1?.toString() || '',
                            row.option2?.toString() || '',
                            row.option3?.toString() || '',
                            row.option4?.toString() || ''
                        ],
                        correctAnswer: row.answer ? (parseInt(row.answer) - 1) : 0,
                        explanation: row.explanation || '해설 없음',
                        imageUrl: row.imageUrl
                    };

                    await ExamService.addQuestionToExam(selectedExamId, q);
                    successCount++;
                }

                alert(`${successCount}개의 문제가 성공적으로 업로드되었습니다.`);
                loadQuestions(selectedExamId);

            } catch (error) {
                console.error('Excel processing error:', error);
                alert('엑셀 파일 처리 중 오류가 발생했습니다. 형식을 확인해주세요.');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    // PDF Upload Handler (Enhanced)
    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedExamId) return alert('시험지를 먼저 선택해주세요.');
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Dynamic import for code splitting
            const pdfjsLib = await import('pdfjs-dist');
            const pdfVersion = pdfjsLib.version || '5.4.449';
            console.log(`Using PDF.js version: ${pdfVersion}`);

            // ⭐️ Worker 설정 (버전 호환성을 위해 unpkg 사용 및 mjs 확장자 명시)
            if (pdfjsLib.GlobalWorkerOptions) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.mjs`;
            }

            const arrayBuffer = await file.arrayBuffer();

            // ⭐️ 한글 및 특수문자 처리를 위한 CMap 설정 추가
            const pdf = await pdfjsLib.getDocument({
                data: arrayBuffer,
                cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfVersion}/cmaps/`,
                cMapPacked: true,
                standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfVersion}/standard_fonts/`
            }).promise;

            // ⭐️ 1. Text & Image Extraction Phase
            let fullText = '';
            const allImages: { page: number, y: number, x: number, base64: string }[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 }); // High quality for images

                // --- Image Extraction Logic (Beta) ---
                try {
                    const ops = await page.getOperatorList();
                    const commonObjs = page.commonObjs;
                    const objs = page.objs;

                    for (let j = 0; j < ops.fnArray.length; j++) {
                        if (ops.fnArray[j] === pdfjsLib.OPS.paintImageXObject) {
                            const imgName = ops.argsArray[j][0];
                            let imgData: any = null;
                            try {
                                if (commonObjs.has(imgName)) imgData = commonObjs.get(imgName);
                                else if (objs.has(imgName)) imgData = objs.get(imgName);
                            } catch (e) { /* ignore */ }

                            if (imgData && imgData.width > 50 && imgData.height > 50) { // Ignore small icons
                                const canvas = document.createElement('canvas');
                                canvas.width = imgData.width;
                                canvas.height = imgData.height;
                                const ctx = canvas.getContext('2d');
                                if (ctx && imgData.bitmap) {
                                    ctx.drawImage(imgData.bitmap, 0, 0);
                                    const base64 = canvas.toDataURL('image/png');

                                    // Approximate position (Last transform)
                                    let y = 0, x = 0;
                                    if (j > 0 && ops.fnArray[j - 1] === pdfjsLib.OPS.transform) {
                                        const transform = ops.argsArray[j - 1];
                                        x = transform[4];
                                        y = viewport.height - transform[5];
                                    }
                                    allImages.push({ page: i, y, x, base64 });
                                }
                            }
                        }
                    }
                } catch (imgErr) { console.warn('Image extraction failed on page ' + i, imgErr); }

                // --- Text Extraction (Enhanced Sorting) ---
                const textContent = await page.getTextContent();
                let lastY = -1;
                let pageText = '';

                const items = (textContent.items as any[]).map(item => ({
                    str: item.str,
                    x: item.transform[4],
                    y: viewport.height - item.transform[5],
                }));

                // Sort by Y (desc) then X (asc)
                items.sort((a, b) => {
                    const lineDiff = Math.abs(a.y - b.y);
                    if (lineDiff < 5) return a.x - b.x;
                    return a.y - b.y;
                });

                for (const item of items) {
                    if (lastY !== -1 && Math.abs(item.y - lastY) > 8) {
                        pageText += '\n';
                    }
                    pageText += item.str;
                    lastY = item.y;
                }
                fullText += pageText + '\n\n';
            }

            const normalizedText = fullText.replace(/\r\n/g, '\n');

            let successCount = 0;

            // ⭐️ If API Key is present, use AI Smart Parsing
            if (apiKey) {
                setIsAiProcessing(true);
                try {
                    // Send text to OpenAI (Chunking might be needed for very large PDFs, but fullText sends here)
                    const parsedQuestions = await OpenAIService.parseQuestionsWithAI(normalizedText, apiKey);

                    if (parsedQuestions.length > 0) {
                        for (const item of parsedQuestions) {
                            const q: Question = {
                                id: `q_ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                text: item.text,
                                category: 'AI 추출',
                                options: item.options || ['', '', '', ''],
                                correctAnswer: item.correctAnswer ?? -1,
                                explanation: item.explanation || 'AI 자동 추출 문제',
                            };
                            await ExamService.addQuestionToExam(selectedExamId, q);
                            successCount++;
                        }
                        alert(`🤖 AI가 ${successCount}개의 문제를 깔끔하게 정리하여 등록했습니다!`);
                    } else {
                        alert('AI가 문제를 찾지 못했습니다. 텍스트 추출이 너무 엉망일 수 있습니다.');
                    }
                } catch (aiError: any) {
                    console.error('AI Parsing Error:', aiError);
                    alert(`AI 처리 중 오류가 발생했습니다.\n${aiError.message}`);
                } finally {
                    setIsAiProcessing(false);
                }
            }
            // ⭐️ Fallback to Legacy Regex Parsing
            else {
                const questionStartRegex = /\n\s*\d+[\.\)]/g;
                const matches = [...normalizedText.matchAll(questionStartRegex)];

                for (let i = 0; i < matches.length; i++) {
                    const startIdx = matches[i].index!;
                    const endIdx = i < matches.length - 1 ? matches[i + 1].index! : normalizedText.length;
                    const rawBlock = normalizedText.substring(startIdx, endIdx).trim();
                    const questionBody = rawBlock.replace(/^\d+[\.\)]\s*/, '');

                    const options: string[] = ['', '', '', ''];
                    let questionText = questionBody;
                    let answerIndex = 0;

                    const circlePattern = /[①②③④]/g;
                    const parenPattern = /\(\d\)|^\d\)/gm;
                    const dotPattern = /\s[1-4][\.\)]/g;

                    let splitPattern: RegExp | null = null;

                    if (circlePattern.test(questionBody)) splitPattern = /([①②③④])/;
                    else if (questionBody.match(/(?:^|\s)(?:가|나|다|라)[\.\)]/)) splitPattern = /(?:^|\s)([가나다라][\.\)])/;
                    else if (parenPattern.test(questionBody)) splitPattern = /(\(\d\)|^\d\))/;
                    else if (dotPattern.test(questionBody)) splitPattern = /(\s[1-4][\.\)])/;

                    if (splitPattern) {
                        const parts = questionBody.split(splitPattern);
                        if (parts.length >= 9) {
                            questionText = parts[0].trim();
                            options[0] = parts[2].trim();
                            options[1] = parts[4].trim();
                            options[2] = parts[6].trim();
                            options[3] = parts[8].trim();
                        }
                    } else {
                        questionText = questionBody + "\n\n[자동 분리 실패: 보기를 직접 수정해주세요]";
                    }

                    options.forEach((opt, idx) => {
                        options[idx] = opt.replace(/\n/g, ' ').trim();
                    });

                    // ⭐️ Try to assign image sequentially (Beta Feature)
                    // 정확한 위치 매핑은 기술적으로 어렵지만, 순차적으로 할당하여 사용자가 수정하게 돕습니다.
                    let allocatedImage = undefined;
                    if (i < allImages.length) {
                        allocatedImage = allImages[i].base64;
                    }

                    const q: Question = {
                        id: `q_pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        text: questionText,
                        category: 'PDF 추출',
                        options: options,
                        correctAnswer: answerIndex,
                        explanation: 'PDF 자동 추출 문제. 검수가 필요합니다.',
                        imageUrl: allocatedImage
                    };

                    await ExamService.addQuestionToExam(selectedExamId, q);
                    successCount++;
                }

                if (successCount > 0) {
                    let msg = `PDF에서 ${successCount}개의 문제를 추출했습니다.`;
                    if (allImages.length > 0) {
                        msg += `\n\n[🖼️ 이미지 발견됨: ${allImages.length}개]\n순서대로 문제에 첨부했습니다. (정확하지 않을 수 있으니 꼭 확인하세요!)`;
                    }
                    alert(msg);
                } else {
                    alert('문제 형식을 식별하지 못했습니다.');
                }
            }

            if (successCount > 0) {
                loadQuestions(selectedExamId);
            }

        } catch (error: any) {
            console.error('PDF processing error:', error);
            // ⭐️ Detailed Error Message
            const errorMsg = error?.message || '알 수 없는 오류';
            alert(`PDF 파일 처리 중 오류가 발생했습니다.\n\n내용: ${errorMsg}\n\n(참고: Worker 로딩 실패 시 네트워크 상태를 확인하세요)`);
            setIsAiProcessing(false);
        }
        e.target.value = '';
    };

    return (
        <div>
            {!selectedCourse && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <button onClick={() => navigate('/admin/dashboard')} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#64748b',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}>
                        <ChevronLeft size={18} /> 대시보드로 돌아가기
                    </button>
                </div>
            )}

            {selectedCourse && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <button onClick={() => setSelectedCourse(null)} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#64748b',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}>
                        <ChevronLeft size={18} /> 과정 목록으로
                    </button>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '1rem', color: '#1e293b' }}>
                        {selectedCourse} (v1.0.1)
                    </h2>
                </div>
            )}

            <main style={{ marginTop: '1rem' }}>

                {!selectedCourse ? (
                    /* View 1: Course List */
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <LayoutGrid size={24} color="var(--primary-600)" />
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-800)' }}>과정 선택</h2>
                            </div>
                            <button onClick={handleCreateCourse} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={18} /> 새 과정 등록
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {courses.map((course: string) => {
                                const examCount = exams.filter(e => e.course === course).length;
                                console.log(`📚 Course "${course}" exam count:`, examCount, 'from exams:', exams.filter(e => e.course === course));
                                return (
                                    <div
                                        key={course}
                                        onClick={() => setSelectedCourse(course)}
                                        className="glass-card"
                                        style={{
                                            padding: '1.5rem',
                                            background: 'white',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            borderTop: '4px solid var(--primary-500)',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                            <BookOpen size={32} color="var(--primary-200)" />
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={(e) => handleEditCourse(e, course)}
                                                    style={{
                                                        border: 'none',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        color: 'var(--slate-400)',
                                                        padding: '4px',
                                                        borderRadius: '4px'
                                                    }}
                                                    className="hover:bg-slate-100 hover:text-slate-600"
                                                    title="과정명 수정"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCourse(course);
                                                        setTimeout(() => openCourseEditModal(), 0);
                                                    }}
                                                    style={{
                                                        border: 'none',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        color: 'var(--slate-400)',
                                                        padding: '4px',
                                                        borderRadius: '4px'
                                                    }}
                                                    className="hover:bg-slate-100 hover:text-blue-600"
                                                    title="과정 소개/상세 편집"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteCourse(e, course)}
                                                    style={{
                                                        border: 'none',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        color: 'var(--slate-400)',
                                                        padding: '4px',
                                                        borderRadius: '4px'
                                                    }}
                                                    className="hover:bg-red-50 hover:text-red-500"
                                                    title="과정 삭제"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--slate-800)' }}>{course}</h3>
                                        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>
                                            등록된 시험지: <strong style={{ color: 'var(--primary-600)' }}>{examCount}</strong> 개
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {courses.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--slate-400)' }}>
                                등록된 과정이 없습니다. '새 과정 등록' 버튼을 눌러 추가해주세요.
                            </div>
                        )}
                    </div>
                ) : (
                    /* View 2: Exam & Question Management (Detail View) */
                    <>
                        {/* Context Selection Bar (Modified for Single Data) */}
                        <section style={{
                            marginBottom: '2rem',
                            padding: '1.5rem',
                            background: 'white',
                            borderRadius: '0.75rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid var(--primary-100)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Folder size={20} color="var(--primary-600)" />
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>출제 대상 선택</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Row 1: All Selectors in one line */}
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', width: '100%' }}>

                                    {/* 1. Course (Read Only) */}
                                    <div style={{ flex: 1, minWidth: '180px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '0.5rem' }}>대분류 (선택된 과정)</label>
                                        <div style={{
                                            padding: '0.75rem',
                                            background: 'var(--slate-50)',
                                            borderRadius: '0.5rem',
                                            fontWeight: 600,
                                            color: 'var(--slate-700)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            border: '1px solid var(--slate-200)',
                                            height: '42px' // Fixed height
                                        }}>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedCourse}</span>
                                            <button
                                                onClick={openCourseEditModal}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary-600)', padding: '2px', marginLeft: '4px' }}
                                                title="과정 소개 편집"
                                            >
                                                <FileText size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 2. Subject (Dynamic) - Use actual subjects from database */}
                                    <div style={{ flex: 1, minWidth: '180px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <label className="input-label" style={{ marginBottom: 0 }}>중분류 (과목)</label>
                                            <button
                                                onClick={() => setShowSubjectModal(true)}
                                                style={{
                                                    border: 'none',
                                                    background: 'none',
                                                    cursor: 'pointer',
                                                    color: 'var(--primary-600)',
                                                    fontSize: '0.75rem',
                                                    padding: '2px 6px',
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                                title="과목 관리 (추가/수정/삭제)"
                                            >
                                                <Settings size={14} /> 관리
                                            </button>
                                        </div>
                                        <select
                                            className="input-field"
                                            value={mainSelectedSubjectName}
                                            onChange={e => {
                                                setMainSelectedSubjectName(e.target.value);
                                                setMainSelectedTitle('');
                                                setSelectedExamId('');
                                            }}
                                            style={{ height: '42px' }}
                                        >
                                            <option value="">과목을 선택하세요</option>
                                            <option value="ALL_EXAMS" style={{ fontWeight: 'bold', color: 'var(--primary-600)' }}>📁 전체 시험지 보기</option>
                                            {subjects.map(sub => (
                                                <option key={sub.id} value={sub.name}>{sub.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 3. Title (Dynamic) - ⭐ Filter by subjectId */}
                                    {(() => {
                                        // Find the selected subject's ID
                                        const selectedSubject = subjects.find(s => s.name === mainSelectedSubjectName);
                                        const selectedSubjectId = selectedSubject?.id;

                                        // Filter by subjectId for accuracy
                                        const filteredBySubject = availableExams.filter(e => {
                                            if (mainSelectedSubjectName === 'ALL_EXAMS') return true;

                                            if (selectedSubjectId) {
                                                return e.subjectId === selectedSubjectId;
                                            }
                                            // Fallback
                                            return (e.subjectName || '미분류') === mainSelectedSubjectName;
                                        });
                                        const uniqueTitles = Array.from(new Set(filteredBySubject.map(e => e.title))).sort();
                                        return (
                                            <div style={{ flex: 1, minWidth: '180px' }}>
                                                <label className="input-label">소분류 (시험지 제목)</label>
                                                <select
                                                    className="input-field"
                                                    value={mainSelectedTitle}
                                                    onChange={e => {
                                                        setMainSelectedTitle(e.target.value);
                                                        setSelectedExamId('');
                                                    }}
                                                    disabled={!mainSelectedSubjectName}
                                                    style={{ height: '42px' }}
                                                >
                                                    <option value="">시험지를 선택하세요</option>
                                                    {uniqueTitles.map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    })()}

                                    {/* 4. Round (Cha-si) - ⭐ Filter by subjectId and title */}
                                    {(() => {
                                        // Find the selected subject's ID
                                        const selectedSubject = subjects.find(s => s.name === mainSelectedSubjectName);
                                        const selectedSubjectId = selectedSubject?.id;

                                        const finalCandidates = availableExams.filter(e => {
                                            // Match by subjectId
                                            const subjectMatch = (mainSelectedSubjectName === 'ALL_EXAMS')
                                                ? true
                                                : selectedSubjectId
                                                    ? e.subjectId === selectedSubjectId
                                                    : (e.subjectName || '미분류') === mainSelectedSubjectName;

                                            const titleMatch = e.title === mainSelectedTitle;

                                            return subjectMatch && titleMatch;
                                        });
                                        return (
                                            <div style={{ flex: 1, minWidth: '180px' }}>
                                                <label className="input-label">차시 (회차/Exam)</label>
                                                <select
                                                    className="input-field"
                                                    value={selectedExamId}
                                                    onChange={e => setSelectedExamId(e.target.value)}
                                                    disabled={!mainSelectedTitle}
                                                    style={{ height: '42px' }}
                                                >
                                                    <option value="">회차를 선택하세요</option>
                                                    {finalCandidates.length === 0 && mainSelectedTitle && <option disabled>표시할 회차가 없습니다.</option>}
                                                    {finalCandidates.map((ex: any) => (
                                                        <option key={ex.id} value={ex.id}>
                                                            {ex.round ? ex.round : '기본 회차'}
                                                            {ex.questionsCount ? ` (${ex.questionsCount}문제)` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Row 2: Action Buttons */}
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px dashed var(--slate-200)' }}>
                                    <button onClick={handleCreateExam} className="btn btn-secondary" title="새 차시 추가">
                                        <Plus size={16} style={{ marginRight: '6px' }} /> 차시 추가
                                    </button>
                                    {selectedExamId && (
                                        <>
                                            <div style={{ width: '1px', background: 'var(--slate-300)', margin: '0 0.5rem' }}></div>
                                            <button
                                                onClick={openExamEditModal}
                                                className="btn btn-secondary"
                                                title="시험지 정보 수정 (제목, 회차, 과목 등)"
                                                style={{ color: 'var(--slate-600)' }}
                                            >
                                                <Edit2 size={16} style={{ marginRight: '6px' }} /> 정보 수정
                                            </button>
                                            <button
                                                onClick={() => openMoveModal(selectedExamId)}
                                                className="btn btn-secondary"
                                                title="분류 이동"
                                                style={{ color: 'var(--primary-600)' }}
                                            >
                                                <FileUp size={16} style={{ marginRight: '6px' }} /> 분류 이동
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/exam/${selectedExamId}/print`)}
                                                className="btn btn-secondary"
                                                title="시험지 인쇄"
                                                style={{ color: '#10b981', background: '#dcfce7', borderColor: '#bbf7d0' }}
                                            >
                                                <Printer size={16} /> 인쇄
                                            </button>
                                            <button
                                                onClick={handleDeleteExam}
                                                className="btn btn-danger"
                                                title="시험지 삭제"
                                                style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}
                                            >
                                                <Trash2 size={16} /> 삭제
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Stats Preview */}
                            <div style={{ alignSelf: 'flex-end', paddingBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--slate-600)' }}>
                                {selectedExamId ? (
                                    <span>총 <strong style={{ color: 'var(--primary-600)' }}>{questions.length}</strong> 문항 등록됨</span>
                                ) : (
                                    <span>대상을 선택해주세요</span>
                                )}
                            </div>
                        </section>

                        {/* Question Management Action Bar (Only visible if exam selected) */}
                        {selectedExamId && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={questions.length > 0 && selectedQuestionIds.length === questions.length}
                                            onChange={toggleAllQuestions}
                                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                                            title="전체 선택"
                                        />
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>문제 목록</h3>
                                        <span style={{ fontSize: '0.8rem', background: 'var(--slate-100)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--slate-500)' }}>
                                            {selectedCourse} &gt; {exams.find(e => e.id === selectedExamId)?.title}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        {/* Batch Actions Button Group */}
                                        {selectedQuestionIds.length > 0 && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => {
                                                        setBatchCategoryTarget(categories.length > 0 ? categories[0] : '');
                                                        setIsBatchCategoryModalOpen(true);
                                                    }}
                                                    className="btn btn-primary"
                                                    style={{
                                                        background: '#3b82f6',
                                                        borderColor: '#2563eb',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        padding: '0.5rem 0.8rem',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    <Settings size={16} /> 선택 유형 변경
                                                </button>
                                                <button
                                                    onClick={openBatchMoveModal}
                                                    className="btn btn-primary"
                                                    style={{
                                                        background: '#f59e0b',
                                                        borderColor: '#d97706',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        padding: '0.5rem 0.8rem',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    <FileUp size={16} /> {selectedQuestionIds.length}개 시험지 이동
                                                </button>
                                            </div>
                                        )}
                                        {/* ⭐️ AI Setting Button */}
                                        <button
                                            onClick={() => setShowApiKeyModal(true)}
                                            className="btn btn-secondary"
                                            style={{
                                                border: apiKey ? '1px solid #10b981' : '1px solid #e2e8f0',
                                                color: apiKey ? '#059669' : '#64748b'
                                            }}
                                            title="OpenAI API Key 설정 (스마트 파싱)"
                                        >
                                            <KeyIcon size={16} /> {apiKey ? 'AI 준비됨' : 'AI 키 설정'}
                                        </button>

                                        <label className={`btn btn-secondary ${isAiProcessing ? 'loading' : ''}`} style={{ cursor: isAiProcessing ? 'wait' : 'pointer', background: apiKey ? '#7c3aed' : '#be123c', color: 'white', border: 'none' }} title={apiKey ? "AI가 PDF를 스마트하게 분석합니다" : "기본 텍스트 추출 (AI 설정 시 더 정확함)"}>
                                            {apiKey ? <BrainCircuit size={16} /> : <FileText size={16} />}
                                            {isAiProcessing ? 'AI 분석 중...' : (apiKey ? 'AI PDF 업로드' : 'PDF 업로드')}
                                            <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handlePdfUpload} disabled={isAiProcessing} />
                                        </label>
                                        <label className="btn btn-secondary" style={{ cursor: 'pointer', background: '#047857', color: 'white', border: 'none' }} title="엑셀 파일로 일괄 등록합니다">
                                            <FileUp size={16} /> 엑셀 업로드
                                            <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleExcelUpload} />
                                        </label>
                                        <button
                                            onClick={() => {
                                                setIsFormOpen(true);
                                                setEditingId(null);
                                                setNewQuestion({ category: categories.length > 0 ? categories[0] : '기타', options: ['', '', '', ''], correctAnswer: 0 });
                                            }}
                                            className="btn btn-primary"
                                        >
                                            <Plus size={16} /> 개별 문제 추가
                                        </button>
                                    </div>
                                </div>

                                {/* Form Area */}
                                {isFormOpen && (
                                    <div className="glass-card" style={{ padding: '2rem', background: 'white', marginBottom: '2rem', border: '2px solid var(--primary-100)' }}>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>
                                            {editingId ? '문제 수정' : `새 문제 등록 (No. ${questions.length + 1})`}
                                        </h3>

                                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                                                <div>
                                                    <label className="input-label">문제 유형(카테고리)</label>
                                                    <select
                                                        className="input-field"
                                                        value={newQuestion.category}
                                                        onChange={e => setNewQuestion({ ...newQuestion, category: e.target.value })}
                                                    >
                                                        {/* ⭐️ 현재 값이 목록에 없으면(예: AI 추출) 임시로 보여줌 -> 사용자가 변경하도록 유도 */}
                                                        {newQuestion.category && !categories.includes(newQuestion.category) && (
                                                            <option value={newQuestion.category} disabled>
                                                                {newQuestion.category === 'AI_Extracted' ? 'AI 추출' : newQuestion.category} (현재 설정)
                                                            </option>
                                                        )}
                                                        {categories.map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCategoryModalOpen(true)}
                                                    className="btn btn-secondary"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        whiteSpace: 'nowrap',
                                                        height: 'fit-content'
                                                    }}
                                                    title="카테고리 관리"
                                                >
                                                    <Settings size={16} /> 카테고리 관리
                                                </button>
                                            </div>

                                            <div>
                                                <label className="input-label">문제 지문</label>
                                                <textarea
                                                    className="input-field"
                                                    rows={3}
                                                    placeholder="문제를 입력하세요..."
                                                    value={newQuestion.text || ''}
                                                    onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                                />
                                            </div>

                                            {/* Image and Options... (Same interface as before) */}
                                            <div>
                                                <label className="input-label">문제 이미지</label>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <ImageIcon size={16} />
                                                            이미지 선택
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                style={{ display: 'none' }}
                                                                onChange={handleImageUpload}
                                                            />
                                                        </label>
                                                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                            💡 캡처 후 <strong>Ctrl+V</strong>로 붙여넣기 가능
                                                        </span>
                                                        {(newQuestion.imageUrl && newQuestion.imageUrl !== null && newQuestion.imageUrl !== '') && (
                                                            <button
                                                                onClick={() => {
                                                                    console.log('이미지 삭제 전:', newQuestion.imageUrl);
                                                                    setNewQuestion({ ...newQuestion, imageUrl: null });
                                                                    console.log('이미지 삭제 후:', null);
                                                                    alert('이미지가 삭제되었습니다. 저장 버튼을 클릭하여 변경사항을 저장하세요.');
                                                                }}
                                                                className="btn btn-secondary"
                                                                style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                                            >
                                                                삭제
                                                            </button>
                                                        )}
                                                    </div>

                                                    {(newQuestion.imageUrl && newQuestion.imageUrl !== null && newQuestion.imageUrl !== '') && (
                                                        <div style={{ marginTop: '0.5rem', border: '1px solid var(--slate-200)', borderRadius: '0.5rem', padding: '0.5rem', width: 'fit-content' }}>
                                                            <img
                                                                src={newQuestion.imageUrl}
                                                                alt="Question Preview"
                                                                style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'contain' }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <label className="input-label" style={{ marginBottom: 0 }}>보기 및 정답 설정</label>
                                                    <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
                                                        <button
                                                            className={`btn`}
                                                            style={{
                                                                padding: '0.25rem 0.75rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
                                                                background: newQuestion.options && newQuestion.options.length > 0 ? 'white' : 'transparent',
                                                                color: newQuestion.options && newQuestion.options.length > 0 ? 'var(--primary-600)' : '#64748b',
                                                                boxShadow: newQuestion.options && newQuestion.options.length > 0 ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                                            }}
                                                            onClick={() => setNewQuestion({ ...newQuestion, options: ['', '', '', ''], correctAnswer: 0, optionImages: [] })}
                                                        >
                                                            객관식
                                                        </button>
                                                        <button
                                                            className={`btn`}
                                                            style={{
                                                                padding: '0.25rem 0.75rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
                                                                background: (!newQuestion.options || newQuestion.options.length === 0) ? 'white' : 'transparent',
                                                                color: (!newQuestion.options || newQuestion.options.length === 0) ? 'var(--primary-600)' : '#64748b',
                                                                boxShadow: (!newQuestion.options || newQuestion.options.length === 0) ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                                            }}
                                                            onClick={() => setNewQuestion({ ...newQuestion, options: [], correctAnswer: '' })}
                                                        >
                                                            주관식
                                                        </button>
                                                    </div>
                                                </div>

                                                {newQuestion.options && newQuestion.options.length > 0 ? (
                                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                                        {newQuestion.options.map((opt: string, idx: number) => {
                                                            const optionImage = newQuestion.optionImages?.[idx];
                                                            return (
                                                                <div key={idx} style={{
                                                                    border: '1px solid #e2e8f0',
                                                                    borderRadius: '0.5rem',
                                                                    padding: '0.75rem',
                                                                    background: '#f8fafc'
                                                                }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                        <input
                                                                            type="radio"
                                                                            name="correctAnswer"
                                                                            checked={newQuestion.correctAnswer === idx}
                                                                            onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: idx })}
                                                                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', accentColor: 'var(--primary-600)' }}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            className="input-field"
                                                                            placeholder={`보기 ${idx + 1}`}
                                                                            value={opt}
                                                                            onChange={e => handleOptionChange(idx, e.target.value)}
                                                                            onPaste={e => handleOptionPaste(idx, e)}
                                                                            style={{ flex: 1 }}
                                                                        />
                                                                        <label style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.25rem',
                                                                            padding: '0.5rem 0.75rem',
                                                                            background: '#6366f1',
                                                                            color: 'white',
                                                                            borderRadius: '0.375rem',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.875rem',
                                                                            fontWeight: 500
                                                                        }}>
                                                                            <ImageIcon size={16} />
                                                                            이미지
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                onChange={(e) => handleOptionImageUpload(idx, e)}
                                                                                style={{ display: 'none' }}
                                                                                id={`option-image-${idx}`}
                                                                            />
                                                                        </label>
                                                                        {optionImage && (
                                                                            <button
                                                                                onClick={() => handleOptionImageDelete(idx)}
                                                                                type="button" // Prevent form submission
                                                                                style={{
                                                                                    padding: '0.5rem 0.75rem',
                                                                                    background: '#ef4444',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    borderRadius: '0.375rem',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '0.875rem',
                                                                                    fontWeight: 500
                                                                                }}
                                                                            >
                                                                                삭제
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {optionImage && (typeof optionImage === 'string') && (optionImage.startsWith('http') || optionImage.startsWith('data:')) && (
                                                                        <div style={{
                                                                            marginTop: '0.5rem',
                                                                            border: '1px solid var(--slate-200)',
                                                                            borderRadius: '0.5rem',
                                                                            padding: '0.5rem',
                                                                            background: 'white',
                                                                            display: 'inline-block'
                                                                        }}>
                                                                            <img
                                                                                src={optionImage}
                                                                                alt={`Option ${idx + 1} Preview`}
                                                                                style={{ maxWidth: '100px', maxHeight: '80px', objectFit: 'contain' }}
                                                                                onError={(e) => {
                                                                                    // Fallback if image load fails
                                                                                    e.currentTarget.style.display = 'none';
                                                                                    e.currentTarget.parentElement!.style.display = 'none';
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <div style={{
                                                                        fontSize: '0.75rem',
                                                                        color: '#64748b',
                                                                        marginTop: '0.25rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.25rem'
                                                                    }}>
                                                                        <span>💡</span>
                                                                        <span>캡처 후 Ctrl+V로 붙여넣기 가능</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                                            정답 텍스트를 입력하세요. (대소문자/공백은 자동 처리됨)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="input-field"
                                                            placeholder="예: 3D프린터"
                                                            value={newQuestion.correctAnswer as string || ''}
                                                            onChange={e => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                                                            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '2px solid var(--primary-200)', background: '#f8fafc' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="input-label">해설 (이미지 삽입 가능)</label>
                                                <div style={{ height: '250px', marginBottom: '1rem' }}>
                                                    <ReactQuill
                                                        theme="snow"
                                                        value={newQuestion.explanation || ''}
                                                        onChange={(content) => setNewQuestion({ ...newQuestion, explanation: content })}
                                                        style={{ height: '200px' }}
                                                        modules={{
                                                            toolbar: {
                                                                container: [
                                                                    [{ 'header': [1, 2, false] }],
                                                                    ['bold', 'italic', 'underline', 'strike'],
                                                                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                                    ['link', 'image'],
                                                                    ['clean']
                                                                ],
                                                                handlers: {
                                                                    image: function (this: any) {
                                                                        const quill = this.quill;
                                                                        const input = document.createElement('input');
                                                                        input.setAttribute('type', 'file');
                                                                        input.setAttribute('accept', 'image/*');
                                                                        input.click();

                                                                        input.onchange = async () => {
                                                                            const file = input.files?.[0];
                                                                            if (file) {
                                                                                try {
                                                                                    const compressedDataUrl = await compressImage(file);
                                                                                    const range = quill.getSelection(true);
                                                                                    quill.insertEmbed(range.index, 'image', compressedDataUrl);
                                                                                    quill.setSelection(range.index + 1);
                                                                                } catch (error) {
                                                                                    console.error('Image upload failed:', error);
                                                                                    alert('이미지 업로드 중 오류가 발생했습니다.');
                                                                                }
                                                                            }
                                                                        };
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                        placeholder="해설을 입력하세요. 이미지도 삽입할 수 있습니다."
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                                <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }}>
                                                    {editingId ? '수정 완료' : '이 시험지에 등록'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsFormOpen(false);
                                                        setEditingId(null);
                                                        setNewQuestion({ category: categories.length > 0 ? categories[0] : '기타', options: ['', '', '', ''], correctAnswer: 0 });
                                                    }}
                                                    className="btn btn-secondary"
                                                    style={{ flex: 1 }}
                                                >
                                                    취소
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Question List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {questions.length === 0 ? (
                                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-400)', border: '2px dashed var(--slate-200)', borderRadius: '0.75rem' }}>
                                            등록된 문제가 없습니다. <br />
                                            PDF나 엑셀 파일을 업로드하거나 개별 문제를 추가해주세요.
                                        </div>
                                    ) : (
                                        <>
                                            {(() => {
                                                const indexOfLastItem = currentPage * itemsPerPage;
                                                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                                                const currentQuestions = questions.slice(indexOfFirstItem, indexOfLastItem);

                                                if (currentQuestions.length === 0 && questions.length > 0) {
                                                    // Safety fallback if page is out of bounds
                                                    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-500)' }}>페이지를 조정 중입니다...</div>;
                                                }

                                                return currentQuestions.map((q, idx) => {
                                                    const displayIndex = indexOfFirstItem + idx;
                                                    return (
                                                        <div key={q.id} className="glass-card" style={{
                                                            padding: '1.5rem',
                                                            background: 'white',
                                                            display: 'flex',
                                                            gap: '1rem',
                                                            borderLeft: '4px solid var(--primary-500)',
                                                            width: '100%',
                                                            maxWidth: '100%',
                                                            boxSizing: 'border-box',
                                                            overflow: 'visible'
                                                        }}>
                                                            {/* ⭐️ Number Badge */}
                                                            <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '0.2rem', marginRight: '0.8rem' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedQuestionIds.includes(q.id)}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleQuestionSelection(q.id);
                                                                    }}
                                                                    style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                                                                />
                                                            </div>
                                                            <div style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'flex-start',
                                                                minWidth: '2.5rem',
                                                                paddingTop: '0.2rem'
                                                            }}>
                                                                <span style={{
                                                                    fontSize: '1.5rem',
                                                                    fontWeight: 800,
                                                                    color: 'var(--slate-300)',
                                                                    lineHeight: 1,
                                                                    fontFamily: 'monospace'
                                                                }}>
                                                                    {(displayIndex + 1).toString().padStart(2, '0')}
                                                                </span>
                                                            </div>

                                                            <div style={{
                                                                flex: 1,
                                                                minWidth: 0,
                                                                width: '100%',
                                                                maxWidth: '100%',
                                                                boxSizing: 'border-box',
                                                                overflow: 'visible'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                                                    <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--slate-100)', color: 'var(--slate-600)', fontWeight: 600 }}>
                                                                        {q.category === 'AI_Extracted' ? 'AI 추출' : (q.category === 'PDF_Imported' ? 'PDF 추출' : q.category)}
                                                                    </span>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            selectQuestionsByCategory(q.category);
                                                                        }}
                                                                        className="hover:text-primary-600"
                                                                        style={{
                                                                            fontSize: '0.7rem',
                                                                            padding: '0.1rem 0.3rem',
                                                                            borderRadius: '3px',
                                                                            border: '1px solid var(--slate-200)',
                                                                            background: 'white',
                                                                            color: 'var(--slate-500)',
                                                                            cursor: 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '2px'
                                                                        }}
                                                                        title="이 카테고리 전체 선택"
                                                                    >
                                                                        <CheckCircle size={10} /> 전체선택
                                                                    </button>
                                                                </div>
                                                                <h4 style={{
                                                                    fontWeight: 600,
                                                                    marginBottom: '0.5rem',
                                                                    fontSize: '1.05rem',
                                                                    whiteSpace: 'pre-wrap',
                                                                    wordWrap: 'break-word',
                                                                    wordBreak: 'break-word',
                                                                    overflowWrap: 'break-word',
                                                                    width: '100%',
                                                                    maxWidth: '100%',
                                                                    boxSizing: 'border-box'
                                                                }}>{q.text}</h4>

                                                                {q.imageUrl && (
                                                                    <div style={{ marginBottom: '1rem' }}>
                                                                        <img src={q.imageUrl} alt="Question" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} />
                                                                    </div>
                                                                )}

                                                                {/* Show Options Preview */}
                                                                <div style={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: '1fr 1fr',
                                                                    gap: '0.5rem',
                                                                    fontSize: '0.9rem',
                                                                    color: 'var(--slate-600)',
                                                                    marginTop: '0.5rem',
                                                                    width: '100%',
                                                                    maxWidth: '100%',
                                                                    boxSizing: 'border-box'
                                                                }}>
                                                                    {q.options.map((opt, i) => {
                                                                        const optImg = q.optionImages?.[i];
                                                                        return (
                                                                            <div key={i} style={{
                                                                                color: q.correctAnswer === i ? '#059669' : 'inherit',
                                                                                fontWeight: q.correctAnswer === i ? 600 : 400,
                                                                                wordWrap: 'break-word',
                                                                                wordBreak: 'break-word',
                                                                                overflowWrap: 'break-word',
                                                                                whiteSpace: 'pre-wrap',
                                                                                minWidth: 0,
                                                                                width: '100%',
                                                                                maxWidth: '100%',
                                                                                boxSizing: 'border-box'
                                                                            }}>
                                                                                {i + 1}. {opt}
                                                                                {optImg && (
                                                                                    <div style={{ marginTop: '4px' }}>
                                                                                        <img src={optImg} alt={`Option ${i + 1}`} style={{ maxWidth: '100px', maxHeight: '80px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {q.explanation && (
                                                                    <div style={{
                                                                        marginTop: '0.75rem',
                                                                        padding: '0.75rem',
                                                                        background: '#f8fafc',
                                                                        borderRadius: '0.5rem',
                                                                        fontSize: '0.85rem',
                                                                        color: '#64748b',
                                                                        wordWrap: 'break-word',
                                                                        wordBreak: 'break-word',
                                                                        overflowWrap: 'break-word',
                                                                        lineHeight: '1.6',
                                                                        width: '100%',
                                                                        maxWidth: '100%',
                                                                        boxSizing: 'border-box'
                                                                    }}>
                                                                        <strong>[해설]</strong>
                                                                        <div
                                                                            style={{
                                                                                marginTop: '0.5rem',
                                                                                wordWrap: 'break-word',
                                                                                wordBreak: 'break-word',
                                                                                overflowWrap: 'break-word'
                                                                            }}
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: DOMPurify.sanitize(q.explanation, {
                                                                                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'img', 'a', 'h1', 'h2', 'h3'],
                                                                                    ALLOWED_ATTR: ['src', 'alt', 'href', 'target', 'style']
                                                                                })
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                <button onClick={() => handleGenerateSimilar(q)} className="btn btn-secondary" style={{ height: 'fit-content', padding: '0.5rem', color: '#7c3aed' }} title="AI 유사 문제 생성">
                                                                    <Sparkles size={18} />
                                                                </button>
                                                                <button onClick={() => handleEditQuestion(q)} className="btn btn-secondary" style={{ height: 'fit-content', padding: '0.5rem', color: 'var(--primary-600)' }} title="문제 수정">
                                                                    <Edit2 size={18} />
                                                                </button>
                                                                <button onClick={() => handleDelete(q.id)} className="btn btn-secondary" style={{ height: 'fit-content', padding: '0.5rem', color: '#ef4444' }} title="문제 삭제">
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}

                                            {/* ⭐️ Pagination Controls */}
                                            {questions.length > itemsPerPage && (
                                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                        disabled={currentPage === 1}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.5rem', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'default' : 'pointer' }}
                                                    >
                                                        <ChevronLeft size={20} />
                                                    </button>

                                                    {(() => {
                                                        const totalPages = Math.ceil(questions.length / itemsPerPage);
                                                        // Limit visible pages if too many
                                                        const maxVisiblePages = 5;
                                                        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                                                        let endPage = startPage + maxVisiblePages - 1;

                                                        if (endPage > totalPages) {
                                                            endPage = totalPages;
                                                            startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                                        }

                                                        const pages = [];
                                                        for (let i = startPage; i <= endPage; i++) {
                                                            pages.push(i);
                                                        }

                                                        return pages.map(number => (
                                                            <button
                                                                key={number}
                                                                onClick={() => setCurrentPage(number)}
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '0.5rem',
                                                                    border: currentPage === number ? 'none' : '1px solid var(--slate-200)',
                                                                    background: currentPage === number ? 'var(--primary-600)' : 'white',
                                                                    color: currentPage === number ? 'white' : 'var(--slate-600)',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                {number}
                                                            </button>
                                                        ));
                                                    })()}

                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(questions.length / itemsPerPage), prev + 1))}
                                                        disabled={currentPage === Math.ceil(questions.length / itemsPerPage)}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.5rem', opacity: currentPage === Math.ceil(questions.length / itemsPerPage) ? 0.5 : 1, cursor: currentPage === Math.ceil(questions.length / itemsPerPage) ? 'default' : 'pointer' }}
                                                    >
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )
                }

            </main >

            {/* Category Management Modal */}
            {
                isCategoryModalOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}
                        onClick={() => {
                            // Prevent accidental close when dragging
                        }}
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) {
                                setIsCategoryModalOpen(false);
                                cancelEditCategory();
                            }
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'white',
                                borderRadius: '1rem',
                                padding: '2rem',
                                maxWidth: '600px',
                                width: '100%',
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                                maxHeight: '80vh',
                                overflow: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                                        카테고리 관리
                                    </h3>
                                    {/* ⭐️ 현재 과정 표시 */}
                                    {selectedCourse && (
                                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                                            📚 {selectedCourse}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setIsCategoryModalOpen(false);
                                        cancelEditCategory();
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '1.5rem',
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        padding: '0.25rem'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Add/Edit Form */}
                            <div style={{
                                marginBottom: '1.5rem',
                                padding: '1.5rem',
                                background: '#f8fafc',
                                borderRadius: '0.75rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>
                                    {editingCategory ? '카테고리 수정' : '새 카테고리 추가'}
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="카테고리 이름 입력..."
                                        value={categoryInput}
                                        onChange={(e) => setCategoryInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                editingCategory ? handleUpdateCategory() : handleAddCategory();
                                            }
                                        }}
                                        style={{ flex: 1 }}
                                    />
                                    {editingCategory ? (
                                        <>
                                            <button
                                                onClick={handleUpdateCategory}
                                                className="btn btn-primary"
                                                style={{ whiteSpace: 'nowrap' }}
                                            >
                                                <Edit2 size={16} /> 수정
                                            </button>
                                            <button
                                                onClick={cancelEditCategory}
                                                className="btn btn-secondary"
                                            >
                                                취소
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleAddCategory}
                                            className="btn btn-primary"
                                            style={{ whiteSpace: 'nowrap' }}
                                        >
                                            <Plus size={16} /> 추가
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Category List */}
                            <div>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#334155' }}>
                                    등록된 카테고리 ({categories.length}개)
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {categories.map((category) => (
                                        <div
                                            key={category}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.875rem 1rem',
                                                background: editingCategory === category ? '#eff6ff' : 'white',
                                                border: `1px solid ${editingCategory === category ? '#60a5fa' : '#e2e8f0'}`,
                                                borderRadius: '0.5rem',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <span style={{
                                                fontWeight: 500,
                                                color: '#1e293b',
                                                flex: 1
                                            }}>
                                                {category}
                                            </span>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => startEditCategory(category)}
                                                    className="btn btn-secondary"
                                                    style={{
                                                        padding: '0.4rem 0.75rem',
                                                        fontSize: '0.875rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}
                                                    title="수정"
                                                >
                                                    <Edit2 size={14} /> 수정
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(category)}
                                                    className="btn btn-secondary"
                                                    style={{
                                                        padding: '0.4rem 0.75rem',
                                                        fontSize: '0.875rem',
                                                        color: '#ef4444',
                                                        borderColor: '#fee2e2',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}
                                                    title="삭제"
                                                >
                                                    <Trash2 size={14} /> 삭제
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                background: '#fef3c7',
                                border: '1px solid #fcd34d',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                color: '#92400e'
                            }}>
                                <strong>💡 안내:</strong> 카테고리를 삭제해도 이미 등록된 문제의 카테고리 정보는 유지됩니다.
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ⭐️ Exam Creation Modal */}
            {
                isExamModalOpen && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '1rem'
                        }}
                        onClick={() => {
                            // Prevent accidental close when dragging
                        }}
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) {
                                setIsExamModalOpen(false);
                                setNewExamData({ title: '', timeLimit: 60, subjectName: '', topic: '', courseName: '', round: '' });
                            }
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'white',
                                borderRadius: '1rem',
                                padding: '2rem',
                                maxWidth: '500px',
                                width: '100%',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                                    ✨ 새 시험지 생성
                                </h3>
                                <button
                                    onClick={() => {
                                        setIsExamModalOpen(false);
                                        setNewExamData({ title: '', timeLimit: 60, subjectName: '', topic: '', courseName: '', round: '' });
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '1.5rem',
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        padding: '0.25rem'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                                    대분류 (과정)
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        list="course-options"
                                        type="text"
                                        value={newExamData.courseName}
                                        onChange={(e) => setNewExamData({ ...newExamData, courseName: e.target.value })}
                                        placeholder="과정 선택 또는 새 과정 입력"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '0.5rem',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            background: '#f8fafc'
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = '#667eea'; e.target.style.background = 'white'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                                    />
                                    <datalist id="course-options">
                                        {fullCourses.map(c => (
                                            <option key={c.id} value={c.name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                                    중분류 (과목/모듈) - 선택사항
                                </label>
                                <input
                                    list="subject-options"
                                    type="text"
                                    value={newExamData.subjectName || ''}
                                    onChange={(e) => setNewExamData({ ...newExamData, subjectName: e.target.value })}
                                    placeholder="선택하거나 직접 입력 (비워두기 가능)"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        fontSize: '1rem',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = '#667eea'; }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e2e8f0';
                                    }}
                                />
                                <datalist id="subject-options">
                                    {subjects.map(sub => (
                                        <option key={sub.id} value={sub.name} />
                                    ))}
                                </datalist>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                                    * 선택 사항: 비워두면 대분류(과정)에 바로 포함됩니다.
                                </p>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                                    시험지 제목 *
                                </label>
                                <input
                                    type="text"
                                    value={newExamData.title}
                                    onChange={(e) => setNewExamData({ ...newExamData, title: e.target.value })}
                                    placeholder="예: 2024년 1회차 정기시험"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        fontSize: '1rem',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                                    소분류 (Topic)
                                </label>
                                <input
                                    type="text"
                                    value={newExamData.topic || ''}
                                    onChange={(e) => setNewExamData({ ...newExamData, topic: e.target.value })}
                                    placeholder="예: 집합과 명제 (선택사항)"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        fontSize: '1rem',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                                    차시 (회차)
                                </label>
                                <input
                                    type="text"
                                    value={newExamData.round || ''}
                                    onChange={(e) => setNewExamData({ ...newExamData, round: e.target.value })}
                                    placeholder="예: 1차시, 2024-1"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        fontSize: '1rem',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>
                                    제한 시간 (분)
                                </label>
                                <input
                                    type="number"
                                    value={newExamData.timeLimit}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        setNewExamData({ ...newExamData, timeLimit: parseInt(e.target.value) || 60 });
                                    }}
                                    min="1"
                                    max="240"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        opacity: newExamData.timeLimit === 0 ? 0.5 : 1
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    disabled={newExamData.timeLimit === 0}
                                />
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginTop: '0.75rem',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    color: '#64748b'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={newExamData.timeLimit === 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setNewExamData({ ...newExamData, timeLimit: 0 });
                                            } else {
                                                setNewExamData({ ...newExamData, timeLimit: 60 });
                                            }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    제한시간 설정 없음
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => {
                                        setIsExamModalOpen(false);
                                        setNewExamData({ title: '', timeLimit: 60, subjectName: '', topic: '', courseName: '', round: '' });
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.875rem',
                                        background: '#e2e8f0',
                                        color: '#475569',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '1rem'
                                    }}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSaveNewExam}
                                    style={{
                                        flex: 1,
                                        padding: '0.875rem',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '1rem'
                                    }}
                                >
                                    생성하기
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ⭐️ API Key Setting Modal */}
            {
                showApiKeyModal && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1100,
                            padding: '1rem'
                        }}
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) setShowApiKeyModal(false);
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'white',
                                borderRadius: '1rem',
                                padding: '2rem',
                                maxWidth: '500px',
                                width: '100%',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                            }}
                        >
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <BrainCircuit color="#7c3aed" /> OpenAI API 설정
                                </h3>
                                <p style={{ marginTop: '0.5rem', color: '#64748b', lineHeight: 1.5 }}>
                                    PDF 파싱의 정확도를 높이기 위해 OpenAI API Key를 설정합니다.<br />
                                    키는 브라우저 내부에만 안전하게 저장됩니다.
                                </p>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="input-label" style={{ fontWeight: 600 }}>API Key</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-..."
                                />
                                <a
                                    href="https://platform.openai.com/api-keys"
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none' }}
                                >
                                    API Key 발급받기 &rarr;
                                </a>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button
                                    onClick={() => {
                                        setApiKey('');
                                        localStorage.removeItem('openai_api_key');
                                        setShowApiKeyModal(false);
                                    }}
                                    className="btn btn-secondary"
                                    style={{ color: '#ef4444', borderColor: '#fee2e2' }}
                                >
                                    키 삭제
                                </button>
                                <button
                                    onClick={() => {
                                        if (!apiKey.startsWith('sk-')) {
                                            alert('유효한 API Key를 입력해주세요.');
                                            return;
                                        }
                                        localStorage.setItem('openai_api_key', apiKey);
                                        setShowApiKeyModal(false);
                                        alert('API Key가 저장되었습니다. 이제 [AI PDF 업로드]를 이용할 수 있습니다.');
                                    }}
                                    className="btn btn-primary"
                                    style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
                                >
                                    저장 및 닫기
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ⭐️ AI 유사 문제 생성 모달 */}
            {
                showSimilarModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, padding: '1rem'
                    }}
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) setShowSimilarModal(false);
                        }}
                    >
                        <div style={{
                            background: 'white', borderRadius: '1rem', padding: '2rem',
                            maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Sparkles size={20} color="white" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>AI 유사 문제 생성</h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>원본 문제를 바탕으로 새로운 문제를 생성합니다</p>
                                    </div>
                                </div>
                                <button onClick={() => { setShowSimilarModal(false); setGeneratedQuestions([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                                    <X size={24} color="#94a3b8" />
                                </button>
                            </div>

                            {/* 원본 문제 */}
                            {generatingForQuestion && (
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>📌 원본 문제</div>
                                    <div style={{ fontWeight: 600, color: '#334155' }}>{generatingForQuestion.text}</div>
                                </div>
                            )}

                            {/* 로딩 */}
                            {isAiProcessing && (
                                <div style={{ textAlign: 'center', padding: '3rem' }}>
                                    <div style={{
                                        width: '50px', height: '50px', border: '4px solid #e2e8f0',
                                        borderTopColor: '#7c3aed', borderRadius: '50%',
                                        animation: 'spin 1s linear infinite', margin: '0 auto 1rem'
                                    }} />
                                    <p style={{ color: '#64748b' }}>AI가 유사 문제를 생성하고 있습니다...</p>
                                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                </div>
                            )}

                            {/* 생성된 문제 목록 */}
                            {!isAiProcessing && generatedQuestions.length > 0 && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <span style={{ fontWeight: 600, color: '#334155' }}>✨ 생성된 문제 ({generatedQuestions.length}개)</span>
                                        <button
                                            onClick={handleAddAllGeneratedQuestions}
                                            className="btn btn-primary"
                                            style={{ background: '#7c3aed', borderColor: '#7c3aed', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <CheckCircle size={16} /> 모두 추가
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {generatedQuestions.map((genQ, idx) => (
                                            <div key={idx} style={{
                                                background: 'white', padding: '1.25rem', borderRadius: '0.75rem',
                                                border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#1e293b' }}>
                                                            {idx + 1}. {genQ.text}
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                            {genQ.options.map((opt: string, optIdx: number) => (
                                                                <div key={optIdx} style={{
                                                                    padding: '0.5rem 0.75rem',
                                                                    borderRadius: '0.5rem',
                                                                    fontSize: '0.9rem',
                                                                    background: genQ.correctAnswer === optIdx ? '#dcfce7' : '#f8fafc',
                                                                    border: genQ.correctAnswer === optIdx ? '1px solid #16a34a' : '1px solid #e2e8f0',
                                                                    color: genQ.correctAnswer === optIdx ? '#16a34a' : '#475569',
                                                                    fontWeight: genQ.correctAnswer === optIdx ? 600 : 400
                                                                }}>
                                                                    {optIdx + 1}. {opt} {genQ.correctAnswer === optIdx && '✓'}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {genQ.explanation && (
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
                                                                💡 {genQ.explanation}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddGeneratedQuestion(genQ, idx)}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap', color: '#16a34a' }}
                                                    >
                                                        <Plus size={16} /> 추가
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* 모든 문제 추가 완료 */}
                            {!isAiProcessing && generatedQuestions.length === 0 && generatingForQuestion && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                    모든 문제가 추가되었습니다! 👍
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* ⭐️ Course Description Edit Modal */}
            {
                showCourseEditModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, padding: '1rem'
                    }}
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) setShowCourseEditModal(false);
                        }}
                    >
                        <div style={{
                            background: 'white', borderRadius: '1rem', padding: '2rem',
                            maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>과정 소개 편집 ({selectedCourse})</h3>
                                <button onClick={() => setShowCourseEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                                    <X size={24} color="#94a3b8" />
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div>
                                    <label className="input-label">과정 설명 (Rich Text Editor)</label>
                                    <div style={{ height: '300px', marginBottom: '3rem' }}>
                                        <ReactQuill
                                            theme="snow"
                                            value={editCourseDetails.description}
                                            onChange={(content) => setEditCourseDetails({ ...editCourseDetails, description: content })}
                                            style={{ height: '250px' }}
                                            modules={{
                                                toolbar: [
                                                    [{ 'header': [1, 2, false] }],
                                                    ['bold', 'italic', 'underline', 'strike'],
                                                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                    ['link', 'image'],
                                                    ['clean']
                                                ],
                                            }}
                                            placeholder="과정에 대한 설명을 입력하세요. 이미지도 삽입할 수 있습니다."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="input-label">학습 대상 (Targets) - 콤마(,)로 구분</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={editCourseDetails.targets}
                                        onChange={e => setEditCourseDetails({ ...editCourseDetails, targets: e.target.value })}
                                        placeholder="예: 취업 준비생, 실무자, 초보자"
                                        style={{ width: '100%', padding: '0.75rem' }}
                                    />
                                </div>

                                <div>
                                    <label className="input-label">주요 특징 (Features) - 콤마(,)로 구분</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={editCourseDetails.features}
                                        onChange={e => setEditCourseDetails({ ...editCourseDetails, features: e.target.value })}
                                        placeholder="예: 실전 모의고사, AI 분석, 무제한 응시"
                                        style={{ width: '100%', padding: '0.75rem' }}
                                    />
                                </div>

                                <div>
                                    <label className="input-label">이용 방법 (How To Use) - 줄바꿈으로 구분</label>
                                    <textarea
                                        className="input-field"
                                        rows={5}
                                        value={editCourseDetails.howToUse}
                                        onChange={e => setEditCourseDetails({ ...editCourseDetails, howToUse: e.target.value })}
                                        placeholder="1. 회원가입 후 신청&#13;&#10;2. 승인 대기&#13;&#10;3. 학습 시작"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '1rem' }}>
                                <button className="btn btn-secondary" onClick={() => setShowCourseEditModal(false)}>취소</button>
                                <button className="btn btn-primary" onClick={handleSaveCourseDetails} style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}>
                                    저장하기
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ⭐️ Subject Management Modal */}
            {
                showSubjectModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
                    }}>
                        <div className="glass-card" style={{ background: 'white', padding: '2rem', width: '500px', maxWidth: '95%', maxHeight: '80vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>분류(과목) 관리 - {selectedCourse}</h3>
                                <button onClick={() => setShowSubjectModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                                    <X size={24} color="#64748b" />
                                </button>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        className="input-field"
                                        placeholder="새 분류 이름 입력"
                                        value={subjectInputName}
                                        onChange={e => setSubjectInputName(e.target.value)}
                                    />
                                    {editingSubject ? (
                                        <>
                                            <button onClick={handleUpdateSubject} className="btn btn-primary">수정</button>
                                            <button onClick={() => { setEditingSubject(null); setSubjectInputName(''); }} className="btn btn-secondary">취소</button>
                                        </>
                                    ) : (
                                        <button onClick={handleAddSubject} className="btn btn-primary">추가</button>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {subjects.map(sub => (
                                    <div key={sub.id} style={{
                                        padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: editingSubject?.id === sub.id ? '#f0f9ff' : 'white'
                                    }}>
                                        <span style={{ fontWeight: 500 }}>{sub.name}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => { setEditingSubject(sub); setSubjectInputName(sub.name); }} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>수정</button>
                                            <button onClick={(e) => handleDeleteSubject(e, sub.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#fee2e2', color: '#ef4444' }}>삭제</button>
                                        </div>
                                    </div>
                                ))}
                                {subjects.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>등록된 분류가 없습니다.</div>}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ⭐️ Exam Move Modal */}
            {
                showMoveModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
                    }}>
                        <div className="glass-card" style={{ background: 'white', padding: '2rem', width: '400px', maxWidth: '95%' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>차시/시험지 이동</h3>

                            <div style={{ marginBottom: '1rem' }}>
                                <label className="input-label">이동할 과정</label>
                                <select
                                    className="input-field"
                                    value={moveTargetCourseId}
                                    onChange={e => setMoveTargetCourseId(e.target.value)}
                                >
                                    <option value="">과정 선택</option>
                                    {fullCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="input-label">이동할 분류(과목)</label>
                                <select
                                    className="input-field"
                                    value={moveTargetSubjectId}
                                    onChange={e => setMoveTargetSubjectId(e.target.value)}
                                >
                                    <option value="">분류(과목) 선택 (선택 안함: 미분류)</option>
                                    {moveTargetSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowMoveModal(false)} className="btn btn-secondary">취소</button>
                                <button onClick={handleMoveExam} className="btn btn-primary">이동 확인</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ⭐️ Exam Edit Modal (New) */}
            {
                isExamEditModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '500px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>시험지 정보 수정</h3>

                            <div style={{ marginBottom: '1rem' }}>
                                <label className="input-label">중분류 (과목)</label>
                                <input
                                    className="input-field"
                                    list="edit-subject-options"
                                    value={editExamData.subjectName}
                                    onChange={e => setEditExamData({ ...editExamData, subjectName: e.target.value })}
                                    placeholder="과목 입력"
                                />
                                <datalist id="edit-subject-options">
                                    {subjects.map(s => <option key={s.id} value={s.name} />)}
                                </datalist>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label className="input-label">시험지 제목</label>
                                <input className="input-field" value={editExamData.title} onChange={e => setEditExamData({ ...editExamData, title: e.target.value })} />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label className="input-label">소분류 (Topic)</label>
                                <input className="input-field" value={editExamData.topic || ''} onChange={e => setEditExamData({ ...editExamData, topic: e.target.value })} placeholder="예: 집합과 명제" />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label className="input-label">차시 (회차)</label>
                                <input className="input-field" value={editExamData.round} onChange={e => setEditExamData({ ...editExamData, round: e.target.value })} />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="input-label">제한시간 (분)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={editExamData.timeLimit === 0 ? '' : editExamData.timeLimit}
                                    onChange={e => setEditExamData({ ...editExamData, timeLimit: parseInt(e.target.value) || 60 })}
                                    disabled={editExamData.timeLimit === 0}
                                    style={{ opacity: editExamData.timeLimit === 0 ? 0.5 : 1 }}
                                />
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginTop: '0.75rem',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    color: '#64748b'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={editExamData.timeLimit === 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setEditExamData({ ...editExamData, timeLimit: 0 });
                                            } else {
                                                setEditExamData({ ...editExamData, timeLimit: 60 });
                                            }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    제한시간 설정 없음
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary" onClick={() => setIsExamEditModalOpen(false)}>취소</button>
                                <button className="btn btn-primary" onClick={handleUpdateExam}>저장</button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* ⭐️ Batch Move Modal */}
            {isBatchMoveModalOpen && (
                <div
                    onClick={() => setIsBatchMoveModalOpen(false)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '500px',
                            maxHeight: '90vh', overflowY: 'auto'
                        }}
                    >
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                            선택한 문제 이동 ({selectedQuestionIds.length}개)
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* 1. Course Selection */}
                            <div>
                                <label className="input-label">
                                    대분류 (과정)
                                    <span style={{ fontSize: '0.8em', color: '#94a3b8', marginLeft: '0.5rem' }}>
                                        (Loaded: {batchMoveTargetExams.length})
                                    </span>
                                </label>
                                <select
                                    className="input-field"
                                    value={batchMoveTargetCourseId}
                                    onChange={e => {
                                        setBatchMoveTargetCourseId(e.target.value);
                                        setBatchMoveSelectedSubjectName('');
                                        setBatchMoveSelectedTitle('');
                                        setBatchMoveTargetExamId('');
                                    }}
                                >
                                    {fullCourses.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* ⭐ Use actual subjects from database instead of extracting from exams */}
                            <div>
                                <label className="input-label">중분류 (과목)</label>
                                <select
                                    className="input-field"
                                    value={batchMoveSelectedSubjectName}
                                    onChange={e => {
                                        setBatchMoveSelectedSubjectName(e.target.value);
                                        setBatchMoveSelectedTitle('');
                                        setBatchMoveTargetExamId('');
                                    }}
                                >
                                    <option value="">과목을 선택하세요</option>
                                    {batchMoveTargetSubjects.map(sub => (
                                        <option key={sub.id} value={sub.name}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* ⭐ Filter by subjectId instead of subjectName for accuracy */}
                            {(() => {
                                // Find the selected subject's ID
                                const selectedSubject = batchMoveTargetSubjects.find(s => s.name === batchMoveSelectedSubjectName);
                                const selectedSubjectId = selectedSubject?.id;

                                // Filter exams by subjectId (more accurate than name matching)
                                const filteredBySubject = batchMoveTargetExams.filter(e => {
                                    // Match by subjectId if available, otherwise fall back to name comparison
                                    if (selectedSubjectId) {
                                        return e.subjectId === selectedSubjectId;
                                    }
                                    // Fallback for legacy data without subjectId
                                    return (e.subjectName || '미분류') === batchMoveSelectedSubjectName;
                                });
                                const uniqueTitles = Array.from(new Set(filteredBySubject.map(e => e.title))).sort();

                                return (
                                    <div>
                                        <label className="input-label">소분류 (시험지 제목)</label>
                                        <select
                                            className="input-field"
                                            value={batchMoveSelectedTitle}
                                            onChange={e => {
                                                setBatchMoveSelectedTitle(e.target.value);
                                                setBatchMoveTargetExamId('');
                                            }}
                                            disabled={!batchMoveSelectedSubjectName}
                                        >
                                            <option value="">시험지를 선택하세요</option>
                                            {uniqueTitles.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })()}

                            {/* ⭐ Filter rounds by subjectId and title */}
                            {(() => {
                                // Find the selected subject's ID
                                const selectedSubject = batchMoveTargetSubjects.find(s => s.name === batchMoveSelectedSubjectName);
                                const selectedSubjectId = selectedSubject?.id;

                                const finalCandidates = batchMoveTargetExams.filter(e => {
                                    // First filter by subjectId (or subjectName as fallback)
                                    const subjectMatch = selectedSubjectId
                                        ? e.subjectId === selectedSubjectId
                                        : (e.subjectName || '미분류') === batchMoveSelectedSubjectName;

                                    // Then filter by title
                                    const titleMatch = e.title === batchMoveSelectedTitle;

                                    return subjectMatch && titleMatch;
                                });

                                return (
                                    <div>
                                        <label className="input-label">차시 (회차 선택)</label>
                                        <select
                                            className="input-field"
                                            value={batchMoveTargetExamId}
                                            onChange={e => setBatchMoveTargetExamId(e.target.value)}
                                            disabled={!batchMoveSelectedTitle}
                                        >
                                            <option value="">회차를 선택하세요</option>
                                            {finalCandidates.length === 0 && batchMoveSelectedTitle && <option disabled>표시할 회차가 없습니다.</option>}
                                            {finalCandidates.map((e: any) => (
                                                <option key={e.id} value={e.id}>
                                                    {e.round || '회차 없음'} ({e.questionsCount || 0}문제)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="modal-actions" style={{ marginTop: '2rem' }}>
                            <button onClick={() => setIsBatchMoveModalOpen(false)} className="btn btn-secondary">취소</button>
                            <button onClick={handleBatchMoveQuestions} className="btn btn-primary">
                                이동하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ⭐️ Batch Category Update Modal */}
            {isBatchCategoryModalOpen && (
                <div
                    onClick={() => setIsBatchCategoryModalOpen(false)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '400px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                        }}
                    >
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                            카테고리 일괄 변경 ({selectedQuestionIds.length}개)
                        </h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="input-label">대상 카테고리 선택</label>
                            <select
                                className="input-field"
                                value={batchCategoryTarget}
                                onChange={e => setBatchCategoryTarget(e.target.value)}
                            >
                                <option value="" disabled>카테고리를 선택하세요</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setIsBatchCategoryModalOpen(false)} className="btn btn-secondary">취소</button>
                            <button onClick={handleBatchUpdateCategory} className="btn btn-primary" style={{ background: '#3b82f6', borderColor: '#2563eb' }}>
                                변경하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};




