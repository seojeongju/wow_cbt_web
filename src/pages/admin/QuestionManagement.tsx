import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Trash2, FileUp, Folder, FileText, LayoutGrid, BookOpen, Edit2, Image as ImageIcon, Settings, BrainCircuit, Key as KeyIcon, Sparkles, X, CheckCircle } from 'lucide-react';
import { Question } from '../../types';
import { ExamService } from '../../services/examService';
import { CategoryService } from '../../services/categoryService';
import { CourseService } from '../../services/courseService';
import { OpenAIService } from '../../services/openAiService'; // ⭐️ 추가
import * as XLSX from 'xlsx';

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
    const [exams, setExams] = useState<{ id: string; title: string; course: string }[]>([]);

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
            course: exam.courseName || '미분류'
        }));
        setExams(examsWithCourse);

        // Orphan Check Logic (Legacy: might not be needed with DB, but keeping safely)
        // With D1, we trust the DB primarily. Or we can auto-create courses if missing.
        // For now, let's just rely on fetched courses.

        setCourses(currentCourses);
        console.log('📚 Final course list:', currentCourses);
    };

    // Derived state for exam dropdown
    const availableExams = exams.filter(e => e.course === selectedCourse);

    // Initial Load: Reset exam selection when course changes
    useEffect(() => {
        if (selectedCourse && availableExams.length > 0) {
            setSelectedExamId(availableExams[0].id);
        } else {
            setSelectedExamId('');
            // Don't clear questions here immediately, let the exam selection effect handle it
            if (!availableExams.length) setQuestions([]);
        }
    }, [selectedCourse, exams]); // Added exams dependency

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
    };

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newQuestion, setNewQuestion] = useState<any>({
        category: '3D형상모델링',
        options: ['', '', '', ''],
        correctAnswer: 0
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
        timeLimit: 60
    });

    // ⭐️ Load categories when selectedCourse changes
    useEffect(() => {
        const loadCats = async () => {
            if (selectedCourse) {
                // Note: selectedCourse is currently the NAME. But API needs ID? 
                // Actually, let's check CategoryService. 
                // CategoryService.getCategories expects courseId.
                // QuestionManagement currently treats selectedCourse as a name string.
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
                const allCourses = await CourseService.getCourses();
                const courseObj = allCourses.find((c: any) => c.name === selectedCourse);

                if (courseObj) {
                    const cats = await CategoryService.getCategories(courseObj.id);
                    setCategories(cats.map((c: any) => c.name));
                } else {
                    setCategories([]);
                }
            } else {
                setCategories([]);
            }
        };
        loadCats();
    }, [selectedCourse]);

    // ...

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
        if (!selectedCourse) {
            alert('과정을 먼저 선택해주세요.');
            return;
        }
        setIsExamModalOpen(true);
    };

    const handleSaveNewExam = async () => {
        if (!newExamData.title.trim()) {
            alert('시험지 제목을 입력해주세요.');
            return;
        }

        if (!selectedCourse) {
            alert('과정을 선택해주세요.');
            return;
        }

        // Resolve Course ID from Name
        const courseObj = fullCourses.find((c: any) => c.name === selectedCourse);
        if (!courseObj) {
            alert('과정 정보를 찾을 수 없습니다.');
            return;
        }

        const result = await ExamService.createExam({
            title: newExamData.title,
            courseName: courseObj.id, // Pass ID here, as ExamService maps this to courseId
            timeLimit: newExamData.timeLimit
        });

        if (result.success) {
            alert('시험지가 생성되었습니다!');
            setIsExamModalOpen(false);
            setNewExamData({ title: '', timeLimit: 60 });

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

    // ⭐️ Edit Exam Handler
    const handleEditExamName = async () => {
        if (!selectedExamId) return;

        const currentExam = exams.find(e => e.id === selectedExamId);
        if (!currentExam) return;

        const newTitle = prompt('수정할 시험지 제목을 입력하세요:', currentExam.title);
        if (newTitle && newTitle !== currentExam.title) {
            const result = await ExamService.updateExam(selectedExamId, { title: newTitle });
            if (result.success) {
                alert('시험지 제목이 수정되었습니다.');
                await loadInitialData();
            } else {
                alert(result.message || '수정에 실패했습니다.');
            }
        }
    };

    // ⭐️ Delete Exam Handler
    const handleDeleteExam = async () => {
        if (!selectedExamId) return;

        const currentExam = exams.find(e => e.id === selectedExamId);
        if (!currentExam) return;

        if (confirm(`'${currentExam.title}' 시험지를 정말 삭제하시겠습니까?\n포함된 모든 문제와 기록이 삭제될 수 있습니다.`)) {
            const result = await ExamService.deleteExam(selectedExamId);
            if (result.success) {
                alert('시험지가 삭제되었습니다.');
                setSelectedExamId('');
                await loadInitialData();
            } else {
                alert('삭제에 실패했습니다.');
            }
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
        setNewQuestion({ ...q });
        setIsFormOpen(true);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Image Upload Handler
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewQuestion({ ...newQuestion, imageUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    // ⭐️ Paste Image Handler (Ctrl+V)
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (!isFormOpen) return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            setNewQuestion((prev: any) => ({ ...prev, imageUrl: event.target?.result as string }));
                        };
                        reader.readAsDataURL(blob);
                        e.preventDefault();
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isFormOpen]);

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

        const q: Question = {
            id: editingId || `q_${Date.now()} `,
            text: newQuestion.text,
            category: newQuestion.category || '기타',
            options: isSubjective ? [] : (newQuestion.options as string[]),
            correctAnswer: newQuestion.correctAnswer ?? (isSubjective ? -1 : 0),
            explanation: newQuestion.explanation || '해설 없음',
            imageUrl: newQuestion.imageUrl
        };

        if (editingId) {
            await ExamService.updateQuestionInExam(selectedExamId, q);
            alert('문제가 수정되었습니다.');
        } else {
            await ExamService.addQuestionToExam(selectedExamId, q);
            alert('문제가 등록되었습니다.');
        }

        setIsFormOpen(false);
        setEditingId(null);
        setNewQuestion({ category: '3D형상모델링', options: ['', '', '', ''], correctAnswer: 0 });
        loadQuestions(selectedExamId);
    };

    const handleDelete = async (id: string) => {
        if (!selectedExamId) return;
        if (confirm('정말 삭제하시겠습니까?')) {
            await ExamService.removeQuestionFromExam(selectedExamId, id);
            loadQuestions(selectedExamId);
        }
    };

    const handleOptionChange = (idx: number, val: string) => {
        const newOpts = [...(newQuestion.options || [])];
        newOpts[idx] = val;
        setNewQuestion({ ...newQuestion, options: newOpts });
    };

    // ⭐️ AI 유사 문제 생성 핸들러
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

        try {
            const generated = await OpenAIService.generateSimilarQuestions(
                {
                    text: question.text,
                    options: question.options,
                    correctAnswer: typeof question.correctAnswer === 'number' ? question.correctAnswer : 0,
                    explanation: question.explanation
                },
                apiKey,
                3 // 3개의 유사문제 생성
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

            // ⭐️ Worker 설정 (버전 호환성을 위해 unpkg 사용 및 mjs 확장자 명시)
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

            const arrayBuffer = await file.arrayBuffer();

            // ⭐️ 한글 및 특수문자 처리를 위한 CMap 설정 추가
            const pdf = await pdfjsLib.getDocument({
                data: arrayBuffer,
                cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
                cMapPacked: true,
                standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
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
                        {selectedCourse}
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

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                                {/* Course Display (Read Only) */}
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '0.5rem' }}>선택된 과정</label>
                                    <div style={{ padding: '0.75rem', background: 'var(--slate-50)', borderRadius: '0.5rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                                        {selectedCourse}
                                    </div>
                                </div>

                                {/* Exam Round Selector */}
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '0.5rem' }}>차시/시험지(Exam)</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <select
                                            className="input-field"
                                            value={selectedExamId}
                                            onChange={(e) => setSelectedExamId(e.target.value)}
                                            disabled={availableExams.length === 0}
                                        >
                                            {availableExams.length === 0 && <option value="">등록된 시험지가 없습니다</option>}
                                            {availableExams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                                        </select>
                                        <button onClick={handleCreateExam} className="btn btn-secondary" title="새 차시 추가">
                                            <Plus size={18} />
                                        </button>
                                        {selectedExamId && (
                                            <>
                                                <button
                                                    onClick={handleEditExamName}
                                                    className="btn btn-secondary"
                                                    title="제목 수정"
                                                    style={{ color: 'var(--slate-600)' }}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={handleDeleteExam}
                                                    className="btn btn-danger"
                                                    title="시험지 삭제"
                                                    style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}
                                                >
                                                    <Trash2 size={18} />
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
                            </div>
                        </section>

                        {/* Question Management Action Bar (Only visible if exam selected) */}
                        {selectedExamId && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>문제 목록</h3>
                                        <span style={{ fontSize: '0.8rem', background: 'var(--slate-100)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--slate-500)' }}>
                                            {selectedCourse} &gt; {exams.find(e => e.id === selectedExamId)?.title}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
                                                setNewQuestion({ category: '3D형상모델링', options: ['', '', '', ''], correctAnswer: 0 });
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
                                                        {newQuestion.imageUrl && (
                                                            <button
                                                                onClick={() => setNewQuestion({ ...newQuestion, imageUrl: undefined })}
                                                                className="btn btn-secondary"
                                                                style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                                            >
                                                                삭제
                                                            </button>
                                                        )}
                                                    </div>

                                                    {newQuestion.imageUrl && (
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
                                                            onClick={() => setNewQuestion({ ...newQuestion, options: ['', '', '', ''], correctAnswer: 0 })}
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
                                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                        {newQuestion.options.map((opt: string, idx: number) => (
                                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                                                />
                                                            </div>
                                                        ))}
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
                                                <label className="input-label">해설</label>
                                                <textarea
                                                    className="input-field"
                                                    rows={2}
                                                    value={newQuestion.explanation || ''}
                                                    onChange={e => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                                <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }}>
                                                    {editingId ? '수정 완료' : '이 시험지에 등록'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsFormOpen(false);
                                                        setEditingId(null);
                                                        setNewQuestion({ category: '3D형상모델링', options: ['', '', '', ''], correctAnswer: 0 });
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
                                                        <div key={q.id} className="glass-card" style={{ padding: '1.5rem', background: 'white', display: 'flex', gap: '1rem', borderLeft: '4px solid var(--primary-500)' }}>
                                                            {/* ⭐️ Number Badge */}
                                                            <div style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'flex-start',
                                                                minWidth: '3rem',
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

                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                                    <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--slate-100)', color: 'var(--slate-600)' }}>
                                                                        {q.category === 'AI_Extracted' ? 'AI 추출' : (q.category === 'PDF_Imported' ? 'PDF 추출' : q.category)}
                                                                    </span>
                                                                </div>
                                                                <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>{q.text}</h4>

                                                                {q.imageUrl && (
                                                                    <div style={{ marginBottom: '1rem' }}>
                                                                        <img src={q.imageUrl} alt="Question" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }} />
                                                                    </div>
                                                                )}

                                                                {/* Show Options Preview */}
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--slate-600)', marginTop: '0.5rem' }}>
                                                                    {q.options.map((opt, i) => (
                                                                        <div key={i} style={{ color: q.correctAnswer === i ? '#059669' : 'inherit', fontWeight: q.correctAnswer === i ? 600 : 400 }}>
                                                                            {i + 1}. {opt}
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {q.explanation && (
                                                                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                                                                        <strong>[해설]</strong> {q.explanation}
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
                )}

            </main>

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
                            setIsCategoryModalOpen(false);
                            cancelEditCategory();
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
                            setIsExamModalOpen(false);
                            setNewExamData({ title: '', timeLimit: 60 });
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
                                        setNewExamData({ title: '', timeLimit: 60 });
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
                                    과정
                                </label>
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    background: '#f1f5f9',
                                    borderRadius: '0.5rem',
                                    color: '#1e293b',
                                    fontWeight: 600
                                }}>
                                    📚 {selectedCourse}
                                </div>
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
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => {
                                        setIsExamModalOpen(false);
                                        setNewExamData({ title: '', timeLimit: 60 });
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
                        onClick={() => setShowApiKeyModal(false)}
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
            {showSimilarModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }}>
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
            )}
        </div >
    );
};
