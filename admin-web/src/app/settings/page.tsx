"use client";

import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import {
    Bell,
    CheckCircle,
    Construction,
    RefreshCw,
    Save,
    Settings,
    Sliders,
    Star,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AppConfig {
    maintenance_mode: boolean;
    maintenance_message: string;
    xp_multiplier: number;
    new_post_xp: number;
    daily_login_xp: number;
    comment_xp: number;
    like_xp: number;
    feature_mood_enabled: boolean;
    feature_stories_enabled: boolean;
    feature_leaderboard_enabled: boolean;
    min_level_for_reel: number;
    max_video_duration_seconds: number;
    app_announcement?: string;
    updated_at?: any;
}

const DEFAULT_CONFIG: AppConfig = {
    maintenance_mode: false,
    maintenance_message: 'Uygulama bakım modunda. Lütfen daha sonra tekrar deneyin.',
    xp_multiplier: 1,
    new_post_xp: 100,
    daily_login_xp: 20,
    comment_xp: 10,
    like_xp: 2,
    feature_mood_enabled: true,
    feature_stories_enabled: true,
    feature_leaderboard_enabled: true,
    min_level_for_reel: 3,
    max_video_duration_seconds: 60,
    app_announcement: '',
};

export default function SettingsPage() {
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const CONFIG_DOC = 'system_config';
    const CONFIG_COLLECTION = 'app_config';

    useEffect(() => {
        async function fetchConfig() {
            try {
                const ref = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    setConfig({ ...DEFAULT_CONFIG, ...snap.data() } as AppConfig);
                } else {
                    // Initialize with defaults
                    await setDoc(ref, { ...DEFAULT_CONFIG, updated_at: serverTimestamp() });
                }
            } catch (e) {
                console.error('Error fetching config:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const ref = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
            await setDoc(ref, { ...config, updated_at: serverTimestamp() }, { merge: true });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            alert('Ayarlar kaydedilemedi.');
        } finally {
            setSaving(false);
        }
    };

    const update = (key: keyof AppConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
        </div>
    );

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 rounded-2xl bg-orange-500/10">
                            <Settings className="h-7 w-7 text-orange-500" />
                        </div>
                        Sistem Ayarları
                    </h1>
                    <p className="text-muted-foreground">Tüm değişiklikler mobil uygulamaya anında yansır.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg",
                        saved ? "bg-emerald-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"
                    )}
                >
                    {saved ? <CheckCircle className="h-4 w-4" /> : saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saved ? 'Kaydedildi!' : saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>

            {/* Maintenance Mode */}
            <Section icon={<Construction className="h-5 w-5 text-rose-500" />} title="Bakım Modu" titleColor="text-rose-500" bg="bg-rose-500/5 border-rose-200/40">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border/40">
                        <div>
                            <p className="font-bold">Bakım Modunu Aktif Et</p>
                            <p className="text-sm text-muted-foreground">Aktif olduğunda kullanıcılar uygulamaya giremez.</p>
                        </div>
                        <button
                            onClick={() => update('maintenance_mode', !config.maintenance_mode)}
                            className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                config.maintenance_mode ? "bg-rose-500" : "bg-muted"
                            )}
                        >
                            <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform", config.maintenance_mode ? "translate-x-6" : "translate-x-1")} />
                        </button>
                    </div>
                    {config.maintenance_mode && (
                        <div>
                            <label className="text-sm font-bold text-muted-foreground mb-1.5 block">Bakım Mesajı</label>
                            <textarea
                                value={config.maintenance_message}
                                onChange={e => update('maintenance_message', e.target.value)}
                                className="w-full rounded-xl bg-background border border-border/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
                                rows={2}
                            />
                        </div>
                    )}
                </div>
            </Section>

            {/* Announcement Banner */}
            <Section icon={<Bell className="h-5 w-5 text-blue-500" />} title="Duyuru Mesajı" titleColor="text-blue-500" bg="bg-blue-500/5 border-blue-200/40">
                <div>
                    <label className="text-sm font-bold text-muted-foreground mb-1.5 block">Uygulama İçi Duyuru (Boş bırakırsanız gösterilmez)</label>
                    <input
                        type="text"
                        value={config.app_announcement || ''}
                        onChange={e => update('app_announcement', e.target.value)}
                        placeholder="Örn: 🎉 Büyük güncelleme geldi! Yeni özellikler keşfedin."
                        className="w-full rounded-xl bg-background border border-border/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
            </Section>

            {/* XP Settings */}
            <Section icon={<Star className="h-5 w-5 text-yellow-500" />} title="XP ve Seviye Ayarları" titleColor="text-yellow-600" bg="bg-yellow-500/5 border-yellow-200/40">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <NumberInput label="XP Çarpanı" description="Tüm XP kazanımları bu katsayıyla çarpılır" value={config.xp_multiplier} step={0.5} min={0.5} max={5} onChange={v => update('xp_multiplier', v)} />
                    <NumberInput label="Yeni Gönderi XP" description="Bir video paylaşıldığında kazanılan XP" value={config.new_post_xp} step={10} min={0} max={1000} onChange={v => update('new_post_xp', v)} />
                    <NumberInput label="Günlük Giriş XP" description="Her gün ilk girişte kazanılan XP" value={config.daily_login_xp} step={5} min={0} max={500} onChange={v => update('daily_login_xp', v)} />
                    <NumberInput label="Yorum XP" description="Bir yorum yapıldığında kazanılan XP" value={config.comment_xp} step={5} min={0} max={100} onChange={v => update('comment_xp', v)} />
                    <NumberInput label="Beğeni XP" description="Alınan her beğeni için kazanılan XP" value={config.like_xp} step={1} min={0} max={20} onChange={v => update('like_xp', v)} />
                </div>
            </Section>

            {/* Feature Flags */}
            <Section icon={<Zap className="h-5 w-5 text-purple-500" />} title="Özellik Anahtarları" titleColor="text-purple-600" bg="bg-purple-500/5 border-purple-200/40">
                <div className="space-y-3">
                    {([
                        { key: 'feature_mood_enabled', label: 'Ruh Hali Filtresi', desc: 'Explore sayfasındaki mood bazlı filtreleme özelliği.' },
                        { key: 'feature_stories_enabled', label: 'Hikayeler', desc: 'Kullanıcıların hikaye paylaşması ve görüntülemesi.' },
                        { key: 'feature_leaderboard_enabled', label: 'Liderlik Tablosu', desc: 'Seviyeye göre sıralama tablosu.' },
                    ] as const).map(flag => (
                        <ToggleRow
                            key={flag.key}
                            label={flag.label}
                            description={flag.desc}
                            value={config[flag.key] as boolean}
                            onChange={v => update(flag.key, v)}
                        />
                    ))}
                </div>
            </Section>

            {/* Content Limits */}
            <Section icon={<Sliders className="h-5 w-5 text-teal-500" />} title="İçerik Limitleri" titleColor="text-teal-600" bg="bg-teal-500/5 border-teal-200/40">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <NumberInput label="Reel için Min. Seviye" description="Bu seviyenin altındakiler video paylaşamaz" value={config.min_level_for_reel} step={1} min={1} max={20} onChange={v => update('min_level_for_reel', v)} />
                    <NumberInput label="Maks. Video Süresi (sn)" description="Kullanıcıların yükleyebileceği video süresi" value={config.max_video_duration_seconds} step={15} min={15} max={300} onChange={v => update('max_video_duration_seconds', v)} />
                </div>
            </Section>

            {/* Save Button (bottom) */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                        "flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all shadow-xl",
                        saved ? "bg-emerald-500 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"
                    )}
                >
                    {saved ? <CheckCircle className="h-5 w-5" /> : saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {saved ? 'Tüm Değişiklikler Kaydedildi!' : saving ? 'Kaydediliyor...' : 'Tüm Değişiklikleri Kaydet'}
                </button>
            </div>
        </div>
    );
}

