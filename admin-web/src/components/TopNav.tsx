"use client";

import { Bell, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
    '/': 'Dashboard',
    '/users': 'Kullanıcı Yönetimi',
    '/moderation': 'İçerik Moderasyonu',
    '/moderation/comments': 'Yorum Akışı',
    '/notifications': 'Bildirim Merkezi',
    '/settings': 'Sistem Ayarları',
};

function getPageTitle(pathname: string): string {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    if (pathname.startsWith('/users/')) return 'Kullanıcı Profili';
    return 'Neyesem Admin';
}

export default function TopNav() {
    const pathname = usePathname();
    const title = getPageTitle(pathname);

    return (
        <header className="flex h-16 shrink-0 items-center justify-between px-8 sticky top-0 z-10"
            style={{
                background: 'rgba(13,13,24,0.8)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* Left: Page Title */}
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-base font-black tracking-tight"
                        style={{
                            fontFamily: 'Outfit, Inter, sans-serif',
                            color: '#f0f0f5',
                        }}
                    >
                        {title}
                    </h1>
                </div>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-sm mx-8">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{ color: 'rgba(255,255,255,0.25)' }}
                    />
                    <input
                        type="text"
                        placeholder="Kullanıcı, gönderi veya rapor ara..."
                        className="w-full rounded-2xl px-10 py-2.5 text-sm outline-none transition-all"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            color: '#f0f0f5',
                            caretColor: '#F59E0B',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.border = '1px solid rgba(245,158,11,0.4)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.08)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <button
                    className="relative h-9 w-9 flex items-center justify-center rounded-xl transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                    }}
                >
                    <Bell className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2"
                        style={{ backgroundColor: '#EF4444', borderColor: '#0d0d18' }}
                    />
                </button>

                {/* Divider */}
                <div className="h-6 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

                {/* Admin Avatar */}
                <button
                    className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold" style={{ color: '#f0f0f5' }}>Admin</span>
                        <span className="text-[10px] font-bold tracking-wider uppercase"
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                        >Süper Yetkili</span>
                    </div>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-black shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
                    >
                        A
                    </div>
                </button>
            </div>
        </header>
    );
}
