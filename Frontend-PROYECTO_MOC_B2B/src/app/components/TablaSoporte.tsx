import React from 'react';
import { ChevronDown, MessageSquare, ClipboardList, Copy, LayoutDashboard } from "lucide-react";
import { Soporte, AsesorSoporte } from "../../types";
import { decodificarObservaciones, formatearFecha, formatearPlantilla } from "../../utils/formatters";
import EsqueletoCarga from "./EsqueletoCarga";
import CronometroEnVivo from "./CronometroEnVivo";
import { toast } from "sonner";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

const estadosGestion = ["En gestión", "Enrutado", "Resuelto", "Mal Escalado"];

interface SoporteTableProps {
  loading: boolean;
  datosFiltrados: Soporte[];
  openDropdownId: { id: number; type: 'login' | 'estado' } | null;
  setOpenDropdownId: (v: { id: number; type: 'login' | 'estado' } | null) => void;
  asesoresSoporte: AsesorSoporte[];
  actualizarSoporte: (id: number, field: string, value: any) => void;
  setActiveChatSoporteId: (id: number) => void;
  setActiveChatIncidente: (inc: string) => void;
  setModalConfig: (config: { id: number; text: string; title: string; evidencias?: string[] }) => void;
  variant?: 'emerald' | 'amber';
  showPrioridad?: boolean;
  readOnly?: boolean;
}

