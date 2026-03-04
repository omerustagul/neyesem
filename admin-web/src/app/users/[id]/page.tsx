"use client";

import { db } from '@/lib/firebase';
import { cn, ensureDate } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import {
    AlertTriangle,
    ArrowLeft,
    Award,
    Ban,
    Clapperboard,
    Clock,
    Eye,
    FileVideo,
    Heart,
    Image as ImageIcon,
    MessageCircle,
    RefreshCw,
    ShieldCheck,
    Star,
    Trash2,
    TrendingUp,
    User
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserProfile {
    id: string;
    display_name?: string;
    username?: string;
    avatar_url?: string;
    bio?: string;
    level?: number;
    xp?: number;
    total_xp?: number;
    is_verified?: boolean;
    is_banned?: boolean;
    created_at?: any;
    followers_count?: number;
    following_count?: number;
}

type ContentStatus = 'yayında' | 'süresi dolmuş' | 'silinmiş' | 'arşivlenmiş' | 'gizli';

interface ContentItem {
    id: string;
    type: 'post' | 'story';
    status: ContentStatus;
    thumbnailUrl?: string;
    mediaUrl?: string;
    caption?: string;
    text?: string;
    likesCount?: number;
    commentsCount?: number;
    viewCount?: number;
    createdAt?: any;
    expiresAt?: any;
    is_deleted?: boolean;
    is_archived?: boolean;
}

const STATUS_STYLES: Record<ContentStatus, { label: string; className: string }> = {
    'yayında': { label: '● Yayında', className: 'bg-emerald-500 text-white' },
    'süresi dolmuş': { label: '⏱ Süresi Dolmuş', className: 'bg-amber-500 text-white' },
    'silinmiş': { label: '✕ Silinmiş', className: 'bg-rose-500 text-white' },
    'arşivlenmiş': { label: '◷ Arşivlenmiş', className: 'bg-slate-500 text-white' },
    'gizli': { label: '◎ Gizli', className: 'bg-purple-500 text-white' },
};

function getPostStatus(data: any): ContentStatus {
    if (data.is_deleted || data.deleted_at) return 'silinmiş';
    if (data.is_archived || data.archived_at) return 'arşivlenmiş';
    if (data.visibility === 'private' || data.is_private) return 'gizli';
    return 'yayında';
}

function getStoryStatus(data: any): ContentStatus {
    if (data.is_deleted || data.deleted_at) return 'silinmiş';
    if (data.expiresAt) {
        const expiresAt = ensureDate(data.expiresAt);
        if (expiresAt < new Date()) return 'süresi dolmuş';
    }
    return 'yayında';
}

export default function UserDetailPage() {
    const params = useParams();
    const userId = params.id as string;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'post' | 'story'>('all');

    useEffect(() => {
        fetchUserData();
    }, [userId]);

    const fetchUserData = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            // Fetch profile
            const userRef = doc(db, 'profiles', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setUser({ id: userSnap.id, ...userSnap.data() } as UserProfile);
            }

            // Fetch ALL posts (no limit for admin)
            const postsQuery = query(
                collection(db, 'posts'),
                where('userId', '==', userId),
                orderBy('created_at', 'desc'),
                limit(100)
            );

            // Fetch ALL stories (including expired)
            const storiesQuery = query(
                collection(db, 'stories'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(100)
            );

            const [postsSnap, storiesSnap] = await Promise.all([
                getDocs(postsQuery),
                getDocs(storiesQuery),
            ]);

            const contentItems: ContentItem[] = [];

            postsSnap.docs.forEach(d => {
                const data = d.data();
                contentItems.push({
                    id: d.id,
                    type: 'post',
                    status: getPostStatus(data),
                    thumbnailUrl: data.thumbnail_url,
                    mediaUrl: data.video_url,
                    caption: data.caption,
                    likesCount: data.likes_count ?? 0,
                    commentsCount: data.comments_count ?? 0,
                    viewCount: data.view_count ?? 0,
                    createdAt: data.created_at,
                    is_deleted: data.is_deleted,
                    is_archived: data.is_archived,
                });
            });

            storiesSnap.docs.forEach(d => {
                const data = d.data();
                contentItems.push({
                    id: d.id,
                    type: 'story',
                    status: getStoryStatus(data),
                    thumbnailUrl: data.contentUrl,
                    mediaUrl: data.contentUrl,
                    text: data.text,
                    createdAt: data.createdAt,
                    expiresAt: data.expiresAt,
                    is_deleted: data.is_deleted,
                });
            });

            // Sort by creation date
            contentItems.sort((a, b) =>
                ensureDate(b.createdAt).getTime() - ensureDate(a.createdAt).getTime()
            );

            setContent(contentItems);
        } catch (e) {
            console.error('Error fetching user detail:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'verify' | 'unverify' | 'ban' | 'unban' | 'addXP') => {
        if (!user) return;
        setActionLoading(action);
        try {
            const userRef = doc(db, 'profiles', userId);
            if (action === 'verify') await updateDoc(userRef, { is_verified: true });
            if (action === 'unverify') await updateDoc(userRef, { is_verified: false });
            if (action === 'ban') await updateDoc(userRef, { is_banned: true });
            if (action === 'unban') await updateDoc(userRef, { is_banned: false });
            if (action === 'addXP') await updateDoc(userRef, { xp: (user.xp || 0) + 500, total_xp: (user.total_xp || 0) + 500 });
            const updatedSnap = await getDoc(doc(db, 'profiles', userId));
            if (updatedSnap.exists()) setUser({ id: updatedSnap.id, ...updatedSnap.data() } as UserProfile);
        } catch (e) {
            alert('İşlem başarısız oldu.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteContent = async (item: ContentItem) => {
        const typeLabel = item.type === 'post' ? 'gönderiyi' : 'hikayeyi';
        if (!confirm(`Bu ${typeLabel} kalıcı olarak silmek istediğinize emin misiniz?`)) return;
        const collectionName = item.type === 'post' ? 'posts' : 'stories';
        try {
            await deleteDoc(doc(db, collectionName, item.id));
            setContent(prev => prev.filter(c => c.id !== item.id));
        } catch (e) {
            alert(`${typeLabel} silinemedi.`);
        }
    };

    const filteredContent = content.filter(c =>
        activeFilter === 'all' || c.type === activeFilter
    );

    const postCount = content.filter(c => c.type === 'post').length;
    const storyCount = content.filter(c => c.type === 'story').length;
    const activeCount = content.filter(c => c.status === 'yayında').length;
    const expiredCount = content.filter(c => c.status !== 'yayında').length;

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div className="flex items-center gap-4 animate-pulse">
                    <div className="h-24 w-24 rounded-full bg-muted" />
                    <div className="space-y-2">
                        <div className="h-6 w-48 bg-muted rounded" />
                        <div className="h-4 w-32 bg-muted rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-8 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <User className="h-16 w-16 opacity-30" />
                <p>Kullanıcı bulunamadı.</p>
                <Link href="/users" className="text-orange-600 font-bold text-sm hover:underline">← Kullanıcı Listesi</Link>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/users" className="p-2 rounded-xl border border-border/40 hover:bg-muted transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Kullanıcı Profili</h1>
                    <p className="text-sm text-muted-foreground">Detaylı analiz ve içerik geçmişi</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="rounded-3xl border border-border/40 bg-background p-8">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="relative flex-shrink-0">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.display_name} className="h-24 w-24 rounded-full object-cover border-4 border-orange-500/20" />
                        ) : (
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-4xl font-black text-white border-4 border-orange-500/20">
                                {user.display_name?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                        {user.is_verified && (
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-background">
                                <ShieldCheck className="h-4 w-4 text-white" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h2 className="text-2xl font-black">{user.display_name || 'İsimsiz'}</h2>
                            {user.is_banned && <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">Banlı</span>}
                        </div>
                        <p className="text-muted-foreground text-sm mb-1">@{user.username || 'belirtilmemiş'}</p>
                        {user.bio && <p className="text-sm mt-2 max-w-lg text-foreground/70">{user.bio}</p>}

                        <div className="flex flex-wrap gap-4 mt-4 text-sm">
                            <div className="flex items-center gap-1.5 font-medium">
                                <TrendingUp className="h-4 w-4 text-orange-500" />
                                <span>Seviye <strong>{user.level || 1}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span><strong>{user.xp?.toLocaleString() || 0}</strong> XP</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                                <User className="h-4 w-4 text-blue-500" />
                                <span><strong>{user.followers_count || 0}</strong> Takipçi</span>
                            </div>
                            {user.created_at && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Kayıt: {format(ensureDate(user.created_at), 'dd MMM yyyy', { locale: tr })}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats mini */}
                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:min-w-[140px]">
                        <div className="rounded-2xl bg-muted/40 p-3 text-center">
                            <p className="text-xl font-black">{postCount}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Gönderi</p>
                        </div>
                        <div className="rounded-2xl bg-muted/40 p-3 text-center">
                            <p className="text-xl font-black">{storyCount}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Hikaye</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Actions */}
            <div className="rounded-3xl border border-border/40 bg-background p-6">
                <div className="flex items-center gap-2 mb-5">
                    <div className="p-2 rounded-xl bg-orange-500/10">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-bold">Yönetici Aksiyonları</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => handleAction(user.is_verified ? 'unverify' : 'verify')}
                        disabled={actionLoading !== null}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                            user.is_verified
                                ? "bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100"
                                : "bg-muted text-foreground border border-border/40 hover:bg-muted/80"
                        )}
                    >
                        <ShieldCheck className="h-4 w-4" />
                        {actionLoading === 'verify' || actionLoading === 'unverify' ? 'İşleniyor...' : (user.is_verified ? 'Doğrulamayı Kaldır' : 'Hesabı Doğrula')}
                    </button>
                    <button
                        onClick={() => handleAction('addXP')}
                        disabled={actionLoading !== null}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-all"
                    >
                        <Award className="h-4 w-4" />
                        {actionLoading === 'addXP' ? 'Ekleniyor...' : '+500 XP Ekle'}
                    </button>
                    <button
                        onClick={() => handleAction(user.is_banned ? 'unban' : 'ban')}
                        disabled={actionLoading !== null}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                            user.is_banned
                                ? "bg-muted text-foreground border border-border/40"
                                : "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100"
                        )}
                    >
                        <Ban className="h-4 w-4" />
                        {actionLoading === 'ban' || actionLoading === 'unban' ? 'İşleniyor...' : (user.is_banned ? 'Banı Kaldır' : 'Kullanıcıyı Banla')}
                    </button>
                    <button
                        onClick={fetchUserData}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-muted text-foreground border border-border/40 hover:bg-muted/80 transition-all ml-auto"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Yenile
                    </button>
                </div>
            </div>

            {/* Content History Section */}
            <div>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <div>
                        <h3 className="text-xl font-black flex items-center gap-2">
                            <Clapperboard className="h-5 w-5 text-orange-500" />
                            Tüm İçerik Geçmişi
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {activeCount} aktif &nbsp;·&nbsp; {expiredCount} pasif &nbsp;·&nbsp; toplam {content.length}
                        </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                        {([
                            { key: 'all', label: `Tümü (${content.length})` },
                            { key: 'post', label: `Gönderi (${postCount})` },
                            { key: 'story', label: `Hikaye (${storyCount})` },
                        ] as const).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveFilter(tab.key)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    activeFilter === tab.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredContent.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground bg-background rounded-3xl border border-border/40">
                        <FileVideo className="h-14 w-14 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">Hiç içerik bulunamadı.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {filteredContent.map(item => {
                            const statusStyle = STATUS_STYLES[item.status];
                            return (
                                <div key={`${item.type}-${item.id}`} className="group relative rounded-2xl bg-muted overflow-hidden aspect-[9/16] border border-border/40">
                                    {/* Thumbnail */}
                                    {item.thumbnailUrl ? (
                                        <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-muted/80">
                                            {item.type === 'post'
                                                ? <FileVideo className="h-8 w-8 text-muted-foreground opacity-40" />
                                                : <ImageIcon className="h-8 w-8 text-muted-foreground opacity-40" />
                                            }
                                        </div>
                                    )}

                                    {/* Dimmer overlay for non-live items */}
                                    {item.status !== 'yayında' && (
                                        <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                                    )}

                                    {/* Status Badge (top-right) */}
                                    <div className={cn(
                                        "absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md leading-tight",
                                        statusStyle.className
                                    )}>
                                        {statusStyle.label}
                                    </div>

                                    {/* Type badge (top-left) */}
                                    <div className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-black/60 text-white">
                                        {item.type === 'post' ? '▶ Reel' : '◎ Hikaye'}
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                        {item.type === 'post' && (
                                            <div className="flex items-center gap-2 text-white text-[11px]">
                                                <Heart className="h-3 w-3" /> {item.likesCount}
                                                <MessageCircle className="h-3 w-3 ml-1" /> {item.commentsCount}
                                                <Eye className="h-3 w-3 ml-1" /> {item.viewCount}
                                            </div>
                                        )}
                                        {(item.caption || item.text) && (
                                            <p className="text-white text-[10px] text-center line-clamp-2 px-1">
                                                {item.caption || item.text}
                                            </p>
                                        )}
                                        {item.createdAt && (
                                            <p className="text-white/60 text-[9px]">
                                                {format(ensureDate(item.createdAt), 'dd MMM yy', { locale: tr })}
                                            </p>
                                        )}
                                        {item.type === 'story' && item.expiresAt && (
                                            <p className={cn("text-[9px] font-bold", item.status === 'süresi dolmuş' ? 'text-amber-300' : 'text-white/60')}>
                                                {item.status === 'süresi dolmuş'
                                                    ? `Doldu: ${format(ensureDate(item.expiresAt), 'dd MMM yy HH:mm', { locale: tr })}`
                                                    : `Bitiş: ${format(ensureDate(item.expiresAt), 'HH:mm', { locale: tr })}`
                                                }
                                            </p>
                                        )}
                                        <button
                                            onClick={() => handleDeleteContent(item)}
                                            className="mt-1 flex items-center gap-1 bg-rose-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full hover:bg-rose-600 transition-colors"
                                        >
                                            <Trash2 className="h-3 w-3" /> Sil
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
