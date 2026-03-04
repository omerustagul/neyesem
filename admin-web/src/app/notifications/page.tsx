"use client";

import { db } from '@/lib/firebase';
import { cn, ensureDate } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import {
    AlignLeft,
    Bell,
    CheckCircle2,
    Clock,
    History,
    Image as ImageIcon,
    Send,
    Smartphone,
    Type,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface NotificationRecord {
    id: string;
    title: string;
    body: string;
    imageUrl?: string;
    segment: string;
    status: string;
    createdAt: Timestamp;
}

export default function NotificationsPage() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [segment, setSegment] = useState('all');
    const [isSending, setIsSending] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);
    const [history, setHistory] = useState<NotificationRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'admin_notifications'), orderBy('createdAt', 'desc'), limit(10));
            const snap = await getDocs(q);
            const data: NotificationRecord[] = [];
            snap.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() } as NotificationRecord);
            });
            setHistory(data);
        } catch (error) {
            console.error("History fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        try {
            // Log to Firestore
            await addDoc(collection(db, 'admin_notifications'), {
                title,
                body,
                imageUrl,
                segment,
                status: 'Sent',
                createdAt: serverTimestamp()
            });

            // Simulate real sending delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            setIsSending(false);
            setSentSuccess(true);
            setTimeout(() => setSentSuccess(false), 3000);

            // Reset form
            setTitle('');
            setBody('');
            setImageUrl('');

            // Refresh history
            fetchHistory();
        } catch (error) {
            console.error("Send notification error:", error);
            setIsSending(false);
            alert("Bildirim kaydedilirken bir hata oluştu.");
        }
    };

    const getSegmentLabel = (s: string) => {
        switch (s) {
            case 'all': return 'Tüm Kullanıcılar';
            case 'verified': return 'Doğrulanmış Profil';
            case 'levels_10': return 'Level 10+ Şefler';
            case 'inactive': return '3+ Gün Pasifler';
            default: return s;
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Bildirim Merkezi</h1>
                <p className="text-muted-foreground">Kullanıcılara anlık (push) bildirimler gönderin ve gönderim geçmişini takip edin.</p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Composition Form */}
                <div className="rounded-3xl border border-border/40 bg-background p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                            <Bell className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-bold">Yeni Bildirim Oluştur</h2>
                    </div>

                    <form onSubmit={handleSend} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                <Type className="h-4 w-4" /> Bildirim Başlığı
                            </label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Örn: Hafta Sonu Sürprizi! 🎁"
                                className="w-full rounded-xl bg-muted/30 border-none px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                <AlignLeft className="h-4 w-4" /> Bildirim İçeriği
                            </label>
                            <textarea
                                required
                                rows={3}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Kullanıcılara ne söylemek istersiniz?"
                                className="w-full rounded-xl bg-muted/30 border-none px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" /> Görsel URL (Opsiyonel)
                            </label>
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full rounded-xl bg-muted/30 border-none px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                <Users className="h-4 w-4" /> Hedef Kitle (Segmentasyon)
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {['all', 'verified', 'levels_10', 'inactive'].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSegment(s)}
                                        className={cn(
                                            "px-4 py-2.5 rounded-xl border text-xs font-bold transition-all",
                                            segment === s
                                                ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                                                : "bg-background border-border/40 text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        {getSegmentLabel(s)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSending}
                            className={cn(
                                "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl text-sm",
                                sentSuccess
                                    ? "bg-emerald-500 text-white"
                                    : "bg-gradient-to-r from-orange-500 to-red-600 text-white hover:scale-[1.02] active:scale-[0.98]"
                            )}
                        >
                            {isSending ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : sentSuccess ? (
                                <>
                                    <CheckCircle2 className="h-5 w-5" />
                                    Gönderildi!
                                </>
                            ) : (
                                <>
                                    <Send className="h-5 w-5" />
                                    Bildirimi Şimdi Gönder
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Mobile Preview */}
                <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm uppercase tracking-widest text-[10px]">
                        <Smartphone className="h-4 w-4" /> Mobil Önizleme
                    </div>

                    <div className="relative w-[280px] h-[580px] rounded-[3rem] border-[8px] border-zinc-900 bg-zinc-950 shadow-2xl overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-zinc-900 rounded-b-2xl z-20" />
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 opacity-80" />
                        <div className="absolute top-20 left-4 right-4 space-y-2">
                            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top duration-500">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-5 w-5 rounded-md bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                                        <span className="text-[10px] text-white font-black">N</span>
                                    </div>
                                    <span className="text-[10px] text-white/60 font-medium tracking-wide">NEYESEM • ANLIK</span>
                                </div>
                                <h4 className="text-white text-sm font-bold truncate">
                                    {title || 'Bildirim Başlığı'}
                                </h4>
                                <p className="text-white/80 text-xs mt-1 line-clamp-2 leading-relaxed">
                                    {body || 'Bildirim içeriği nasıl görüneceğine dair bir taslak.'}
                                </p>
                                {imageUrl && (
                                    <div className="mt-3 rounded-xl overflow-hidden h-24 border border-white/10">
                                        <img src={imageUrl} className="h-full w-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1 w-20 bg-white/20 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Sent History Table */}
            <div className="rounded-3xl border border-border/40 bg-background overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <History className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-bold">Gönderim Geçmişi</h3>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <th className="px-8 py-4">BAŞLIK / İÇERİK</th>
                                <th className="px-8 py-4">HEDEF KİTLE</th>
                                <th className="px-8 py-4">TARİH</th>
                                <th className="px-8 py-4">DURUM</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-border/40 font-medium">
                            {loading ? (
                                <tr><td colSpan={4} className="px-8 py-10 text-center italic text-muted-foreground">Yükleniyor...</td></tr>
                            ) : history.length === 0 ? (
                                <tr><td colSpan={4} className="px-8 py-10 text-center italic text-muted-foreground">Henüz gönderim yapılmadı.</td></tr>
                            ) : (
                                history.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-8 py-4 min-w-[200px]">
                                            <p className="font-bold truncate max-w-[200px]">{item.title}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.body}</p>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-bold border border-blue-500/20 whitespace-nowrap">
                                                {getSegmentLabel(item.segment)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-muted-foreground text-xs whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5" />
                                                {formatDistanceToNow(ensureDate(item.createdAt), { addSuffix: true, locale: tr })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-2 text-emerald-600 whitespace-nowrap">
                                                <CheckCircle2 className="h-4 w-4" />
                                                <span className="text-xs font-bold">{item.status}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
