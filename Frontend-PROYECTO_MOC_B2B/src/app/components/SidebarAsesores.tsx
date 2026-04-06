import React from 'react';
import { Zap } from "lucide-react";
import { AsesorSoporte } from "../../types";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

export const estadosAsesorConfig: Record<string, { bg: string, dot: string, border: string }> = {
  "EN_GESTION": { bg: "bg-emerald-500/10 text-emerald-500", dot: "bg-emerald-500 shadow-emerald-500/50", border: "border-emerald-500/20" },
  "EN_DESCANSO": { bg: "bg-slate-500/10 text-slate-400", dot: "bg-slate-500 shadow-slate-500/50", border: "border-white/5" },
  "NO_DISPONIBLE": { bg: "bg-rose-500/10 text-rose-500", dot: "bg-rose-500 shadow-rose-500/50", border: "border-rose-500/20" },
  "CASO_COMPLEJO": { bg: "bg-amber-500/10 text-amber-500", dot: "bg-amber-500 shadow-amber-500/50", border: "border-amber-500/20" }
};

export const PERFILES_CONFIG: any = {
  "EN_CIERRES": { label: "Cierres", color: "text-amber-400", bg: "bg-amber-400/10" },
  "SOLO_SOPORTES": { label: "Soporte", color: "text-amber-400", bg: "bg-amber-400/10" },
  "TODO": { label: "Todo gestión:", color: "text-amber-400", bg: "bg-amber-400/10" }
};

interface AdvisorSidebarProps {
  asesoresSoporte: AsesorSoporte[];
  openAdvisorDropdown: number | null;
  setOpenAdvisorDropdown: (id: number | null) => void;
  handleCambioEstadoAsesor: (id: number, estado: string) => void;
  variant?: 'emerald' | 'amber';
  readOnly?: boolean;
}

export default function SidebarAsesores({ 
  asesoresSoporte, 
  openAdvisorDropdown, 
  setOpenAdvisorDropdown, 
  handleCambioEstadoAsesor,
  variant = 'emerald',
  readOnly = false
}: AdvisorSidebarProps) {
  const isAmber = variant === 'amber';
  const mainColor = isAmber ? 'text-amber-400' : 'text-[#00e5a0]';
  const shadowColor = isAmber ? 'shadow-amber-400/50' : 'shadow-[#00e5a0]/50';
  const glowText = isAmber ? 'glow-text-yellow' : 'glow-text-green';
  const borderColor = isAmber ? 'border-amber-400' : 'border-[#00e5a0]';
  const shadowClass = isAmber ? 'shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'shadow-[0_0_15px_rgba(0,229,160,0.2)]';
  const accentText = isAmber ? 'text-amber-400' : 'text-[#00e5a0]';
  const accentBg = isAmber ? 'bg-amber-400/5' : 'bg-[#00e5a0]/5';

  return (
    <aside className="w-64 lg:w-80 shrink-0 border-r flex flex-col transition-all duration-500 border-[#152233] bg-[#0b1621]/80 backdrop-blur-xl shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="p-4 lg:p-8 border-b flex items-center gap-4 border-white/5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hud-corners transition-colors bg-[#0b1618] border border-[#152233]">
          <Zap className={mainColor} size={24} fill="currentColor" />
        </div>
        <div>
          <h1 className={cn("font-black text-xl tracking-tighter italic uppercase drop-shadow-md text-white", shadowColor)}>
            SIMOC<span className={mainColor}></span>
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <h3 className={cn("text-[10px] font-black uppercase tracking-[0.3em] px-2 opacity-70 text-[#608096] mb-4", glowText)}>ASESORES EN LÍNEA</h3>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6 px-2">
          {asesoresSoporte.map((a, i) => {
            const conf = estadosAsesorConfig[a.estado] || estadosAsesorConfig.NO_DISPONIBLE;
            return (
              <div key={a.id} className="relative group flex flex-col items-center gap-2">
                <button
                  onClick={() => !readOnly && setOpenAdvisorDropdown(openAdvisorDropdown === a.id ? null : a.id)}
                    className={cn(
                      "relative w-16 h-16 rounded-full p-1 transition-all duration-500 border-2 flex items-center justify-center",
                      !readOnly && "hover:scale-110 active:scale-95 cursor-pointer",
                      readOnly && "cursor-default",
                      a.estado === 'EN_GESTION' ? `${borderColor} ${shadowClass}` :
                        a.estado === 'EN_DESCANSO' ? 'border-amber-400' :
                          a.estado === 'NO_DISPONIBLE' ? 'border-rose-500' : 'border-white/10'
                    )}
                >
                  <div className={cn(
                    "w-full h-full rounded-full flex items-center justify-center text-[14px] font-black shadow-inner bg-gradient-to-br",
                    i === 0 ? "from-[#00e5a0] to-[#00b8e5] text-[#061511]" :
                      i === 1 ? "from-[#00b8e5] to-[#0060e5] text-white" :
                        "from-[#e5003d] to-[#800022] text-white"
                  )}>
                    {a.login.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Status Dot Indicator */}
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#0b1621] shadow-lg",
                    conf.dot
                  )} />
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-white/80 uppercase tracking-tighter truncate max-w-[64px]">
                    {a.login}
                  </span>
                  {/* Sub-label state */}
                  <span className={cn("text-[7px] font-bold uppercase opacity-60", conf.bg.replace('bg-', 'text-'))}>
                    {a.estado.substring(0, 10)}
                  </span>
                  {/* Profile label */}
                  {a.perfil && PERFILES_CONFIG[a.perfil] && (
                    <span className={cn("text-[6px] font-black uppercase mt-1 px-1.5 py-0.5 rounded-md border border-white/5 animate-blink", PERFILES_CONFIG[a.perfil].bg, PERFILES_CONFIG[a.perfil].color)}>
                      {PERFILES_CONFIG[a.perfil].label}
                    </span>
                  )}
                </div>

                {/* Personal Dropdown Menu */}
                {openAdvisorDropdown === a.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenAdvisorDropdown(null)} />
                    <div className="absolute top-[85%] left-1/2 -translate-x-1/2 mt-2 w-40 z-50 rounded-2xl border border-[#152233] bg-[#0b1621]/98 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-3 border-b border-white/5 bg-white/5">
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest text-center">Cambiar mi estado</p>
                      </div>
                      {Object.keys(estadosAsesorConfig).map(est => (
                        <button
                          key={est}
                          onClick={() => {
                            handleCambioEstadoAsesor(a.id, est);
                            setOpenAdvisorDropdown(null);
                          }}
                          className={cn(
                            "w-full px-5 py-3 text-[9px] font-black text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 uppercase flex items-center gap-3",
                            a.estado === est ? `${accentText} ${accentBg}` : "text-white/60"
                          )}
                        >
                          <div className={cn("w-2 h-2 rounded-full", estadosAsesorConfig[est].dot)} />
                          {est.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-8 border-t border-white/5 bg-[#0b1621]/40">
        <p className="text-[9px] font-black text-[#608096] text-center uppercase tracking-[0.3em] opacity-50">© 2026 SIMOC SYSTEM</p>
      </div>
    </aside>
  );
}
