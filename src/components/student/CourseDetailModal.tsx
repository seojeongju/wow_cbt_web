import { motion } from 'framer-motion';
import { X, BookOpen, Printer, Cpu, Box, PenTool, FileText, Target, Award, Clock, CheckCircle2, PlayCircle } from 'lucide-react';
import { useState } from 'react';

interface CourseDetail {
    description: string;
    targets: string[];
    features: string[];
    howToUse: string[];
}

interface CourseDetailModalProps {
    course: any;
    onClose: () => void;
    onEnroll: (courseId: string, courseName: string) => void;
}

// 하드코딩된 과정별 상세 정보 (Fallback용)
const courseDetails: Record<string, CourseDetail> = {
    '3D프린터운용기능사': {
        description: '3D 프린터를 활용하여 제품을 설계하고 출력하는 실무 능력을 평가하는 국가기술자격입니다. 3D 모델링, 슬라이싱, 출력 및 후처리 전반에 걸친 역량을 검증합니다.',
        targets: ['3D 프린터 관련 취업 준비생', '제조업 종사자', '메이커 및 창작자', '기술 교육자'],
        features: ['실제 시험과 동일한 문제 유형', 'AI 기반 오답 분석', '카테고리별 취약점 파악', '무제한 모의고사 응시'],
        howToUse: ['1. 회원가입 후 해당 과정을 신청합니다.', '2. 관리자 승인 후 문제풀이가 활성화됩니다.', '3. 모의고사를 통해 실전 연습을 합니다.', '4. 오답노트로 틀린 문제를 복습합니다.', '5. 성적 분석으로 취약 영역을 파악합니다.']
    },
    '3D프린터개발산업기사': {
        description: '3D 프린터 시스템의 설계, 개발, 유지보수 능력을 평가하는 중급 기술자격입니다. 하드웨어 구조, 펌웨어, 소재 특성 등 심화 지식을 다룹니다.',
        targets: ['3D 프린터 개발자', '장비 유지보수 엔지니어', '기술 연구원', '기능사 취득 후 상위 자격 준비자'],
        features: ['심화 이론 문제 포함', '실기 대비 핵심 개념', '최신 기출 경향 반영', '전문가 해설 제공'],
        howToUse: ['1. 회원가입 후 해당 과정을 신청합니다.', '2. 관리자 승인 후 문제풀이가 활성화됩니다.', '3. 이론 문제로 개념을 정리합니다.', '4. 모의고사로 실전 감각을 익힙니다.', '5. 오답노트로 취약 부분을 보완합니다.']
    }
};

const defaultCourseDetail: CourseDetail = {
    description: '체계적인 문제은행과 모의고사를 통해 자격증 취득을 지원하는 온라인 학습 과정입니다.',
    targets: ['해당 분야 취업 준비생', '실무 역량 향상을 원하는 직장인', '자격증 취득을 목표로 하는 분'],
    features: ['실전 모의고사 제공', 'AI 오답 분석', '성적 통계 및 취약점 분석', '언제 어디서나 학습 가능'],
    howToUse: ['1. 회원가입 후 원하는 과정을 신청합니다.', '2. 관리자 승인 후 문제풀이가 활성화됩니다.', '3. 모의고사를 통해 실력을 점검합니다.', '4. 오답노트로 틀린 문제를 복습합니다.', '5. 성적 분석을 통해 학습 전략을 세웁니다.']
};