function Section({ icon, title, titleColor, bg, children }: { icon: React.ReactNode; title: string; titleColor: string; bg: string; children: React.ReactNode }) {
    return (
        <div className={cn("rounded-3xl border p-6 space-y-4", bg)}>
            <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-background/80">{icon}</div>
                <h3 className={cn("text-lg font-black", titleColor)}>{title}</h3>
            </div>
            {children}
        </div>
    );
}

function NumberInput({ label, description, value, step, min, max, onChange }: { label: string; description: string; value: number; step: number; min: number; max: number; onChange: (v: number) => void }) {
    return (
        <div className="bg-background rounded-2xl border border-border/40 p-4 space-y-2">
            <label className="block text-sm font-black">{label}</label>
            <p className="text-xs text-muted-foreground">{description}</p>
            <div className="flex items-center gap-2 mt-2">
                <button onClick={() => onChange(Math.max(min, value - step))} className="h-8 w-8 rounded-lg bg-muted text-foreground font-black hover:bg-muted/70 transition-colors flex items-center justify-center text-lg">−</button>
                <input
                    type="number"
                    value={value}
                    step={step}
                    min={min}
                    max={max}
                    onChange={e => onChange(parseFloat(e.target.value))}
                    className="flex-1 text-center font-black text-lg bg-transparent outline-none border-0"
                />
                <button onClick={() => onChange(Math.min(max, value + step))} className="h-8 w-8 rounded-lg bg-muted text-foreground font-black hover:bg-muted/70 transition-colors flex items-center justify-center text-lg">+</button>
            </div>
        </div>
    );
}

function ToggleRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border/40">
            <div>
                <p className="font-bold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <button
                onClick={() => onChange(!value)}
                className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", value ? "bg-orange-500" : "bg-muted")}
            >
                <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform", value ? "translate-x-6" : "translate-x-1")} />
            </button>
        </div>
    );
}
