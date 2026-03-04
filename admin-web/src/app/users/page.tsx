"use client";

import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Filter,
    Search,
    ShieldCheck,
    UserCheck,
    UserX
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const q = query(collection(db, 'profiles'), orderBy('level', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedUsers = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as UserProfile[];
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleVerification = async (userId: string, currentStatus: boolean) => {
        try {
            const userRef = doc(db, 'profiles', userId);
            await updateDoc(userRef, { is_verified: !currentStatus });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: !currentStatus } : u));
        } catch (error) {
            alert("Hata: Doğrulama durumu güncellenemedi.");
        }
    };

    const filteredUsers = users.filter(user =>
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm mt-0.5" style={{ color: 'rgba(240,240,245,0.4)' }}>
                        {filteredUsers.length} kullanıcı bulundu
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                            style={{ color: 'rgba(255,255,255,0.25)' }}
                        />
                        <input
                            type="text"
                            placeholder="İsim veya kullanıcı adı..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64 rounded-2xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#f0f0f5',
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.border = '1px solid rgba(245,158,11,0.4)';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.08)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(240,240,245,0.6)',
                        }}
                    >
                        <Filter className="h-4 w-4" />
                        Filtrele
                    </button>
                </div>
            </div>

            <div className="rounded-3xl overflow-hidden"
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {['Profil', 'Kullanıcı Adı', 'Seviye', 'Durum', 'İşlemler'].map((h, i) => (
                                    <th key={h} className={cn(
                                        "px-6 py-4 text-[10px] font-black uppercase tracking-wider",
                                        i === 0 && 'text-center',
                                        i === 2 && 'text-center',
                                        i === 4 && 'text-right',
                                    )}
                                        style={{ color: 'rgba(255,255,255,0.25)' }}
                                    >{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i} className="animate-pulse" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td className="px-6 py-4"><div className="h-10 w-10 rounded-full mx-auto" style={{ background: 'rgba(255,255,255,0.07)' }} /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-10 rounded mx-auto" style={{ background: 'rgba(255,255,255,0.07)' }} /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} /></td>
                                        <td className="px-6 py-4"><div className="h-8 w-8 rounded ml-auto" style={{ background: 'rgba(255,255,255,0.07)' }} /></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-sm"
                                        style={{ color: 'rgba(255,255,255,0.2)' }}
                                    >Kullanıcı bulunamadı.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group transition-colors duration-150"
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex justify-center">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt={user.display_name}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        style={{ border: '2px solid rgba(245,158,11,0.3)' }}
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-black text-white"
                                                        style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
                                                    >
                                                        {user.display_name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-bold" style={{ color: '#f0f0f5' }}>{user.display_name}</span>
                                                    {user.is_verified && <ShieldCheck className="h-3.5 w-3.5" style={{ color: '#3B82F6' }} />}
                                                </div>
                                                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>@{user.username || 'isimsiz'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold"
                                                style={{
                                                    background: (user.level || 1) >= 10
                                                        ? 'rgba(245,158,11,0.15)'
                                                        : 'rgba(255,255,255,0.06)',
                                                    color: (user.level || 1) >= 10
                                                        ? '#F59E0B'
                                                        : 'rgba(255,255,255,0.4)',
                                                    border: `1px solid ${(user.level || 1) >= 10 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.07)'}`,
                                                }}
                                            >
                                                Lv. {user.level || 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                                                style={{
                                                    background: 'rgba(16,185,129,0.1)',
                                                    color: '#10B981',
                                                    border: '1px solid rgba(16,185,129,0.2)',
                                                }}
                                            >
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                Aktif
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/users/${user.id}`}
                                                    className="p-2 rounded-xl transition-all"
                                                    style={{
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid rgba(255,255,255,0.07)',
                                                        color: 'rgba(255,255,255,0.5)',
                                                    }}
                                                    title="Profili Görüntüle"
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(245,158,11,0.1)';
                                                        e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)';
                                                        e.currentTarget.style.color = '#F59E0B';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                                                        e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                                                    }}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => toggleVerification(user.id, user.is_verified)}
                                                    className="p-2 rounded-xl transition-all"
                                                    title={user.is_verified ? "Doğrulamayı Kaldır" : "Doğrula"}
                                                    style={{
                                                        background: user.is_verified ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
                                                        border: `1px solid ${user.is_verified ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.07)'}`,
                                                        color: user.is_verified ? '#3B82F6' : 'rgba(255,255,255,0.5)',
                                                    }}
                                                >
                                                    <UserCheck className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="p-2 rounded-xl transition-all"
                                                    title="Banla"
                                                    style={{
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid rgba(255,255,255,0.07)',
                                                        color: 'rgba(255,255,255,0.5)',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                                                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                                                        e.currentTarget.style.color = '#EF4444';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                                                        e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                                                    }}
                                                >
                                                    <UserX className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredUsers.length > 0 && (
                    <div className="px-6 py-4 flex items-center justify-between"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            Toplam {filteredUsers.length} sonuç
                        </p>
                        <div className="flex items-center gap-2">
                            <button disabled className="p-1.5 rounded-xl opacity-30 transition-all"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button className="h-8 w-8 rounded-xl text-xs font-bold"
                                style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', color: '#fff' }}
                            >1</button>
                            <button className="p-1.5 rounded-xl transition-all"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

