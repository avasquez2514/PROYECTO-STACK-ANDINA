import React from "react";
import { Soporte } from "../../types";

interface AdminRecentActivityProps {
  gestiones: Soporte[];
  theme: string;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

export default function ActividadRecienteAdmin({ gestiones, theme }: AdminRecentActivityProps) {
  const isLight = theme === 'light';

  return (
    <div className="space-y-4 flex-1 overflow-y-auto pr-1">
      {gestiones.slice(0, 8).map((g, i) => (
        <div key={i} className={cn(
          "p-4 rounded-xl border transition-all",
          isLight
            ? "bg-[#f8fafc] border-slate-100"
            : "bg-[#111827]/50 border-white/5"
        )}>
          <div className="flex justify-between items-start mb-2">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest",
              isLight ? 'text-slate-500' : 'text-slate-400'
            )}>
              {g.gestion === 'SOPORTE' ? 'ASESORÍA' : (g.gestion === 'RECLAMO' ? 'RECLAMO' : g.gestion)}
            </span>
            <span className="text-[9px] font-mono text-slate-500 tracking-widest">
              {new Date(g.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className={cn("text-[13px] font-black leading-tight", isLight ? 'text-slate-800' : 'text-white')}>
            {g.nombre}
          </p>
          <p className={cn(
            "text-[10px] font-bold mt-1.5 flex items-center gap-1.5",
            isLight ? 'text-slate-500' : (g.gestion === 'CIERRE' ? 'text-emerald-500' : 'text-orange-500')
          )}>
            {/* Aquí podrías poner el estado o torre si fuese necesario */}
          </p>
        </div>
      ))}
    </div>
  );
}
