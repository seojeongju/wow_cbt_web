
import React, { useState, useEffect } from 'react';
import { Settings, Download, Upload, RefreshCw, AlertTriangle, Shield, Power, Sparkles } from 'lucide-react';
import { SettingsService, type SystemSettings } from '../../services/settingsService';

export const SystemSettingsPage = () => {
    const [settings, setSettings] = useState<SystemSettings>({
        requireUserApproval: true,
        allowSelfRegistration: true,
        maintenanceMode: false
    });

    // const [isSaving, setIsSaving] = useState(false); // Unused for now

    const [backupSelection, setBackupSelection] = useState<string[]>([]);

    // Restore State
    const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
    const [restoreStats, setRestoreStats] = useState<any>(null);
    const [restoreSelection, setRestoreSelection] = useState<string[]>([]);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const data = await SettingsService.getSettings();
        setSettings(data);
    };

    const handleToggle = (key: keyof SystemSettings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings); // Optimistic UI update
        SettingsService.updateSettings(newSettings);
    };

    const handleBackup = () => {
        const json = SettingsService.createBackup(backupSelection);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wow_cbt_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const content = evt.target?.result as string;
            const stats = SettingsService.getBackupStats(content);
            if (stats) {
                setRestoreFileContent(content);
                setRestoreStats(stats);
                setRestoreSelection(['users', 'exams', 'history', 'inquiries', 'settings']); // Select all by default
            } else {
                alert('유효하지 않은 백업 파일입니다.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const executeRestore = async () => {
        if (!restoreFileContent || restoreSelection.length === 0) return;

        if (!confirm('🚨 주의: 선택한 항목의 기존 데이터가 덮어씌워집니다. 계속하시겠습니까?')) {
            return;
        }

        const result = await SettingsService.restoreBackup(restoreFileContent, restoreSelection);
        if (result.success) {
            alert(`✅ 복원 완료! (총 ${result.count}개 항목)`);
            window.location.reload();
        } else {
            alert(`❌ 복원 실패: ${result.message}`);
        }
    };

    const handleReset = () => {
        const password = prompt('⚠️ 시스템 전체 초기화\n\n모든 데이터가 영구적으로 삭제됩니다.\n계속하려면 관리자 비밀번호를 입력하세요:');

        if (password === 'wow3d3144') {
            if (confirm('정말로 모든 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!')) {
                localStorage.clear();
                sessionStorage.clear();
                alert('✅ 시스템이 초기화되었습니다.\n로그인 페이지로 이동합니다.');
                window.location.href = '/';
            }
        } else if (password !== null) {
            alert('❌ 비밀번호가 올바르지 않습니다.\n초기화가 취소되었습니다.');
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Settings size={32} color="var(--primary-600)" />
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-800)' }}>시스템 설정</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* 1. Policy Settings */}
                <section className="glass-card" style={{ background: 'white', padding: '2rem', borderRadius: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                        <Shield size={24} color="var(--primary-500)" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>운영 정책 설정</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Require User Approval */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>회원가입 승인제</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                    신규 회원이 가입하면 관리자의 승인을 받아야 로그인할 수 있습니다.
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggle('requireUserApproval')}
                                style={{
                                    position: 'relative',
                                    width: '3.5rem',
                                    height: '2rem',
                                    borderRadius: '9999px',
                                    background: settings.requireUserApproval ? 'var(--primary-500)' : '#cbd5e1',
                                    transition: 'background-color 0.2s',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: '2px',
                                    left: settings.requireUserApproval ? 'calc(100% - 2px - 1.75rem)' : '2px',
                                    width: '1.75rem',
                                    height: '1.75rem',
                                    borderRadius: '50%',
                                    background: 'white',
                                    transition: 'left 0.2s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                }} />
                            </button>
                        </div>

                        {/* Allow Self Registration */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>회원가입 허용</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                    사용자가 스스로 회원가입을 할 수 있도록 허용합니다. (끄면 관리자만 추가 가능)
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggle('allowSelfRegistration')}
                                style={{
                                    position: 'relative',
                                    width: '3.5rem',
                                    height: '2rem',
                                    borderRadius: '9999px',
                                    background: settings.allowSelfRegistration ? 'var(--primary-500)' : '#cbd5e1',
                                    transition: 'background-color 0.2s',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: '2px',
                                    left: settings.allowSelfRegistration ? 'calc(100% - 2px - 1.75rem)' : '2px', // calc fix
                                    width: '1.75rem',
                                    height: '1.75rem',
                                    borderRadius: '50%',
                                    background: 'white',
                                    transition: 'left 0.2s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                }} />
                            </button>
                        </div>

                        {/* Maintenance Mode (Placeholder) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>시스템 점검 모드</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                    일반 사용자의 접속을 차단하고 점검 메시지를 표시합니다. (구현 예정)
                                </div>
                            </div>
                            <div style={{
                                width: '3.5rem',
                                height: '2rem',
                                borderRadius: '9999px',
                                background: '#e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Power size={16} color="#94a3b8" />
                            </div>
                        </div>

                    </div>
                </section>

                {/* 1.5. AI Service Settings */}
                <section className="glass-card" style={{ background: 'white', padding: '2rem', borderRadius: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                        <Sparkles size={24} color="#7c3aed" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AI 서비스 설정</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label className="input-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                OpenAI API Key
                                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b' }}>(전역 설정)</span>
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={settings.openaiApiKey || ''}
                                    onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                                    placeholder="sk-..."
                                    style={{ flex: 1 }}
                                />
                                <button
                                    onClick={() => {
                                        SettingsService.updateSettings(settings);
                                        // Also sync to localStorage for backward compatibility with QuestionManagement
                                        if (settings.openaiApiKey) {
                                            localStorage.setItem('openai_api_key', settings.openaiApiKey);
                                        } else {
                                            localStorage.removeItem('openai_api_key');
                                        }
                                        alert('AI 설정이 저장되었습니다.');
                                    }}
                                    className="btn btn-primary"
                                    style={{ background: '#7c3aed', borderColor: '#7c3aed', whiteSpace: 'nowrap' }}
                                >
                                    저장
                                </button>
                            </div>
                            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                                PDF 파싱 및 유사 문제 생성에 사용됩니다.<br />
                                키는 암호화되어 안전하게 보관됩니다.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 2. Data Management */}
                <section className="glass-card" style={{ background: 'white', padding: '2rem', borderRadius: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                        <RefreshCw size={24} color="var(--primary-500)" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>데이터 관리</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Backup Section */}
                        <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#334155', fontWeight: 600 }}>
                                <Download size={20} /> 데이터 백업
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                                선택한 데이터 항목을 JSON 파일로 백업합니다.
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                                {[
                                    { id: 'users', label: '사용자 정보' },
                                    { id: 'exams', label: '시험 및 문제' },
                                    { id: 'history', label: '시험 기록' },
                                    { id: 'inquiries', label: '문의 내역' },
                                    { id: 'settings', label: '시스템 설정' },
                                ].map((item) => (
                                    <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={backupSelection.includes(item.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setBackupSelection([...backupSelection, item.id]);
                                                else setBackupSelection(backupSelection.filter(id => id !== item.id));
                                            }}
                                        />
                                        {item.label}
                                    </label>
                                ))}
                            </div>

                            <button
                                onClick={handleBackup}
                                disabled={backupSelection.length === 0}
                                className="btn"
                                style={{
                                    background: 'white', border: '1px solid #cbd5e1', width: '100%',
                                    opacity: backupSelection.length === 0 ? 0.5 : 1,
                                    cursor: backupSelection.length === 0 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                선택한 항목 백업하기
                            </button>
                        </div>

                        {/* Restore Section */}
                        <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#334155', fontWeight: 600 }}>
                                <Upload size={20} /> 데이터 복원
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                                백업 파일을 분석하여 선택적으로 데이터를 복원합니다.
                            </p>

                            {!restoreFileContent ? (
                                <label className="btn" style={{ background: 'white', border: '1px solid #cbd5e1', width: '100%', display: 'block', textAlign: 'center', cursor: 'pointer', padding: '0.75rem' }}>
                                    복원할 파일 선택...
                                    <input type="file" accept=".json" onChange={handleRestoreFileSelect} style={{ display: 'none' }} />
                                </label>
                            ) : (
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>
                                        📂 파일 분석 결과:
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                        <div style={{ color: restoreStats?.users ? '#16a34a' : '#94a3b8' }}>• 사용자: {restoreStats?.users || 0}개</div>
                                        <div style={{ color: restoreStats?.exams ? '#16a34a' : '#94a3b8' }}>• 시험/문제: {restoreStats?.exams || 0}개</div>
                                        <div style={{ color: restoreStats?.history ? '#16a34a' : '#94a3b8' }}>• 기록: {restoreStats?.history || 0}개</div>
                                        <div style={{ color: restoreStats?.inquiries ? '#16a34a' : '#94a3b8' }}>• 문의: {restoreStats?.inquiries || 0}개</div>
                                    </div>

                                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>
                                        ⬇️ 복원할 항목 선택:
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                                        {[
                                            { id: 'users', label: '사용자', count: restoreStats?.users },
                                            { id: 'exams', label: '시험/문제', count: restoreStats?.exams },
                                            { id: 'history', label: '기록', count: restoreStats?.history },
                                            { id: 'inquiries', label: '문의', count: restoreStats?.inquiries },
                                            { id: 'settings', label: '설정', count: restoreStats?.settings },
                                        ].filter(item => item.count && item.count > 0).map((item) => (
                                            <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={restoreSelection.includes(item.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setRestoreSelection([...restoreSelection, item.id]);
                                                        else setRestoreSelection(restoreSelection.filter(id => id !== item.id));
                                                    }}
                                                />
                                                {item.label}
                                            </label>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => { setRestoreFileContent(null); setRestoreStats(null); setRestoreSelection([]); }}
                                            style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                                        >
                                            취소
                                        </button>
                                        <button
                                            onClick={executeRestore}
                                            style={{ flex: 2, padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            선택 항목 복원하기
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fecaca', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#991b1b', fontWeight: 600 }}>
                                <AlertTriangle size={20} /> 시스템 초기화
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#991b1b', marginBottom: '1rem' }}>
                                모든 데이터를 영구적으로 삭제하고 초기 상태로 되돌립니다.
                            </p>
                            <button onClick={handleReset} style={{ width: '100%', padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 700, cursor: 'pointer' }}>
                                전체 초기화 실행
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
