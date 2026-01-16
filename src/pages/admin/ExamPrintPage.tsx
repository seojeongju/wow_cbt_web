import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Upload, Settings, Eye } from 'lucide-react';
import { Exam, Question } from '../../types';
import { ExamService } from '../../services/examService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type TemplateType = 'default' | 'compact' | 'custom';

export const ExamPrintPage = () => {
    const { examId } = useParams<{ examId: string }>();
    const navigate = useNavigate();
    const printRef = useRef<HTMLDivElement>(null);
    
    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);
    const [templateType, setTemplateType] = useState<TemplateType>('default');
    const [customTemplate, setCustomTemplate] = useState<string | null>(null);
    const [isAnalyzingPdf, setIsAnalyzingPdf] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [printSettings, setPrintSettings] = useState({
        includeAnswers: false,
        includeExplanations: false,
        questionsPerPage: 2,
        fontSize: 12,
        showPageNumbers: true,
        showHeader: true,
        showFooter: true
    });

    useEffect(() => {
        loadExam();
    }, [examId]);

    const loadExam = async () => {
        if (!examId) return;
        try {
            const data = await ExamService.getExamById(examId);
            if (data) {
                setExam(data);
            } else {
                alert('시험을 불러올 수 없습니다.');
                navigate('/admin/questions');
            }
        } catch (error) {
            console.error('Load exam error:', error);
            alert('시험을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // PDF 파일 처리
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            setIsAnalyzingPdf(true);
            try {
                const template = await analyzePdfTemplate(file);
                setCustomTemplate(template);
                setTemplateType('custom');
                alert('PDF 템플릿이 분석되어 저장되었습니다.');
            } catch (error) {
                console.error('PDF 분석 오류:', error);
                alert('PDF 분석 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
            } finally {
                setIsAnalyzingPdf(false);
            }
            return;
        }

        // HTML 파일 처리
        if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
            alert('HTML 또는 PDF 파일만 업로드 가능합니다.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setCustomTemplate(content);
            setTemplateType('custom');
            alert('템플릿이 업로드되었습니다.');
        };
        reader.readAsText(file);
    };

    const analyzePdfTemplate = async (file: File): Promise<string> => {
        // Dynamic import for pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
        }).promise;

        // 첫 번째 페이지만 분석 (템플릿 구조 추출)
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const textContent = await page.getTextContent();

        // 텍스트 항목들을 위치별로 정렬
        const textItems = (textContent.items as any[]).map(item => ({
            text: item.str,
            x: item.transform[4],
            y: viewport.height - item.transform[5],
            fontSize: item.transform[0],
            fontName: item.fontName
        }));

        // 텍스트를 Y 좌표로 그룹화 (라인별)
        const lines: { y: number; items: typeof textItems }[] = [];
        textItems.forEach(item => {
            if (!item.text.trim()) return;
            
            // 기존 라인 찾기 (5px 오차 허용)
            const existingLine = lines.find(line => Math.abs(line.y - item.y) < 5);
            if (existingLine) {
                existingLine.items.push(item);
            } else {
                lines.push({ y: item.y, items: [item] });
            }
        });

        // Y 좌표로 정렬 (위에서 아래로)
        lines.sort((a, b) => b.y - a.y);
        lines.forEach(line => {
            line.items.sort((a, b) => a.x - b.x);
        });

        // HTML 템플릿 생성
        let htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Malgun Gothic', sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .question-container {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .question-header {
            margin-bottom: 10px;
        }
        .question-number {
            color: #6366f1;
            font-weight: 600;
            margin-right: 8px;
        }
        .question-text {
            font-weight: 600;
            font-size: 1em;
        }
        .question-image {
            margin: 15px 0;
            text-align: center;
        }
        .question-image img {
            max-width: 100%;
            max-height: 300px;
            object-fit: contain;
        }
        .options {
            margin-top: 10px;
        }
        .option {
            margin: 5px 0;
            padding: 5px 0;
        }
        .option-label {
            font-weight: 600;
            margin-right: 8px;
            color: #475569;
        }
        .answer {
            margin-top: 10px;
            padding: 8px;
            background: #dcfce7;
            border-radius: 4px;
            font-size: 0.9em;
            color: #166534;
        }
        .explanation {
            margin-top: 10px;
            padding: 8px;
            background: #fef3c7;
            border-radius: 4px;
            font-size: 0.9em;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="question-container">
        <div class="question-header">
            <span class="question-number">{{questionNumber}}.</span>
            <span class="question-text">{{questionText}}</span>
        </div>
        
        {{#if questionImage}}
        <div class="question-image">
            <img src="{{questionImage}}" alt="Question Image" />
        </div>
        {{/if}}
        
        <div class="options">
            {{options}}
        </div>
        
        {{#if answer}}
        <div class="answer">
            <strong>정답:</strong> {{answer}}
        </div>
        {{/if}}
        
        {{#if explanation}}
        <div class="explanation">
            <strong>해설:</strong> {{explanation}}
        </div>
        {{/if}}
    </div>
</body>
</html>
        `.trim();

        // PDF에서 추출한 스타일 정보를 기반으로 템플릿 개선
        // (선택적: 더 정교한 분석이 필요한 경우)

        return htmlTemplate;
    };

    const generatePDF = async () => {
        if (!printRef.current || !exam) return;

        try {
            // HTML을 이미지로 변환하여 PDF 생성 (한글 깨짐 방지)
            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // A4 크기 및 여백 설정
            const A4_WIDTH = 210; // A4 width in mm
            const A4_HEIGHT = 297; // A4 height in mm
            const MARGIN_TOP = 15; // 위쪽 여백 (mm)
            const MARGIN_BOTTOM = 15; // 아래쪽 여백 (mm)
            const MARGIN_LEFT = 15; // 왼쪽 여백 (mm)
            const MARGIN_RIGHT = 15; // 오른쪽 여백 (mm)
            
            // 실제 콘텐츠 영역 크기
            const contentWidth = A4_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
            const contentHeight = A4_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;
            
            // 이미지 크기 계산 (여백을 고려)
            const imgWidth = contentWidth; // 콘텐츠 영역 너비
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // 이미지를 페이지별로 나누기
            let sourceY = 0; // 원본 이미지에서 가져올 Y 위치 (픽셀)
            const sourceHeight = canvas.height; // 원본 이미지 높이 (픽셀)
            const sourceWidth = canvas.width; // 원본 이미지 너비 (픽셀)
            
            // 각 페이지에 표시할 이미지 높이 계산 (픽셀)
            // contentHeight (mm)를 픽셀로 변환
            const pageContentHeightPx = (contentHeight / imgHeight) * sourceHeight;
            
            while (sourceY < sourceHeight) {
                // 현재 페이지에 표시할 이미지 높이 계산
                const remainingHeight = sourceHeight - sourceY;
                const displayHeightPx = Math.min(pageContentHeightPx, remainingHeight);
                
                // 픽셀을 mm로 변환
                const displayHeightMm = (displayHeightPx / sourceHeight) * imgHeight;
                
                // 현재 페이지에 이미지의 일부분 추가
                // 이미지를 잘라서 각 페이지에 배치
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = sourceWidth;
                tempCanvas.height = displayHeightPx;
                const tempCtx = tempCanvas.getContext('2d');
                
                if (tempCtx) {
                    // 원본 이미지에서 해당 부분만 복사
                    tempCtx.drawImage(
                        canvas,
                        0, sourceY, sourceWidth, displayHeightPx, // source
                        0, 0, sourceWidth, displayHeightPx // destination
                    );
                    
                    const pageImgData = tempCanvas.toDataURL('image/png');
                    
                    // PDF 페이지에 추가 (여백 고려)
                    pdf.addImage(
                        pageImgData,
                        'PNG',
                        MARGIN_LEFT,
                        MARGIN_TOP,
                        imgWidth,
                        displayHeightMm
                    );
                }
                
                // 다음 페이지로 이동
                sourceY += pageContentHeightPx;
                
                // 마지막 페이지가 아니면 새 페이지 추가
                if (sourceY < sourceHeight) {
                    pdf.addPage();
                }
            }

            // Save PDF
            pdf.save(`${exam.title}_시험지.pdf`);
            alert(`PDF가 생성되었습니다! (총 ${pdf.getNumberOfPages()}페이지)`);
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('PDF 생성 중 오류가 발생했습니다.');
        }
    };


    const renderQuestion = (question: Question, index: number) => {
        if (templateType === 'custom' && customTemplate) {
            // Custom template rendering
            let html = customTemplate;
            
            // 기본 변수 치환
            html = html.replace(/\{\{questionNumber\}\}/g, String(index + 1));
            html = html.replace(/\{\{questionText\}\}/g, (question.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
            
            // 이미지 처리
            if (question.imageUrl) {
                html = html.replace(/\{\{questionImage\}\}/g, `<img src="${question.imageUrl}" style="max-width: 100%;" alt="Question Image" />`);
                // Handlebars 스타일 조건문 처리
                html = html.replace(/\{\{#if questionImage\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
            } else {
                html = html.replace(/\{\{questionImage\}\}/g, '');
                html = html.replace(/\{\{#if questionImage\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
            }
            
            // 옵션 처리
            if (question.options && question.options.length > 0) {
                const optionsHtml = question.options.map((opt, optIdx) => 
                    `<div class="option"><span class="option-label">${String.fromCharCode(65 + optIdx)}.</span>${opt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`
                ).join('');
                html = html.replace(/\{\{options\}\}/g, optionsHtml);
            } else {
                html = html.replace(/\{\{options\}\}/g, '');
            }

            // 정답 처리
            if (printSettings.includeAnswers) {
                const answer = typeof question.correctAnswer === 'number'
                    ? String.fromCharCode(65 + question.correctAnswer)
                    : String(question.correctAnswer);
                html = html.replace(/\{\{answer\}\}/g, answer);
                html = html.replace(/\{\{#if answer\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
            } else {
                html = html.replace(/\{\{answer\}\}/g, '');
                html = html.replace(/\{\{#if answer\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
            }

            // 해설 처리
            if (printSettings.includeExplanations && question.explanation) {
                html = html.replace(/\{\{explanation\}\}/g, question.explanation.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
                html = html.replace(/\{\{#if explanation\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
            } else {
                html = html.replace(/\{\{explanation\}\}/g, '');
                html = html.replace(/\{\{#if explanation\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
            }

            return <div dangerouslySetInnerHTML={{ __html: html }} />;
        }

        // Default template
        // Calculate font sizes based on printSettings.fontSize (base: 12pt)
        const baseFontSize = printSettings.fontSize;
        const categoryFontSize = `${(baseFontSize * 0.8125 / 12).toFixed(2)}rem`; // ~0.8125rem at 12pt
        const questionFontSize = `${(baseFontSize * 0.9375 / 12).toFixed(2)}rem`; // ~0.9375rem at 12pt
        const optionFontSize = `${(baseFontSize * 0.875 / 12).toFixed(2)}rem`; // ~0.875rem at 12pt
        const answerFontSize = `${(baseFontSize * 0.8125 / 12).toFixed(2)}rem`; // ~0.8125rem at 12pt
        
        return (
            <div style={{
                pageBreakInside: 'avoid',
                marginBottom: '1.5rem',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
            }}>
                {/* Question Header */}
                <div style={{
                    marginBottom: '0.75rem',
                    width: '100%',
                    maxWidth: '100%'
                }}>
                    {question.category && !question.category.includes('AI추출') && !question.category.includes('AI 추출') && (
                        <span style={{
                            fontSize: categoryFontSize,
                            color: '#6366f1',
                            fontWeight: 600,
                            marginRight: '0.5rem'
                        }}>
                            {question.category}
                        </span>
                    )}
                    <span style={{
                        fontSize: questionFontSize,
                        fontWeight: 600,
                        color: '#1e293b',
                        lineHeight: 1.5,
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal',
                        display: 'block',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                    }}>
                        {index + 1}. {question.text}
                    </span>
                </div>

                {/* Question Image */}
                {question.imageUrl && (
                    <div style={{
                        marginBottom: '0.75rem',
                        textAlign: 'center'
                    }}>
                        <img
                            src={question.imageUrl}
                            alt={`Question ${index + 1}`}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '200px',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                )}

                {/* Options */}
                {question.options && question.options.length > 0 && (
                    <div style={{
                        marginBottom: '0.75rem',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                    }}>
                        {question.options.map((option, optIdx) => (
                            <div
                                key={optIdx}
                                style={{
                                    fontSize: optionFontSize,
                                    color: '#1e293b',
                                    lineHeight: 1.6,
                                    marginBottom: '0.25rem',
                                    wordWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'normal',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.375rem',
                                    width: '100%',
                                    maxWidth: '100%',
                                    minWidth: 0,
                                    boxSizing: 'border-box'
                                }}
                            >
                                <strong style={{ 
                                    color: '#475569',
                                    flexShrink: 0,
                                    minWidth: 'auto'
                                }}>
                                    {String.fromCharCode(65 + optIdx)}.
                                </strong>
                                <span style={{
                                    flex: 1,
                                    minWidth: 0,
                                    wordWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'normal',
                                    boxSizing: 'border-box'
                                }}>
                                    {option}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Answer (if enabled) */}
                {printSettings.includeAnswers && (
                    <div style={{
                        padding: '0.5rem 0.75rem',
                        background: '#dcfce7',
                        borderRadius: '0.25rem',
                        marginBottom: '0.5rem',
                        fontSize: answerFontSize,
                        color: '#166534',
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal'
                    }}>
                        <strong>정답:</strong> {
                            typeof question.correctAnswer === 'number'
                                ? String.fromCharCode(65 + question.correctAnswer)
                                : question.correctAnswer
                        }
                    </div>
                )}

                {/* Explanation (if enabled) */}
                {printSettings.includeExplanations && question.explanation && (
                    <div style={{
                        padding: '0.5rem 0.75rem',
                        background: '#fef3c7',
                        borderRadius: '0.25rem',
                        fontSize: answerFontSize,
                        color: '#92400e',
                        lineHeight: 1.5,
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal'
                    }}>
                        <strong>해설:</strong> {question.explanation}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div>시험지를 불러오는 중...</div>
            </div>
        );
    }

    if (!exam) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div>시험지를 찾을 수 없습니다.</div>
                <button onClick={() => navigate('/admin/questions')} style={{ marginTop: '1rem' }}>
                    돌아가기
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', width: '100%', overflow: 'visible' }}>
            {/* Header */}
            <div className="print-page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                            시험지 인쇄
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                            {exam.title}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem'
                        }}
                    >
                        <Eye size={16} /> {showPreview ? '설정 보기' : '미리보기만'}
                    </button>
                    <button
                        onClick={generatePDF}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 600
                        }}
                    >
                        <Download size={16} /> PDF 다운로드
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr' : '300px 1fr', gap: '2rem', width: '100%', overflow: 'visible' }}>
                {/* Settings Panel */}
                {showPreview ? null : (
                    <div className="print-settings-panel" style={{
                        background: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        height: 'fit-content',
                        position: 'sticky',
                        top: '2rem'
                    }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Settings size={18} /> 인쇄 설정
                        </h3>

                        {/* Template Selection */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                템플릿 선택
                            </label>
                            <select
                                value={templateType}
                                onChange={(e) => setTemplateType(e.target.value as TemplateType)}
                                style={{
                                    width: '100%',
                                    padding: '0.625rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <option value="default">기본 템플릿</option>
                                <option value="compact">간결한 템플릿</option>
                                <option value="custom">사용자 정의</option>
                            </select>
                        </div>

                        {/* Custom Template Upload */}
                        {templateType === 'custom' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    템플릿 업로드
                                </label>
                                <div style={{
                                    padding: '1rem',
                                    border: '2px dashed #cbd5e1',
                                    borderRadius: '0.5rem',
                                    textAlign: 'center',
                                    cursor: isAnalyzingPdf ? 'wait' : 'pointer',
                                    position: 'relative',
                                    opacity: isAnalyzingPdf ? 0.6 : 1
                                }}>
                                    <input
                                        type="file"
                                        accept=".html,.pdf,text/html,application/pdf"
                                        onChange={handleTemplateUpload}
                                        disabled={isAnalyzingPdf}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: isAnalyzingPdf ? 'wait' : 'pointer'
                                        }}
                                    />
                                    {isAnalyzingPdf ? (
                                        <>
                                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                                                PDF 분석 중...
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={24} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                HTML 또는 PDF 파일 업로드
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                                PDF 업로드 시 자동으로 템플릿 분석
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                                사용 가능한 변수: {'{{questionNumber}}'}, {'{{questionText}}'}, {'{{questionImage}}'}, {'{{options}}'}, {'{{answer}}'}, {'{{explanation}}'}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Print Settings */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>인쇄 옵션</h4>
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={printSettings.includeAnswers}
                                    onChange={(e) => setPrintSettings({ ...printSettings, includeAnswers: e.target.checked })}
                                />
                                <span style={{ fontSize: '0.875rem' }}>정답 포함</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={printSettings.includeExplanations}
                                    onChange={(e) => setPrintSettings({ ...printSettings, includeExplanations: e.target.checked })}
                                />
                                <span style={{ fontSize: '0.875rem' }}>해설 포함</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={printSettings.showHeader}
                                    onChange={(e) => setPrintSettings({ ...printSettings, showHeader: e.target.checked })}
                                />
                                <span style={{ fontSize: '0.875rem' }}>헤더 표시</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={printSettings.showPageNumbers}
                                    onChange={(e) => setPrintSettings({ ...printSettings, showPageNumbers: e.target.checked })}
                                />
                                <span style={{ fontSize: '0.875rem' }}>페이지 번호</span>
                            </label>
                        </div>

                        {/* Font Size */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                글자 크기: {printSettings.fontSize}pt
                            </label>
                            <input
                                type="range"
                                min="8"
                                max="16"
                                value={printSettings.fontSize}
                                onChange={(e) => setPrintSettings({ ...printSettings, fontSize: parseInt(e.target.value) })}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                )}

                {/* Print Preview Container - Scrollable for preview */}
                <div style={{
                    width: '100%',
                    height: 'calc(100vh - 250px)',
                    minHeight: '600px',
                    overflowY: 'auto',
                    overflowX: 'visible',
                    borderRadius: '1rem',
                    border: '1px solid #e2e8f0'
                }}>
                    <div
                        ref={printRef}
                        className="print-area"
                        style={{
                            background: 'white',
                            borderRadius: '1rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            overflow: 'visible',
                            display: 'flex',
                            width: '100%',
                            maxWidth: '100%',
                            height: 'auto',
                            minHeight: 'auto'
                        }}
                    >
                    {/* Left Sidebar - Test Info */}
                    {printSettings.showHeader && (
                        <div className="print-sidebar" style={{
                            width: '180px',
                            background: '#f1f5f9',
                            padding: '1.5rem',
                            borderRight: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <h2 style={{
                                fontSize: `${(printSettings.fontSize * 1.0 / 12).toFixed(2)}rem`,
                                fontWeight: 700,
                                color: '#1e293b',
                                marginBottom: '1rem',
                                lineHeight: 1.3
                            }}>
                                {exam.title}
                            </h2>
                            {exam.courseName && (
                                <p style={{
                                    fontSize: `${(printSettings.fontSize * 0.8125 / 12).toFixed(2)}rem`,
                                    color: '#64748b',
                                    marginBottom: '0.5rem',
                                    lineHeight: 1.5
                                }}>
                                    과정: {exam.courseName}
                                </p>
                            )}
                            {exam.timeLimit && (
                                <p style={{
                                    fontSize: `${(printSettings.fontSize * 0.8125 / 12).toFixed(2)}rem`,
                                    color: '#64748b',
                                    marginBottom: '0.5rem',
                                    lineHeight: 1.5
                                }}>
                                    시간 제한: {exam.timeLimit}분
                                </p>
                            )}
                            <p style={{
                                fontSize: `${(printSettings.fontSize * 0.8125 / 12).toFixed(2)}rem`,
                                color: '#64748b',
                                lineHeight: 1.5
                            }}>
                                총 문제 수: {exam.questions.length}문제
                            </p>
                        </div>
                    )}

                    {/* Right Content - Questions */}
                    <div className="print-content" style={{
                        flex: 1,
                        padding: '1.5rem 2rem',
                        background: 'white',
                        width: '100%',
                        maxWidth: '100%',
                        overflow: 'visible',
                        minHeight: 'auto',
                        height: 'auto',
                        boxSizing: 'border-box',
                        minWidth: 0
                    }}>
                        {exam.questions.map((question, index) => (
                            <div key={question.id} style={{ 
                                marginBottom: '1.5rem',
                                pageBreakInside: 'avoid',
                                width: '100%',
                                maxWidth: '100%',
                                boxSizing: 'border-box'
                            }}>
                                {renderQuestion(question, index)}
                            </div>
                        ))}
                    </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        margin: 1.5cm;
                        size: A4;
                        marks: none;
                    }
                    
                    * {
                        box-sizing: border-box;
                    }
                    
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    
                    /* Hide page header and settings */
                    .print-page-header,
                    .print-settings-panel {
                        display: none !important;
                    }
                    
                    /* Hide all elements by default */
                    body > * {
                        display: none !important;
                    }
                    
                    /* Hide AdminLayout wrapper */
                    body > div > div:has(aside),
                    body > div > div:has(header):not(:has(.print-area)) {
                        display: none !important;
                    }
                    
                    /* Show only elements containing print-area */
                    body > div:has(.print-area),
                    body > div:has(.print-area) > div:has(.print-area) {
                        display: block !important;
                        visibility: visible !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        width: 100% !important;
                    }
                    
                    /* Ensure print area container is visible */
                    body > div:has(.print-area) > div:has(.print-area),
                    body > div:has(.print-area) > div:has(.print-area) > div {
                        display: block !important;
                        visibility: visible !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                    }
                    
                    .print-area {
                        display: flex !important;
                        position: relative !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        overflow: visible !important;
                        min-height: auto !important;
                        height: auto !important;
                        max-height: none !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                    
                    /* Hide sidebar in print */
                    .print-area .print-sidebar {
                        display: none !important;
                    }
                    
                    /* Content area should be full width in print */
                    .print-area .print-content {
                        display: block !important;
                        width: 100% !important;
                        padding: 1.5cm !important;
                        flex: 1 !important;
                        background: white !important;
                        overflow: visible !important;
                        min-height: auto !important;
                        height: auto !important;
                        max-height: none !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }
                    
                    /* Ensure questions are visible */
                    .print-area .print-content > div {
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        page-break-inside: avoid;
                        break-inside: avoid;
                        margin-bottom: 1.5rem !important;
                        color: black !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    
                    /* Ensure all question content is visible */
                    .print-area .print-content > div > div,
                    .print-area .print-content > div > div > * {
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        color: black !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    
                    /* Ensure text elements are visible and wrap */
                    .print-area .print-content span,
                    .print-area .print-content p,
                    .print-area .print-content div,
                    .print-area .print-content strong {
                        word-wrap: break-word !important;
                        word-break: break-word !important;
                        overflow-wrap: break-word !important;
                        white-space: normal !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        color: black !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    
                    /* Flex containers for options - ensure wrapping */
                    .print-area .print-content > div > div[style*="flex"] {
                        display: flex !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        min-width: 0 !important;
                        box-sizing: border-box !important;
                    }
                    
                    .print-area .print-content > div > div[style*="flex"] > span {
                        min-width: 0 !important;
                        word-wrap: break-word !important;
                        word-break: break-word !important;
                        overflow-wrap: break-word !important;
                        white-space: normal !important;
                    }
                    
                    /* Ensure images are visible */
                    .print-area .print-content img {
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        max-width: 100% !important;
                    }
                    
                    /* Hide URL and page info in print */
                    body::after,
                    body::before {
                        display: none !important;
                        content: none !important;
                    }
                    
                    /* Hide any footer elements */
                    footer,
                    .footer,
                    [class*="footer"],
                    [id*="footer"] {
                        display: none !important;
                    }
                    
                    /* Hide header buttons and settings */
                    button,
                    .btn,
                    [class*="button"],
                    input,
                    select,
                    textarea {
                        display: none !important;
                    }
                    
                    /* Hide admin layout header/nav if present */
                    header,
                    nav,
                    aside,
                    [class*="header"],
                    [class*="Header"],
                    [class*="nav"],
                    [class*="Nav"],
                    [class*="sidebar"],
                    [class*="Sidebar"],
                    [class*="sidebar-container"],
                    [class*="admin-sidebar"],
                    [class*="admin-header"] {
                        display: none !important;
                    }
                    
                    /* Hide AdminLayout specific elements - more aggressive */
                    body > div > aside,
                    body > div > header,
                    body > div > div > aside,
                    body > div > div > header,
                    main > header {
                        display: none !important;
                    }
                    
                    /* Hide sidebar container */
                    body > div > div:has(aside),
                    body > div:has(aside) {
                        display: none !important;
                    }
                    
                    /* Ensure only print-area content is visible */
                    body > div:has(.print-area) > div:not(:has(.print-area)),
                    body > div:has(.print-area) > header,
                    body > div:has(.print-area) > aside {
                        display: none !important;
                    }
                }
            `}} />
        </div>
    );
};

