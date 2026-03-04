"use client";

import { cn } from '@/lib/utils';
import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    glow?: 'saffron' | 'emerald' | 'sapphire' | 'red' | 'violet' | null;
    padding?: string;
    onClick?: () => void;
}

export default function GlassCard({
    children,
    className,
    glow,
    padding = 'p-6',
    onClick,
}: GlassCardProps) {
    const glowClass = glow ? `glow-${glow}` : '';

    return (
        <div
            onClick={onClick}
            className={cn(
                'glass rounded-3xl transition-all duration-300',
                padding,
                glowClass,
                onClick && 'cursor-pointer hover:bg-white/[0.06] hover:border-white/[0.14]',
                className
            )}
        >
            {children}
        </div>
    );
}
