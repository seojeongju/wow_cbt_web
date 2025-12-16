import { motion } from 'framer-motion';
import { X, BookOpen, PlusCircle, CheckCircle } from 'lucide-react';
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

const courseDetails: Record<string, CourseDetail> = {
    '3D프린터운용기능사': {
        description: '3D 프린터를 활용하여 제품을 설계하고 출력하는 실무 능력을 평가하는 국가기술자격입니다. 3D 모델링, 슬라이싱, 출력 및 후처리 전반에 걸친 역량을 검증합니다.',
        targets: ['3D 프린터 관련 취업 준비생', '제조업 종사자', '메이커 및 창작자', '기술 교육자'],
        features: ['실제 시험과 동일한 문제 유형', 'AI 기반 오답 분석', '카테고리별 취약점 파악', '무제한 모의고사 응시'],
        howToUse: ['회원가입 후 해당 과정을 신청합니다', '관리자 승인 후 문제풀이가 활성화됩니다', '모의고사를 통해 실전 연습을 합니다', '오답노트로 틀린 문제를 복습합니다', '성적 분석으로 취약 영역을 파악합니다']
    },
    '3D프린터개발산업기사': {
        description: '3D 프린터 시스템의 설계, 개발, 유지보수 능력을 평가하는 중급 기술자격입니다. 하드웨어 구조, 펌웨어, 소재 특성 등 심화 지식을 다룹니다.',
        targets: ['3D 프린터 개발자', '장비 유지보수 엔지니어', '기술 연구원', '기능사 취득 후 상위 자격 준비자'],
        features: ['심화 이론 문제 포함', '실기 대비 핵심 개념', '최신 기출 경향 반영', '전문가 해설 제공'],
        howToUse: ['회원가입 후 해당 과정을 신청합니다', '관리자 승인 후 문제풀이가 활성화됩니다', '이론 문제로 개념을 정리합니다', '모의고사로 실전 감각을 익힙니다', '오답노트로 취약 부분을 보완합니다']
    }
};

const defaultCourseDetail: CourseDetail = {
    description: '체계적인 문제은행과 모의고사를 통해 자격증 취득을 지원하는 온라인 학습 과정입니다.',
    targets: ['해당 분야 취업 준비생', '실무 역량 향상을 원하는 직장인', '자격증 취득을 목표로 하는 분'],
    features: ['실전 모의고사 제공', 'AI 오답 분석', '성적 통계 및 취약점 분석', '언제 어디서나 학습 가능'],
    howToUse: ['회원가입 후 원하는 과정을 신청합니다', '관리자 승인 후 문제풀이가 활성화됩니다', '모의고사를 통해 실력을 점검합니다', '오답노트로 틀린 문제를 복습합니다', '성적 분석을 통해 학습 전략을 세웁니다']
};

export const CourseDetailModal = ({ course, onClose, onEnroll }: CourseDetailModalProps) => {
    const detail = courseDetails[course.name] || defaultCourseDetail;
    const color1 = course.name.includes('프린터') ? '#14b8a6' : '#6366f1';
    const [agreed, setAgreed] = useState(false);

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
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'white', borderRadius: '1.5rem', width: '100%',
                    maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto'
                }}
            >
                <div style={{ padding: '2rem', position: 'relative' }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: '1rem', right: '1rem',
                            background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem'
                        }}
                    >
                        <X size={24} color="#64748b" />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '1rem',
                            background: `linear-gradient(135deg, ${color1}, ${color1}dd)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 8px 16px -4px ${color1}66`, color: 'white'
                        }}>
                            <BookOpen size={30} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                                {course.name}
                            </h2>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>온라인 CBT 문제은행</span>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                            📋 과정 소개
                        </h3>
                        <div style={{
                            color: '#475569', lineHeight: 1.6, background: '#f8fafc',
                            padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem'
                        }}>
                            {detail.description}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                            🎯 학습 대상
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {detail.targets.map((t, i) => (
                                <span key={i} style={{
                                    padding: '0.4rem 0.8rem', background: '#f1f5f9',
                                    borderRadius: '1rem', fontSize: '0.85rem', color: '#475569'
                                }}>{t}</span>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                            ⭐ 주요 특징
                        </h3>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {detail.features.map((f, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    color: '#475569', fontSize: '0.9rem'
                                }}>
                                    <CheckCircle size={16} color="#10b981" />
                                    <span>{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                            📚 이용 방법
                        </h3>
                        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
                            {detail.howToUse.map((step, i) => (
                                <div key={i} style={{
                                    display: 'flex', gap: '0.5rem',
                                    marginBottom: i < detail.howToUse.length - 1 ? '0.5rem' : 0,
                                    color: '#475569', fontSize: '0.85rem'
                                }}>
                                    <span style={{
                                        minWidth: '20px', height: '20px', borderRadius: '50%',
                                        background: color1, color: 'white', fontSize: '0.75rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 600, flexShrink: 0
                                    }}>{i + 1}</span>
                                    <span>{step}</span>
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

                    <button
                        onClick={() => {
                            onClose();
                            onEnroll(course.id, course.name);
                        }}
                        disabled={!agreed}
                        style={{
                            width: '100%', padding: '0.875rem', borderRadius: '0.75rem',
                            background: agreed ? color1 : '#cbd5e1',
                            color: 'white', fontWeight: 700, fontSize: '1rem',
                            border: 'none', cursor: agreed ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            transition: 'all 0.2s',
                            opacity: agreed ? 1 : 0.6
                        }}
                        onMouseEnter={(e) => agreed && (e.currentTarget.style.transform = 'scale(1.02)')}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <PlusCircle size={18} /> 과정 신청하기
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
