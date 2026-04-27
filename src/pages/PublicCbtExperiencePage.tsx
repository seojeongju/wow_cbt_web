import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';

export const PublicCbtExperiencePage = () => {
    const navigate = useNavigate();
    const [entryMode, setEntryMode] = useState<'guided' | 'direct'>('guided');

    return (
        <MainLayout>
            <div style={{
                maxWidth: '980px',
                margin: '0 auto',
                background: 'linear-gradient(180deg, #2f66a6 0%, #2a5e9a 100%)',
                borderRadius: '1.2rem',
                padding: '0.9rem',
                boxShadow: '0 16px 32px rgba(30,58,138,0.22)'
            }}>
                <div style={{
                    background: '#d7e5f6',
                    borderRadius: '0.95rem',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.35)'
                }}>
                    <div style={{
                        textAlign: 'center',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '2rem',
                        letterSpacing: '-0.02em',
                        padding: '1.35rem 1rem',
                        background: 'linear-gradient(90deg, #2d66a9 0%, #3a76bb 100%)'
                    }}>
                        자격검정 CBT 웹체험 서비스 안내
                    </div>

                    <div style={{ padding: '2.5rem 1.5rem 2rem', background: 'linear-gradient(180deg, #e8edf5 0%, #f4f6f9 100%)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            <div style={{
                                display: 'inline-flex',
                                border: '1px solid #bfdbfe',
                                background: 'white',
                                borderRadius: '999px',
                                padding: '0.25rem'
                            }}>
                                <button
                                    onClick={() => setEntryMode('guided')}
                                    style={{
                                        border: 'none',
                                        borderRadius: '999px',
                                        padding: '0.45rem 0.95rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: entryMode === 'guided' ? '#1d4ed8' : 'transparent',
                                        color: entryMode === 'guided' ? 'white' : '#334155'
                                    }}
                                >
                                    안내 후 시작
                                </button>
                                <button
                                    onClick={() => setEntryMode('direct')}
                                    style={{
                                        border: 'none',
                                        borderRadius: '999px',
                                        padding: '0.45rem 0.95rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: entryMode === 'direct' ? '#1d4ed8' : 'transparent',
                                        color: entryMode === 'direct' ? 'white' : '#334155'
                                    }}
                                >
                                    바로 로그인
                                </button>
                            </div>
                        </div>

                        <div style={{
                            maxWidth: '760px',
                            margin: '0 auto',
                            background: 'white',
                            borderRadius: '1rem',
                            padding: '2rem 1.4rem',
                            textAlign: 'center',
                            boxShadow: '0 6px 20px rgba(15,23,42,0.08)'
                        }}>
                            <p style={{ fontSize: '1.9rem', fontWeight: 700, color: '#345b89', lineHeight: 1.45, margin: 0 }}>
                                웹체험 서비스는 실제 컴퓨터 필기 자격시험 환경과 동일하게 구성하여
                                누구나 쉽게 자격검정 CBT(컴퓨터 기반 시험)을 볼 수 있도록 하는
                                가상 체험 서비스입니다.
                            </p>
                            <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '1.25rem', lineHeight: 1.6 }}>
                                WOW3D-CBT에서는 실전형 CBT 화면과 응시 절차를 체험할 수 있으며,
                                실제 응시는 로그인 후 진행할 수 있습니다.
                            </p>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <button
                                onClick={() => navigate(entryMode === 'guided' ? '/cbt-intro' : '/login')}
                                style={{
                                    minWidth: '430px',
                                    maxWidth: '100%',
                                    borderRadius: '999px',
                                    padding: '0.95rem 1.5rem',
                                    border: '2px solid #2f6fa9',
                                    background: 'linear-gradient(180deg, #1fb2c8 0%, #0f93ad 100%)',
                                    color: 'white',
                                    fontSize: '2rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    boxShadow: '0 6px 12px rgba(15,23,42,0.2)'
                                }}
                            >
                                {entryMode === 'guided'
                                    ? 'CBT 필기 자격시험 체험하기'
                                    : '로그인 후 CBT 응시하기'}
                            </button>
                        </div>
                    </div>

                    <div style={{ background: '#dee4ec', textAlign: 'center', padding: '1rem 1rem 1.35rem' }}>
                        <span style={{
                            display: 'inline-block',
                            background: '#b6c0cc',
                            color: 'white',
                            borderRadius: '999px',
                            padding: '0.35rem 1.2rem',
                            fontWeight: 700,
                            marginBottom: '0.55rem',
                            fontSize: '1.1rem'
                        }}>
                            CBT 시험종목
                        </span>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.92rem' }}>
                            정보기기운용기능사, 정보처리기능사, 굴삭기운전기능사, 지게차운전기능사, 제과기능사,
                            제빵기능사 등 CBT 기반 필기시험 체험 가능
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};
