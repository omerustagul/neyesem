"use client";

import { cn } from "@/lib/utils";
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    ChartOptions,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface ChartCardProps {
    title: string;
    subtitle?: string;
    type: 'line' | 'bar';
    data: any;
    options?: ChartOptions<any>;
    className?: string;
}

export default function ChartCard({ title, subtitle, type, data, options, className }: ChartCardProps) {
    const defaultOptions: ChartOptions<any> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                cornerRadius: 12,
                displayColors: false,
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.4)',
                    font: { size: 10, weight: 'bold' },
                },
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.4)',
                    font: { size: 10, weight: 'bold' },
                },
            },
        },
        ...options
    };

    return (
        <div
            className={cn("rounded-3xl p-6 flex flex-col gap-6 lg:h-[400px]", className)}
            style={{
                background: 'rgba(255,255,255,0.035)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.07)',
            }}
        >
            <div className="flex flex-col gap-1">
                <h3 className="text-base font-black tracking-tight"
                    style={{ fontFamily: 'Outfit, Inter, sans-serif', color: '#f0f0f5' }}
                >{title}</h3>
                {subtitle && <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{subtitle}</p>}
            </div>

            <div className="flex-1 min-h-[240px]">
                {type === 'line' ? (
                    <Line data={data} options={defaultOptions} />
                ) : (
                    <Bar data={data} options={defaultOptions} />
                )}
            </div>
        </div>
    );
}

