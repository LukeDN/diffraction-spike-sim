import { useState, useRef, useEffect } from 'react';

interface Props {
    text: string;
    children: React.ReactNode;
}

export function Tooltip({ text, children }: Props) {
    const [show, setShow] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (show && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPos({ x: rect.left + rect.width / 2, y: rect.top });
        }
    }, [show]);

    return (
        <span
            ref={triggerRef}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
            className="inline-flex items-center gap-1 cursor-help"
            style={{ borderBottom: '1px dotted var(--text-muted)' }}
        >
            {children}
            {show && (
                <div
                    className="fixed z-[100] max-w-[220px] px-2.5 py-1.5 rounded-md text-[10px] leading-tight pointer-events-none animate-in"
                    style={{
                        left: pos.x,
                        top: pos.y - 8,
                        transform: 'translate(-50%, -100%)',
                        backgroundColor: 'var(--bg-panel)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    }}
                >
                    {text}
                </div>
            )}
        </span>
    );
}
