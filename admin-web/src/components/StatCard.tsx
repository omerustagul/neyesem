"use client";

import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface StatCardProps {
    label: string;
    value: number | string;
    suffix?: string;
    trend?: number; // percent change, can be negative
    trendLabel?: string;
    icon: React.ReactNode;
    iconBg?: string;
    glow?: 'saffron' | 'emerald' | 'sapphire' | 'red' | 'violet';
    loading?: boolean;
    delay?: number; // animation delay in ms
}

function useCountUp(target: number, duration = 1200, delay = 0) {
    const [count, setCount] = useState(0);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            const start = performance.now();
            const animate = (now: number) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                // easeOutExpo
                const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                setCount(Math.floor(eased * target));
                if (progress < 1) {
                    frameRef.current = requestAnimationFrame(animate);
                }
            };
            frameRef.current = requestAnimationFrame(animate);
        }, delay);

        return () => {
            clearTimeout(timer);
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [target, duration, delay]);

    return count;
}

export default function StatCard({
    label,
    value,
    suffix = '',
    trend,
    trendLabel,
    icon,
    iconBg = 'bg-white/[0.07]',
    glow,
    loading = false,
    delay = 0,
}: StatCardProps) {
    const numericValue = typeof value === 'number' ? value : parseInt(value as string) || 0;
    const displayCount = useCountUp(numericValue, 1200, delay);

    const displayValue = typeof value === 'number' ? displayCount : value;

    const glowClass = glow ? `glow-${glow}` : '';

    return (
        <div className={cn(
            'glass rounded-3xl p-6 flex flex-col gap-4 transition-all duration-300 hover:bg-white/[0.06] group animate-fade-up',
            glowClass
        )}>
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    <div className="h-10 w-10 rounded-2xl bg-white/10" />
                    <div className="h-8 w-24 rounded-lg bg-white/10" />
                    <div className="h-4 w-32 rounded bg-white/05" />
                </div>
            ) : (
                <>
                    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110', iconBg)}>
                        {icon}
                    </div>

                    <div>
                        <div className="text-3xl font-black tracking-tight text-[var(--text-primary)] font-[Outfit]">
                            {displayValue.toLocaleString()}{suffix}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium">{label}</div>
                    </div>

                    {trend !== undefined && (
                        <div className={cn(
                            'flex items-center gap-1.5 text-xs font-bold',
                            trend >= 0 ? 'text-emerald-400' : 'text-red-400'
                        )}>
                            {trend >= 0
                                ? <TrendingUp className="h-3.5 w-3.5" />
                                : <TrendingDown className="h-3.5 w-3.5" />
                            }
                            <span>{trend >= 0 ? '+' : ''}{trend}%</span>
                            {trendLabel && <span className="text-[var(--text-muted)] font-normal">{trendLabel}</span>}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
