import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';

export const PublicCbtIntroPage = () => {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <div style={{ maxWidth: '980px', margin: '0 auto', display: 'grid', gap: '1rem' }}>
                <section className="glass-card" style={{ background: 'white', padding: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>CBT필기시험이란?</h1>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                            CBT(Computer Based Test) 필기시험을 말한다
                        </h2>
                        <p style={{ color: '#475569', lineHeight: 1.7, margin: 0 }}>
                            시험지와 필기구로 응시하는 일반 필기시험과 달리, 컴퓨터 화면으로 시험문제를 확인하고
                            마우스 클릭으로 답안을 선택하는 방식입니다. 수험자의 답안은 실시간으로 저장되어
                            안정적인 시험 진행이 가능합니다.
                        </p>
                    </div>
                </section>

                <section className="glass-card" style={{ background: 'white', padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>한 번에 정리하는 일반 VS CBT 필기시험</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>일반 필기시험</div>
                            <ul style={{ margin: 0, paddingLeft: '1rem', color: '#475569', lineHeight: 1.8 }}>
                                <li>종이 문제지/컴퓨터용 사인펜 기반</li>
                                <li>답안지 분리 작성</li>
                                <li>수정 및 오기입 관리 부담</li>
                                <li>채점 결과 확인까지 시간 소요</li>
                            </ul>
                        </div>
                        <div style={{ border: '1px solid #c7d2fe', borderRadius: '0.75rem', padding: '1rem', background: '#eef2ff' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#4f46e5' }}>CBT 필기시험</div>
                            <ul style={{ margin: 0, paddingLeft: '1rem', color: '#4338ca', lineHeight: 1.8 }}>
                                <li>컴퓨터 화면/마우스 클릭 기반</li>
                                <li>답안 저장 즉시 반영</li>
                                <li>수험자별 대기 시간/환경 유연 대응</li>
                                <li>채점 및 결과 확인이 빠름</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="glass-card" style={{ background: 'white', padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>한 눈에 보는 CBT 시험 응시 절차</h3>
                    <div style={{ display: 'grid', gap: '0.9rem' }}>
                        <div style={{ border: '1px solid #c7d2fe', borderRadius: '0.75rem', padding: '1rem', background: '#f8fafc' }}>
                            <div style={{ fontWeight: 700, color: '#4338ca', marginBottom: '0.65rem' }}>① 시험 전: 수험자 정보확인 및 안내사항 확인</div>
                            <div style={{ border: '1px solid #bfdbfe', background: 'white', borderRadius: '0.65rem', padding: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                        01
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#0369a1' }}>수험자 정보 확인</div>
                                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>신분확인 절차 후 시험실 안내에 따라 순서대로 입실합니다.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', background: '#f8fafc' }}>
                            <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.65rem' }}>② 응시 시작: 문제풀이 및 답안 선택</div>
                            <div style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: '0.65rem', padding: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                        02
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#4338ca' }}>문항별 답안 선택</div>
                                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>문항 이동/마킹 상태를 확인하며 제한 시간 내 문제를 풉니다.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', background: '#f8fafc' }}>
                            <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.65rem' }}>③ 답안 검토: 미응답 문항 최종 점검</div>
                            <div style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: '0.65rem', padding: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                        03
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#b45309' }}>검토 화면 점검</div>
                                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>미응답/체크 문항을 확인하고 필요한 답안 수정을 진행합니다.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '1rem', background: '#f0fdf4' }}>
                            <div style={{ fontWeight: 700, color: '#166534', marginBottom: '0.65rem' }}>④ 제출 완료: 채점 및 결과 확인</div>
                            <div style={{ border: '1px solid #bbf7d0', background: 'white', borderRadius: '0.65rem', padding: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                        04
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#166534' }}>결과 확인 및 복습</div>
                                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>응시 결과를 확인하고 오답 복습으로 취약 영역을 보완합니다.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="glass-card" style={{ background: 'white', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>WOW3D-CBT에서 실전형 CBT를 바로 시작하세요</div>
                            <div style={{ color: '#64748b', marginTop: '0.2rem' }}>로그인 후 응시 가능하며, 계정이 없다면 회원가입 후 이용할 수 있습니다.</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <button className="btn btn-primary" onClick={() => navigate('/login')}>
                                로그인
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/register')}>
                                회원가입
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </MainLayout>
    );
};
