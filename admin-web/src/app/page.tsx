"use client";

import ChartCard from '@/components/dashboard/ChartCard';
import GlassCard from '@/components/GlassCard';
import StatCard from '@/components/StatCard';
import { db } from '@/lib/firebase';
import { ensureDate } from '@/lib/utils';
import { format, formatDistanceToNow, isAfter, startOfDay, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query
} from 'firebase/firestore';
import {
  Activity,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Users,
  Video,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface ActivityItem {
  id: string;
  type: 'user' | 'post';
  text: string;
  time: string;
  icon: any;
  color: string;
  timestamp: Date;
}

const ACTIVITY_COLORS: Record<string, string> = {
  user: '#3B82F6',
  post: '#F59E0B',
};

export default function Home() {
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    engagement: '4.2%',
    reports: 0,
  });
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{
    userGrowth: any;
    contentDistribution: any;
  }>({
    userGrowth: { labels: [], datasets: [] },
    contentDistribution: { labels: [], datasets: [] }
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersCount, postsCount, reportsCount] = await Promise.all([
          getCountFromServer(collection(db, 'profiles')).then(s => s.data().count),
          getCountFromServer(collection(db, 'posts')).then(s => s.data().count),
          getCountFromServer(collection(db, 'reports')).then(s => s.data().count).catch(() => 0),
        ]);

        setStats({ users: usersCount, posts: postsCount, engagement: '4.2%', reports: reportsCount });

        const [usersSnap, postsSnap] = await Promise.all([
          getDocs(query(collection(db, 'profiles'), orderBy('created_at', 'desc'), limit(50))),
          getDocs(query(collection(db, 'posts'), orderBy('created_at', 'desc'), limit(50))),
        ]);

        const activities: ActivityItem[] = [];
        const days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'EEE', { locale: tr }));
        const userBuckets = new Array(7).fill(0);
        const postBuckets = new Array(7).fill(0);

        usersSnap.forEach(doc => {
          const data = doc.data();
          const date = ensureDate(data.created_at);
          if (activities.length < 5) {
            activities.push({
              id: doc.id,
              type: 'user',
              text: `Yeni kullanıcı: @${data.username || 'isimsiz'}`,
              time: formatDistanceToNow(date, { addSuffix: true, locale: tr }),
              icon: Users,
              color: '#3B82F6',
              timestamp: date
            });
          }
          for (let i = 0; i < 7; i++) {
            if (isAfter(date, startOfDay(subDays(new Date(), 6 - i)))) userBuckets[i]++;
          }
        });

        postsSnap.forEach(doc => {
          const data = doc.data();
          const date = ensureDate(data.created_at);
          if (activities.length < 10) {
            activities.push({
              id: doc.id,
              type: 'post',
              text: `Yeni video paylaşıldı`,
              time: formatDistanceToNow(date, { addSuffix: true, locale: tr }),
              icon: Video,
              color: '#F59E0B',
              timestamp: date
            });
          }
          for (let i = 0; i < 7; i++) {
            if (isAfter(date, startOfDay(subDays(new Date(), 6 - i)))) postBuckets[i]++;
          }
        });

        setRecentActivities(activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8));

        setChartData({
          userGrowth: {
            labels: days,
            datasets: [{
              label: 'Yeni Kullanıcılar',
              data: userBuckets,
              borderColor: '#F59E0B',
              backgroundColor: 'rgba(245,158,11,0.08)',
              fill: true,
              tension: 0.4,
              borderWidth: 2.5,
              pointRadius: 4,
              pointBackgroundColor: '#F59E0B',
            }]
          },
          contentDistribution: {
            labels: days,
            datasets: [{
              label: 'Yeni Paylaşımlar',
              data: postBuckets,
              backgroundColor: 'rgba(139,92,246,0.7)',
              borderRadius: 8,
            }]
          }
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Günaydın' : now.getHours() < 18 ? 'İyi günler' : 'İyi akşamlar';

  return (
    <div className="p-8 space-y-8">

      {/* Hero Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight animate-fade-up"
            style={{ fontFamily: 'Outfit, Inter, sans-serif', color: '#f0f0f5' }}
          >
            {greeting}, Admin <span className="animate-glow-pulse inline-block">⚡</span>
          </h2>
          <p className="text-sm" style={{ color: 'rgba(240,240,245,0.4)' }}>
            {format(now, "dd MMMM yyyy, EEEE", { locale: tr })} — Canlı verilere bakıyorsun
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#10B981'
          }}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-glow-pulse" />
          Sistem Operasyonel
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Toplam Kullanıcı"
          value={stats.users}
          trend={12}
          trendLabel="bu hafta"
          icon={<Users className="h-5 w-5" style={{ color: '#3B82F6' }} />}
          iconBg="bg-blue-500/10"
          glow="sapphire"
          loading={loading}
          delay={0}
        />
        <StatCard
          label="Toplam Gönderi"
          value={stats.posts}
          trend={8}
          trendLabel="bu hafta"
          icon={<Video className="h-5 w-5" style={{ color: '#F59E0B' }} />}
          iconBg="bg-yellow-500/10"
          glow="saffron"
          loading={loading}
          delay={80}
        />
        <StatCard
          label="Etkileşim Oranı"
          value="4.2%"
          trend={0.1}
          trendLabel="bu hafta"
          icon={<Activity className="h-5 w-5" style={{ color: '#10B981' }} />}
          iconBg="bg-emerald-500/10"
          glow="emerald"
          loading={loading}
          delay={160}
        />
        <StatCard
          label="Aktif Raporlar"
          value={stats.reports}
          trend={-2}
          trendLabel="bu hafta"
          icon={<MessageSquare className="h-5 w-5" style={{ color: '#EF4444' }} />}
          iconBg="bg-red-500/10"
          glow="red"
          loading={loading}
          delay={240}
        />
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          <ChartCard
            title="Kullanıcı Kayıt Trendi"
            subtitle="Son 7 günün günlük kayıt analizi"
            type="line"
            data={chartData.userGrowth}
            options={{
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: 'rgba(255,255,255,0.3)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: 'rgba(255,255,255,0.3)' }, grid: { display: false } }
              },
              plugins: { legend: { labels: { color: 'rgba(255,255,255,0.5)' } } }
            }}
          />
          <ChartCard
            title="İçerik Üretimi"
            subtitle="Günlere göre yeni gönderi dağılımı"
            type="bar"
            data={chartData.contentDistribution}
            options={{
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: 'rgba(255,255,255,0.3)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: 'rgba(255,255,255,0.3)' }, grid: { display: false } }
              },
              plugins: { legend: { labels: { color: 'rgba(255,255,255,0.5)' } } }
            }}
          />
        </div>

        {/* Activity Feed */}
        <GlassCard padding="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.1)' }}
              >
                <Zap className="h-4 w-4" style={{ color: '#F59E0B' }} />
              </div>
              <h3 className="text-sm font-black" style={{ fontFamily: 'Outfit,sans-serif', color: '#f0f0f5' }}>
                Son Aktivite
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-xl shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <div className="h-2 rounded w-1/3" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  </div>
                </div>
              ))
            ) : recentActivities.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Henüz aktivite yok.
              </p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 animate-fade-up">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${activity.color}15` }}
                  >
                    <activity.icon className="h-4 w-4" style={{ color: activity.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate" style={{ color: '#f0f0f5' }}>
                      {activity.text}
                    </p>
                    <p className="text-[10px] mt-0.5 flex items-center gap-1"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          { label: 'Sistem Durumu', value: 'Operasyonel', icon: Clock, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Sunucu Tepki Süresi', value: '42ms', icon: Eye, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Veri Senkronizasyonu', value: 'Gerçek Zamanlı', icon: Heart, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
        ].map((item) => (
          <GlassCard key={item.label} padding="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: item.bg }}
              >
                <item.icon className="h-5 w-5" style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >{item.label}</p>
                <p className="text-base font-black mt-0.5"
                  style={{ fontFamily: 'Outfit,sans-serif', color: '#f0f0f5' }}
                >{item.value}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
