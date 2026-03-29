import React from "react";
import EsqueletoCarga from "./EsqueletoCarga";

interface AdminKPICardsProps {
  loading: boolean;
  totalStats: {
    total: number;
    cierres: number;
    pendientes: number;
    en_gestion: number;
    en_descanso: number;
    resueltos: number;
    enrutados: number;
  };
  theme: string;
}

export default function TarjetasKPIAdmin({ loading, totalStats, theme }: AdminKPICardsProps) {
  const dashboardStats = [
    { label: "CASOS TOTALES", value: totalStats.total, icon: "📁", isEmoji: true, color: "text-blue-500", glow: "rgba(59, 130, 246, 0.4)" },
    { label: "CASOS RESUELTOS", value: totalStats.resueltos, icon: "✅", isEmoji: true, color: "text-emerald-500", glow: "rgba(16, 185, 129, 0.4)" },
    { label: "CASOS ENRUTADOS", value: totalStats.enrutados, icon: "⚠️", isEmoji: true, color: "text-orange-500", glow: "rgba(249, 115, 22, 0.4)" },
    { label: "EN ESPERA", value: totalStats.pendientes, icon: "⏳", isEmoji: true, color: "text-rose-500", glow: "rgba(244, 63, 94, 0.4)" }
  ];

  const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <EsqueletoCarga key={i} className="h-40 rounded-[2.5rem]" />
        ))
      ) : (
        dashboardStats.map((stat, i) => (
          <div key={i} className={cn(
            "glass-panel p-6 relative flex flex-col items-start transition-all hover:-translate-y-1 mb-2 border-t-[3px]",
            stat.color.replace('text-', 'border-').replace('400', '500').replace('500', '600')
          )}>
            <div className="mb-6 flex items-center justify-center w-8 h-8 rounded-lg overflow-visible">
              <span className="text-2xl" style={{ filter: `drop-shadow(0 0 8px ${stat.glow})` }}>{stat.icon}</span>
            </div>
            <div className="flex flex-col mb-4 gap-0.5">
              {stat.label.split(' ').map((line, idx) => (
                <span key={idx} className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{line}</span>
              ))}
            </div>
            <p className={cn("text-[40px] font-black font-mono leading-none tracking-tighter mt-auto slashed-zero w-full", theme === 'light' ? 'text-slate-800' : 'text-white')}>{stat.value}</p>
          </div>
        ))
      )}
    </div>
  );
}
