"use client";

import { cn } from '@/lib/utils';
import {
    Bell,
    ChevronRight,
    FileVideo,
    LayoutDashboard,
    MessageCircle,
    Settings,
    Shield,
    Users,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navSections = [
    {
        title: 'GENEL',
        items: [
            { name: 'Dashboard', href: '/', icon: LayoutDashboard, color: '#F59E0B' },
            { name: 'Kullanıcılar', href: '/users', icon: Users, color: '#3B82F6' },
        ]
    },
    {
        title: 'MODERASYON',
        items: [
            { name: 'İçerik', href: '/moderation', icon: FileVideo, color: '#8B5CF6' },
            { name: 'Yorumlar', href: '/moderation/comments', icon: MessageCircle, color: '#EC4899' },
            { name: 'Bildirimler', href: '/notifications', icon: Bell, color: '#F59E0B' },
        ]
    },
    {
        title: 'YÖNETİM',
        items: [
            { name: 'Sistem Ayarları', href: '/settings', icon: Settings, color: '#10B981' },
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col shrink-0"
            style={{
                background: 'rgba(255,255,255,0.025)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderRight: '1px solid rgba(255,255,255,0.07)',
            }}
        >
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center gap-3 px-6"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                    style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
                >
                    <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                    <div className="text-base font-black tracking-tight"
                        style={{
                            fontFamily: 'Outfit, Inter, sans-serif',
                            background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        neyesem
                    </div>
                    <div className="text-[10px] font-bold tracking-widest uppercase"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                        Admin Pro
                    </div>
                </div>
                {/* Live indicator */}
                <div className="ml-auto flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-glow-pulse" />
                </div>
            </div>

            {/* Nav */}
            <nav className="flex flex-1 flex-col px-3 py-4 gap-5 overflow-y-auto">
                {navSections.map((section) => (
                    <div key={section.title}>
                        <p className="px-3 mb-2 text-[10px] font-black tracking-widest uppercase"
                            style={{ color: 'rgba(255,255,255,0.2)' }}
                        >
                            {section.title}
                        </p>
                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                const isActive = item.href === '/'
                                    ? pathname === '/'
                                    : pathname.startsWith(item.href);

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            'group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                                        )}
                                        style={{
                                            background: isActive
                                                ? `linear-gradient(90deg, ${item.color}22, transparent)`
                                                : 'transparent',
                                            borderLeft: isActive
                                                ? `2px solid ${item.color}`
                                                : '2px solid transparent',
                                            color: isActive
                                                ? '#f0f0f5'
                                                : 'rgba(240,240,245,0.45)',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                e.currentTarget.style.color = '#f0f0f5';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = 'rgba(240,240,245,0.45)';
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
                                                style={{ background: isActive ? `${item.color}20` : 'rgba(255,255,255,0.05)' }}
                                            >
                                                <item.icon className="h-4 w-4"
                                                    style={{ color: isActive ? item.color : 'rgba(240,240,245,0.4)' }}
                                                />
                                            </div>
                                            {item.name}
                                        </div>
                                        {isActive && (
                                            <ChevronRight className="h-3.5 w-3.5 opacity-50"
                                                style={{ color: item.color }}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="rounded-2xl p-3 flex items-center gap-3"
                    style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
                    >
                        <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: '#f0f0f5' }}>Süper Admin</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Çevrimiçi</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
