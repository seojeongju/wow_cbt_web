import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';

export const CbtGuidePage = () => {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <div style={{ display: 'grid', gap: '1rem' }}>
                <section className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.85rem' }}>CBT필기시험이란?</h1>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '0.8rem', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>CBT(Computer Based Test) 필기시험을 말한다</h2>
                            <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>
                                시험지와 필기구를 사용하는 일반 필기시험과 달리, 컴퓨터 화면으로 문제를 확인하고 마우스/키보드로 답안을 입력하는 방식입니다.
                            </p>
                        </div>
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.85rem', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
                            CBT 화면 예시
                        </div>
                    </div>
                </section>

                <section className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.8rem' }}>한 번에 정리하는 일반 VS CBT 필기시험</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.6rem', alignItems: 'stretch' }}>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.7rem', padding: '0.9rem' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.45rem' }}>일반 필기시험</div>
                            <ul style={{ margin: 0, paddingLeft: '1rem', color: '#475569', lineHeight: 1.8 }}>
                                <li>종이 문제지/컴퓨터용 사인펜 기반</li>
                                <li>답안지 별도 작성</li>
                                <li>오답/수정 흔적 관리 부담</li>
                            </ul>
                        </div>
                        <div style={{ alignSelf: 'center', color: '#94a3b8', fontWeight: 800 }}>VS</div>
                        <div style={{ border: '1px solid #c7d2fe', borderRadius: '0.7rem', padding: '0.9rem', background: '#eef2ff' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.45rem', color: '#4338ca' }}>CBT 필기시험</div>
                            <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4338ca', lineHeight: 1.8 }}>
                                <li>컴퓨터 화면, 마우스/키보드 입력</li>
                                <li>답안 제출 즉시 반영</li>
                                <li>채점 및 결과 확인이 빠름</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.8rem' }}>한 눈에 보는 CBT 시험 응시 절차</h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.9rem' }}>
                            <div style={{ color: '#1d4ed8', fontWeight: 700, marginBottom: '0.5rem' }}>① 시험 전: 수험자 정보 확인 및 안내사항 확인</div>
                            <div style={{ border: '1px solid #bfdbfe', borderRadius: '0.65rem', background: '#f8fafc', padding: '0.8rem', color: '#334155' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                                        01
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#0369a1' }}>수험자 정보 확인</div>
                                        <div style={{ fontSize: '0.92rem', color: '#64748b' }}>신분 확인 절차를 완료한 뒤 시험실 안내에 따라 지정석에 착석합니다.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.9rem' }}>
                            <div style={{ color: '#1d4ed8', fontWeight: 700, marginBottom: '0.5rem' }}>② 시험 중: 문제풀이 및 답안제출</div>
                            <div style={{ border: '1px solid #bfdbfe', borderRadius: '0.65rem', background: '#f8fafc', padding: '0.8rem', color: '#334155' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                                        02
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#4338ca' }}>문항 풀이 및 답안 표기</div>
                                        <div style={{ fontSize: '0.92rem', color: '#64748b' }}>문항 이동과 답안표기를 반복하며, 검토 후 최종 제출 버튼을 클릭합니다.</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '0.65rem', border: '1px dashed #c7d2fe', borderRadius: '0.55rem', padding: '0.55rem', background: 'white', fontSize: '0.86rem', color: '#64748b' }}>
                                    [안내사항] · [풀이설명] · [답안표기] · [답안제출]
                                </div>
                            </div>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.9rem' }}>
                            <div style={{ color: '#1d4ed8', fontWeight: 700, marginBottom: '0.5rem' }}>③ 시험 후: 답안 제출과 동시에 합격여부 확인</div>
                            <div style={{ border: '1px solid #bbf7d0', borderRadius: '0.65rem', background: '#f0fdf4', padding: '0.8rem', color: '#166534' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                                        03
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#166534' }}>채점 결과 확인</div>
                                        <div style={{ fontSize: '0.92rem', color: '#64748b' }}>취득 점수와 합격 여부를 확인하고 부족한 영역은 오답 복습으로 보완합니다.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="glass-card" style={{ background: 'white', padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 800 }}>CBT 필기시험 바로 시작</div>
                            <div style={{ color: '#64748b', fontSize: '0.92rem' }}>실전형 CBT 환경에서 응시하고 기록에서 결과를 확인하세요.</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <button className="btn btn-primary" onClick={() => navigate('/student/cbt/exams')}>
                                CBT 시험 시작하기
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/student/cbt/history')}>
                                CBT 응시 기록
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </MainLayout>
    );
};
