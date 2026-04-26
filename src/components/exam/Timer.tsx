import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
    initialTime: number; // in minutes
    onTimeUp: () => void;
}

export const Timer = ({ initialTime, onTimeUp }: TimerProps) => {
    const [seconds, setSeconds] = useState(initialTime * 60);

    useEffect(() => {
        if (seconds <= 0) {
            onTimeUp();
            return;
        }
        const interval = setInterval(() => setSeconds(s => s - 1), 1000);
        return () => clearInterval(interval);
    }, [seconds, onTimeUp]);

    const fmt = (n: number) => n.toString().padStart(2, '0');
    const mm = fmt(Math.floor(seconds / 60));
    const ss = fmt(seconds % 60);

    // Warning color when less than 5 minutes remain
    const isWarning = seconds < 300;

    return (
        <div
            className={`glass-card flex-center ${isWarning ? 'text-accent' : 'text-primary'}`}
            style={{
                padding: '0.5rem 1rem',
                gap: '0.5rem',
                fontWeight: 700,
                fontSize: '1.25rem',
                border: isWarning ? '1px solid var(--accent-500)' : '1px solid var(--primary-100)'
            }}
        >
            <Clock size={20} />
            <span>{mm}:{ss}</span>
        </div>
    );
};
