"use client";

import { db } from '@/lib/firebase';
import { cn, ensureDate } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Eye,
    FileVideo,
    Heart,
    Layers,
    MessageCircle,
    Play,
    ShieldAlert,
    Trash2,
    User
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface ContentItem {
    id: string;
    userId: string;
    thumbnail_url?: string;
    video_url?: string;
    caption?: string;
    likes_count?: number;
    comments_count?: number;
    view_count?: number;
    created_at: any;
}

interface ReportItem {
    id: string;
    targetId: string;
    targetType: 'post' | 'story' | 'user';
    reason: string;
    reporterId: string;
    status: 'pending' | 'resolved';
    created_at: any;
}

export default function ModerationPage() {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [reports, setReports] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'stories' | 'reports'>('posts');

    useEffect(() => {
        if (activeTab === 'reports') {
            fetchReports();
        } else {
            fetchContent();
        }
    }, [activeTab]);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const collectionName = activeTab === 'posts' ? 'posts' : 'stories';
            const q = query(collection(db, collectionName), orderBy('created_at', 'desc'), limit(50));
            const querySnapshot = await getDocs(q);
            const fetchedContent = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ContentItem[];
            setContent(fetchedContent);
        } catch (error) {
            console.error("Error fetching content:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'reports'), orderBy('created_at', 'desc'), limit(50));
            const snap = await getDocs(q);
            const fetchedReports = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ReportItem[];
            setReports(fetchedReports);
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteContent = async (contentId: string) => {
        if (!window.confirm("Bu içeriği kalıcı olarak silmek istediğinize emin misiniz?")) return;
        try {
            const collectionName = activeTab === 'posts' ? 'posts' : 'stories';
            await deleteDoc(doc(db, collectionName, contentId));
            setContent((prev: ContentItem[]) => prev.filter((p: ContentItem) => p.id !== contentId));
        } catch (error) {
            alert("Hata: İçerik silinemedi.");
        }
    };

    const handleResolveReport = async (reportId: string, action: 'dismiss' | 'ban') => {
        try {
            if (action === 'ban') {
                const report = reports.find((r: ReportItem) => r.id === reportId);
                if (report) {
                    // Delete the actual content
                    const collectionName = report.targetType === 'post' ? 'posts' : (report.targetType === 'story' ? 'stories' : 'profiles');
                    await deleteDoc(doc(db, collectionName, report.targetId));
                }
            }
            // Delete the report record
            await deleteDoc(doc(db, 'reports', reportId));
            setReports((prev: ReportItem[]) => prev.filter((r: ReportItem) => r.id !== reportId));
        } catch (error) {
            alert("Hata: İşlem gerçekleştirilemedi.");
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col gap-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold tracking-tight">İçerik Moderasyonu</h1>
                <p className="text-muted-foreground">Uygulamadaki tüm görsel ve video içerikleri denetleyin.</p>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-muted rounded-2xl w-fit self-center sm:self-start overflow-x-auto max-w-full">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === 'posts' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <FileVideo className="h-4 w-4" />
                    Gönderiler
                </button>
                <button
                    onClick={() => setActiveTab('stories')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === 'stories' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Layers className="h-4 w-4" />
                    Hikayeler
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                        activeTab === 'reports' ? "bg-background text-rose-500 shadow-sm" : "text-muted-foreground hover:text-rose-400"
                    )}
                >
                    <ShieldAlert className="h-4 w-4" />
                    Şikayetler
                    {reports.length > 0 && <span className="ml-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-[9/16] bg-muted animate-pulse rounded-3xl" />
                    ))}
                </div>
            ) : activeTab === 'reports' ? (
                /* Reports List */
                <div className="space-y-4">
                    {reports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed border-border/40">
                            <CheckCircle className="h-12 w-12 mb-4 opacity-20 text-emerald-500" />
                            <p className="font-medium text-lg text-emerald-600/60">Tebrikler! Aktif şikayet bulunmuyor.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {reports.map((report) => (
                                <div key={report.id} className="bg-background border border-border/40 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600">
                                            <ShieldAlert className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-lg">İçerik Şikayeti</h4>
                                                <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-black uppercase text-muted-foreground border border-border/40">
                                                    {report.targetType}
                                                </span>
                                            </div>
                                            <p className="text-sm text-rose-500 font-bold mt-1">Neden: {report.reason}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1 font-mono"><User className="h-3 w-3" /> {report.targetId.substring(0, 10)}...</span>
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDistanceToNow(ensureDate(report.created_at), { locale: tr, addSuffix: true })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <button
                                            onClick={() => handleResolveReport(report.id, 'dismiss')}
                                            className="flex-1 md:flex-none px-4 py-2 text-xs font-bold border border-emerald-500/30 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="h-4 w-4" /> Temizle
                                        </button>
                                        <button
                                            onClick={() => handleResolveReport(report.id, 'ban')}
                                            className="flex-1 md:flex-none px-4 py-2 text-xs font-bold bg-rose-500 text-white rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" /> İçeriği Kaldır
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : content.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed border-border/40">
                    <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-medium text-lg text-foreground/40">İçerik bulunamadı.</p>
                </div>
            ) : (
                /* Posts/Stories Grid */
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {content.map((item) => (
                        <div key={item.id} className="group relative aspect-[9/16] rounded-3xl bg-black overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10" />
                            {item.thumbnail_url ? (
                                <img src={item.thumbnail_url} className="h-full w-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-zinc-900">
                                    <Play className="h-12 w-12 text-zinc-700" />
                                </div>
                            )}

                            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
                                <div className="flex items-center gap-2 p-1 pr-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 max-w-[80%]">
                                    <div className="h-6 w-6 rounded-full bg-orange-500 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden">
                                        <User className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-[10px] text-white font-bold truncate">@{item.userId?.substring(0, 6)}...</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteContent(item.id)}
                                    className="p-2 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="absolute bottom-6 left-6 right-6 z-20 space-y-3">
                                <p className="text-white text-xs font-medium line-clamp-2 leading-relaxed opacity-90">
                                    {item.caption || 'Açıklama yok.'}
                                </p>
                                <div className="flex items-center justify-between text-white/70">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <Eye className="h-3 w-3" />
                                            <span className="text-[10px] font-bold">{item.view_count || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Heart className="h-3 w-3" />
                                            <span className="text-[10px] font-bold">{item.likes_count || 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageCircle className="h-3 w-3" />
                                        <span className="text-[10px] font-bold">{item.comments_count || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
