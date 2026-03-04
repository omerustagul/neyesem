"use client";

import { db } from '@/lib/firebase';
import { cn, ensureDate } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query
} from 'firebase/firestore';
import {
    Clock,
    MessageCircle,
    RefreshCw,
    Search,
    Trash2,
    User
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Comment {
    id: string;
    postId: string;
    userId: string;
    text: string;
    likes_count?: number;
    created_at?: any;
}

export default function CommentsModeratorPage() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'comments'), orderBy('created_at', 'desc'), limit(100));
            const snap = await getDocs(q);
            setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));
        } catch (e) {
            console.error('Error fetching comments:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchComments(); }, []);

    const filteredComments = comments.filter(c =>
        c.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.userId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (commentId: string, postId: string) => {
        setDeletingId(commentId);
        try {
            // Delete from nested collection if structure is posts/{postId}/comments/{commentId}
            await deleteDoc(doc(db, 'comments', commentId));
            setComments(prev => prev.filter(c => c.id !== commentId));
            setSelectedIds(prev => { const s = new Set(prev); s.delete(commentId); return s; });
        } catch (e) {
            // Try nested path
            try {
                await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
                setComments(prev => prev.filter(c => c.id !== commentId));
            } catch {
                alert('Yorum silinemedi.');
            }
        } finally {
            setDeletingId(null);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const s = new Set(prev);
            if (s.has(id)) s.delete(id); else s.add(id);
            return s;
        });
    };

    const handleBulkDelete = async () => {
        if (!confirm(`${selectedIds.size} yorumu silmek istediğinize emin misiniz?`)) return;
        setBulkDeleting(true);
        const toDelete = Array.from(selectedIds);
        for (const id of toDelete) {
            const comment = comments.find(c => c.id === id);
            if (comment) {
                try { await deleteDoc(doc(db, 'comments', id)); } catch { }
            }
        }
        setComments(prev => prev.filter(c => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
        setBulkDeleting(false);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-2xl bg-indigo-500/10">
                        <MessageCircle className="h-7 w-7 text-indigo-500" />
                    </div>
                    Yorum Akışı
                </h1>
                <p className="text-muted-foreground">Tüm uygulamadaki yorumları canlı olarak görüntüleyin ve denetleyin.</p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Yorum veya kullanıcı ara..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl bg-background border border-border/40 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={bulkDeleting}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                            {bulkDeleting ? 'Siliniyor...' : `${selectedIds.size} Yorumu Sil`}
                        </button>
                    )}
                    <button
                        onClick={fetchComments}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/40 bg-background text-sm font-medium hover:bg-muted transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Yenile
                    </button>
                </div>
            </div>

            {/* Comments List */}
            <div className="rounded-3xl border border-border/40 bg-background overflow-hidden shadow-sm">
                {loading ? (
                    <div className="space-y-0 divide-y divide-border/40">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center gap-4 p-5 animate-pulse">
                                <div className="h-5 w-5 rounded bg-muted" />
                                <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/4 bg-muted rounded" />
                                    <div className="h-4 w-3/4 bg-muted rounded" />
                                    <div className="h-2 w-1/6 bg-muted rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredComments.length === 0 ? (
                    <div className="text-center py-24 text-muted-foreground">
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className="font-medium">Yorum bulunamadı.</p>
                        <p className="text-sm mt-1">Arama teriminizi değiştirmeyi deneyin veya veritabanı yapısını kontrol edin.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/40">
                        {filteredComments.map(comment => (
                            <div
                                key={comment.id}
                                className={cn(
                                    "flex items-start gap-4 p-5 transition-colors",
                                    selectedIds.has(comment.id) ? "bg-rose-500/5" : "hover:bg-muted/20"
                                )}
                            >
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(comment.id)}
                                    onChange={() => toggleSelect(comment.id)}
                                    className="mt-1 h-4 w-4 rounded accent-rose-500 cursor-pointer flex-shrink-0"
                                />

                                {/* Avatar */}
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                                    <User className="h-5 w-5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black text-muted-foreground font-mono">{comment.userId?.substring(0, 10)}...</span>
                                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-bold">
                                            Post: {comment.postId?.substring(0, 8)}...
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-foreground leading-relaxed">{comment.text}</p>
                                    <p className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(ensureDate(comment.created_at), { addSuffix: true, locale: tr })}
                                    </p>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDelete(comment.id, comment.postId)}
                                    disabled={deletingId === comment.id}
                                    className="flex-shrink-0 p-2 rounded-xl border border-transparent text-muted-foreground hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
                                    title="Yorumu Sil"
                                >
                                    {deletingId === comment.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && filteredComments.length > 0 && (
                    <div className="px-5 py-3 border-t border-border/40 bg-muted/10 text-xs text-muted-foreground font-medium flex items-center justify-between">
                        <span>{filteredComments.length} yorum listeleniyor</span>
                        {selectedIds.size > 0 && <span className="text-rose-500 font-bold">{selectedIds.size} seçili</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