export default function TablaSoporte({
  loading,
  datosFiltrados,
  openDropdownId,
  setOpenDropdownId,
  asesoresSoporte,
  actualizarSoporte,
  setActiveChatSoporteId,
  setActiveChatIncidente,
  setModalConfig,
  variant = 'emerald',
  showPrioridad = false,
  readOnly = false
}: SoporteTableProps) {
  const isAmber = variant === 'amber';
  const mainColor = isAmber ? 'text-amber-400' : 'text-[#00e5a0]';
  const borderColor = isAmber ? 'border-amber-400/30' : 'border-[#00e5a0]/30';
  const bgColor = isAmber ? 'bg-amber-400/10' : 'bg-[#00e5a0]/10';
  const hoverBorder = isAmber ? 'hover:border-amber-400/60' : 'hover:border-[#00e5a0]/60';
  const filterIconColor = isAmber ? 'text-amber-400' : 'text-[#00b8e5]';
  const buttonHoverBg = isAmber ? 'hover:bg-amber-400/5' : 'hover:bg-[#00e5a0]/5';
  const buttonHoverBorder = isAmber ? 'hover:border-amber-400/30' : 'hover:border-[#00e5a0]/30';
  const buttonHoverText = isAmber ? 'hover:text-amber-400' : 'hover:text-[#00e5a0]';
  const chatDotBg = isAmber ? 'bg-amber-400 shadow-[0_0_15px_#fbbf24]' : 'bg-[#00e5a0] shadow-[0_0_15px_#00e5a0]';
  const chatDotOuter = isAmber ? 'bg-amber-400' : 'bg-[#00e5a0]';
  const chatDotShadow = isAmber ? 'shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'shadow-[0_0_10px_rgba(0,229,160,0.8)]';

  return (
    <div className="rounded-[2.5rem] flex flex-col backdrop-blur-md border transition-all duration-500 bg-[#0b1621]/40 border-[#152233] shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
      <div className="p-8 border-b flex items-center justify-between bg-[#060d14]/50 border-[#152233]">
        <div className="flex items-center gap-4">
          <div className={cn("p-2.5 rounded-xl border", bgColor, borderColor)}>
            <LayoutDashboard className={mainColor} size={20} />
          </div>
          <h3 className="text-[12px] font-black uppercase tracking-[0.4em] drop-shadow-md text-white">MONITOREO DE GESTIONES ACTIVAS</h3>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar pb-32">
        <table className="w-full text-left min-w-[1400px] border-collapse relative">
          <thead>
            <tr className="text-[9px] font-bold uppercase tracking-[0.1em] sticky top-0 z-20 text-[#608096] bg-[#060d14] border-b border-[#152233]">
              <th className="px-4 py-3">FECHA / HORA</th>
              <th className="px-2 py-3 text-center">EN SITIO</th>
              <th className="px-4 py-3">TÉCNICO</th>
              <th className="px-4 py-3">CELULAR</th>
              <th className="px-4 py-3">TORRE ASIGNADA</th>
              <th className="px-4 py-3">NÚMERO INC</th>
              <th className="px-4 py-3 text-center">GESTIÓN</th>
              <th className="px-4 py-3 min-w-[250px]">OBS. TÉCNICAS</th>
              <th className="px-2 py-3 text-center">CHAT</th>
              <th className="px-2 py-3 text-center">PLANTILLA</th>
              <th className="px-2 py-3 text-center">LOGIN N1</th>
              <th className="px-2 py-3 text-center">ESTADO</th>
              <th className="px-4 py-3 text-center">TIEMPO</th>
              {showPrioridad && <th className="px-4 py-3 text-center">PRIORIDAD</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#152233]/40">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[#152233]/40">
                  <td colSpan={13} className="px-4 py-6">
                    <EsqueletoCarga className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : (
              datosFiltrados.map((d) => (
                <tr
                  key={d.id}
                  className={cn(
                    "transition-all group border-l-4 border-transparent hover:bg-[#060d14]/60",
                    hoverBorder,
                    d.prioridad ? "bg-rose-500/10 border-l-rose-500" : "",
                    openDropdownId?.id === d.id ? "relative z-50 bg-[#060d14] shadow-[0_0_30px_rgba(0,0,0,0.9)]" : "relative z-0"
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="text-[11px] font-bold tracking-tight text-slate-300">{formatearFecha(d.fecha_hora).split('|')[1]}</p>
                    <p className="text-[9px] text-slate-400 font-medium">{formatearFecha(d.fecha_hora).split('|')[0]}</p>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className={cn(
                      "text-[10px] font-black px-2.5 py-1 rounded-lg transition-all",
                      d.en_sitio
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-slate-100/50 text-slate-400 border border-slate-200"
                    )}>
                      {d.en_sitio ? "SI" : "NO"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[11px] font-black uppercase tracking-tight text-white transition-colors", buttonHoverText)}>{d.nombre}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-bold text-slate-400">{d.celular || "315 --"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-bold uppercase tracking-tighter truncate max-w-[150px] inline-block text-white">{d.torre}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-[#0b1621] text-white rounded-lg font-mono font-black text-[10px] border border-white/20">
                        {d.incidente || "INC-0000"}
                      </span>
                      <button
                        onClick={(e) => {
                          navigator.clipboard.writeText(d.incidente || "INC-0000");
                          toast.success("incidente copiado al portapapeles");
                        }}
                        className={cn("p-1.5 rounded-md transition-all border border-transparent shadow-sm", buttonHoverBg, buttonHoverText, buttonHoverBorder)}
                        title="Copiar Incidente"
                      >
                        <Copy size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight",
                      d.gestion === 'AUSENCIA' || d.gestion === 'ASESORIA' ? 'bg-amber-500/10 text-amber-600' :
                        d.gestion === 'DIRECTO' ? 'bg-orange-500/10 text-orange-600' :
                          'bg-emerald-500/10 text-emerald-600'
                    )}>
                      {d.gestion}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[10px] font-medium line-clamp-2 max-w-[300px] text-slate-400 group-hover:text-white transition-colors" title={decodificarObservaciones(d.observaciones)}>
                      {decodificarObservaciones(d.observaciones)}
                    </p>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => {
                        setActiveChatSoporteId(d.id);
                        setActiveChatIncidente(d.incidente);
                      }}
                      className={cn("p-2 border rounded-xl transition-all relative flex items-center justify-center mx-auto bg-[#060d14] border-[#152233] text-[#608096]", buttonHoverBg, buttonHoverText, buttonHoverBorder)}
                    >
                      <MessageSquare size={14} strokeWidth={2} />
                      {d.chat_visto_soporte === false && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center">
                          <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-50 animate-ping", chatDotOuter, chatDotShadow)}></span>
                          <span className={cn("relative inline-flex rounded-full h-full w-full border-2 border-[#060d14] items-center justify-center", chatDotOuter, chatDotShadow)}>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-sm"></span>
                          </span>
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => {
                        const textoFormateado = formatearPlantilla(d.plantilla || "{}");
                        let evList: string[] = [];
                        if (d.evidencias_files && (d.evidencias_files as any[]).length > 0) {
                          evList = (d.evidencias_files as any[]).map(f => `${process.env.NEXT_PUBLIC_API_URL}${f.archivo}`);
                        } else {
                          try { if (d.evidencias) evList = JSON.parse(d.evidencias); } catch (e) { }
                        }
                        setModalConfig({ id: d.id, text: textoFormateado, title: "PLANTILLA TÉCNICA", evidencias: evList });
                      }}
                      className={cn("p-2 border rounded-xl transition-all flex items-center justify-center mx-auto bg-[#060d14] border-[#152233] text-[#608096]", buttonHoverBg, buttonHoverText, buttonHoverBorder)}
                    >
                      <ClipboardList size={14} strokeWidth={2} />
                    </button>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className={cn("relative flex justify-center", openDropdownId?.id === d.id && openDropdownId?.type === 'login' ? "z-50" : "z-0")}>
                      <button
                        onClick={() => !readOnly && setOpenDropdownId(openDropdownId?.id === d.id && openDropdownId?.type === 'login' ? null : { id: d.id, type: 'login' })}
                        className={cn(
                          "w-32 border text-[9px] font-black uppercase py-2 px-3 rounded-xl flex items-center justify-between transition-all bg-[#060d14] border-[#152233] text-white",
                          !readOnly && "active:scale-95 hover:border-white/20 cursor-pointer",
                          readOnly && "opacity-80 cursor-default"
                        )}
                      >
                        <span className="truncate pr-2">{d.login_n1 === "POR_ASIGNAR" ? "--" : d.login_n1}</span>
                        {!readOnly && <ChevronDown size={10} className={cn("text-white/40 transition-transform", openDropdownId?.id === d.id && openDropdownId?.type === 'login' && "rotate-180")} />}
                      </button>

                      {openDropdownId?.id === d.id && openDropdownId?.type === 'login' && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 z-50 rounded-2xl border border-[#152233] bg-[#0b1621]/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200">
                            <button
                              onClick={() => { actualizarSoporte(d.id, "login_n1", "POR_ASIGNAR"); setOpenDropdownId(null); }}
                              className="w-full px-5 py-3 text-[9px] font-bold text-left hover:bg-rose-500/10 hover:text-rose-500 transition-colors border-b border-white/5 text-white/50"
                            >
                              -- QUITAR ASIGNACIÓN --
                            </button>
                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                              {asesoresSoporte.map(a => (
                                <button
                                  key={a.id}
                                  onClick={() => {
                                    actualizarSoporte(d.id, "login_n1", a.login);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-5 py-3 text-[9px] font-black text-left hover:bg-[#00e5a0]/10 hover:text-[#00e5a0] transition-colors border-b border-white/5 last:border-0 text-white/80 uppercase"
                                >
                                  {a.login}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-3 text-center relative">
                    <div
                      className={cn(
                        "w-28 border text-[9px] font-black rounded-xl py-1.5 px-3 flex items-center justify-between mx-auto transition-all",
                        !readOnly && "cursor-pointer hover:opacity-100 opacity-80",
                        readOnly && "cursor-default opacity-80",
                        d.estado === 'Resuelto' || d.estado === 'ACTIVO' ? 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20' :
                          d.estado === 'En gestión' || d.estado === 'PENDIENTE' ? 'bg-[#00b8e5]/10 text-[#00b8e5] border-[#00b8e5]/20' :
                            d.estado === 'Enrutado' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                              d.estado === 'Mal Escalado' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                "bg-[#060d14] text-white border-[#152233]"
                      )}
                      onClick={() => !readOnly && setOpenDropdownId(openDropdownId?.id === d.id && openDropdownId?.type === 'estado' ? null : { id: d.id, type: 'estado' })}
                    >
                      <span className="truncate pr-1 uppercase">{d.estado || "---"}</span>
                      {!readOnly && <ChevronDown size={10} className="opacity-40" />}
                    </div>

                    {/* Menú Desplegable ESTADO */}
                    {openDropdownId?.id === d.id && openDropdownId?.type === 'estado' && (
                      <div className="absolute top-[85%] left-1/2 -translate-x-1/2 z-[100] mt-1 w-36 bg-[#0b1621] border border-[#152233] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                        {estadosGestion.map(st => (
                          <button
                            key={st}
                            onClick={() => {
                              actualizarSoporte(d.id, "estado", st);
                              setOpenDropdownId(null);
                            }}
                            className={cn(
                              "w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-white border-b border-white/5 last:border-0",
                              d.estado === st ? "bg-white/5 text-amber-400" : ""
                            )}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "text-[10px] font-black px-3 py-1.5 rounded-xl transition-all inline-flex items-center justify-center gap-2",
                      d.estado === 'Resuelto' ? 'text-emerald-500 animate-pulse-slow' :
                        d.estado === 'Enrutado' ? 'text-amber-400' :
                          d.estado === 'Mal Escalado' ? 'text-rose-500' :
                            'text-white'
                    )}>
                      {!d.fecha_fin && d.fecha_inicio_sitio && (
                        <div className="w-1 h-1 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]" />
                      )}
                      <CronometroEnVivo inicio={d.fecha_inicio_sitio} fin={d.fecha_fin} />
                    </span>
                  </td>
                  {showPrioridad && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => actualizarSoporte(d.id, "prioridad", !d.prioridad)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                          d.prioridad 
                            ? "bg-rose-500 text-white border-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse" 
                            : "bg-[#060d14] text-[#608096] border-[#152233] hover:border-rose-500/50 hover:text-rose-400"
                        )}
                      >
                        {d.prioridad ? "PRIORIDAD ALTA" : "NORMAL"}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