export const CourseDetailModal = ({ course, onClose, onEnroll }: CourseDetailModalProps) => {
    const [agreed, setAgreed] = useState(false);

    // ⭐ LandingPage와 동일한 데이터 로딩 로직
    let detail = defaultCourseDetail;

    // 1. Try DB details first
    if (course.details) {
        try {
            const dbDetail = typeof course.details === 'string'
                ? JSON.parse(course.details)
                : course.details;

            if (dbDetail && (dbDetail.description || dbDetail.targets)) {
                detail = {
                    description: dbDetail.description || defaultCourseDetail.description,
                    targets: (dbDetail.targets && dbDetail.targets.length > 0) ? dbDetail.targets : defaultCourseDetail.targets,
                    features: (dbDetail.features && dbDetail.features.length > 0) ? dbDetail.features : defaultCourseDetail.features,
                    howToUse: (dbDetail.howToUse && dbDetail.howToUse.length > 0) ? dbDetail.howToUse : defaultCourseDetail.howToUse
                };
            }
        } catch (e) {
            // Fallback on error
        }
    }
    // 2. Try Hardcoded details (Legacy Support)
    else if (courseDetails[course.name]) {
        detail = courseDetails[course.name];
    }

    // 아이콘 및 색상 결정 (LandingPage와 동일)
    let Icon = BookOpen;
    let color1 = '#6366f1';
    if (course.name.includes('운용기능사')) {
        Icon = Printer;
        color1 = '#0ea5e9';
    } else if (course.name.includes('개발') || course.name.includes('산업기사')) {
        Icon = Cpu;
        color1 = '#10b981';
    } else if (course.name.includes('모델링')) {
        Icon = Box;
        color1 = '#8b5cf6';
    } else if (course.name.includes('기계') || course.name.includes('제도')) {
        Icon = PenTool;
        color1 = '#f59e0b';
    }

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', zIndex: 1100, padding: '1rem'
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'white',
                    borderRadius: '1.5rem',
                    padding: '2.5rem',
                    maxWidth: '700px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    position: 'relative'
                }}
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <X size={20} color="#64748b" />
                </button>

                {/* 헤더 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '1rem',
                        background: `linear-gradient(135deg, ${color1}, ${color1}80)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Icon size={30} color="white" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                            {course.name}
                        </h2>
                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>온라인 CBT 문제은행</span>
                    </div>
                </div>

                {/* 설명 */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                        <FileText size={18} color={color1} /> 과정 소개
                    </h3>
                    <div
                        style={{ color: '#475569', lineHeight: 1.7, background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', overflowX: 'auto' }}
                        dangerouslySetInnerHTML={{ __html: detail.description }}
                    />
                </div>

                {/* 대상 */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                        <Target size={18} color={color1} /> 학습 대상
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {detail.targets.map((t, i) => (
                            <span key={i} style={{
                                padding: '0.5rem 1rem',
                                background: '#f1f5f9',
                                borderRadius: '2rem',
                                fontSize: '0.9rem',
                                color: '#475569'
                            }}>{t}</span>
                        ))}
                    </div>
                </div>

                {/* 특징 */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                        <Award size={18} color={color1} /> 주요 특징
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                        {detail.features.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569' }}>
                                <CheckCircle2 size={16} color="#10b981" />
                                <span>{f}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 이용 방법 */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                        <Clock size={18} color={color1} /> 이용 방법
                    </h3>
                    <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem' }}>
                        {detail.howToUse.map((step, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                marginBottom: i < detail.howToUse.length - 1 ? '0.75rem' : 0,
                                color: '#475569',
                                fontSize: '0.95rem'
                            }}>
                                <span style={{
                                    minWidth: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: color1,
                                    color: 'white',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 600
                                }}>{i + 1}</span>
                                <span>{step.replace(/^\d+\.\s*/, '')}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Agreement Checkbox */}
                <div style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: '0.75rem',
                    border: '2px solid #e2e8f0'
                }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}>
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            style={{
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                accentColor: color1
                            }}
                        />
                        <span style={{
                            fontSize: '0.95rem',
                            color: '#334155',
                            fontWeight: 500
                        }}>
                            위 과정 내용을 확인했으며, 신청에 동의합니다.
                        </span>
                    </label>
                </div>

                {/* 신청 버튼 */}
                <button
                    onClick={() => {
                        onClose();
                        onEnroll(course.id, course.name);
                    }}
                    disabled={!agreed}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        background: agreed ? `linear-gradient(135deg, ${color1}, ${color1}cc)` : '#cbd5e1',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        border: 'none',
                        cursor: agreed ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        opacity: agreed ? 1 : 0.6
                    }}
                    onMouseEnter={(e) => agreed && (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <PlayCircle size={20} /> 과정 신청하기
                </button>
            </motion.div>
        </div>
    );
};
