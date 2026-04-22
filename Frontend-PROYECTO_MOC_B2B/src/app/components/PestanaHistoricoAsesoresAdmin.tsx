import React, { useState } from "react";
import { History, ArrowLeft, User, Clock } from "lucide-react";
import { AsesorSoporte } from "../../types";
import { ESTADOS_CONFIG } from "../../constants";
import { formatSeconds } from "../../utils/formatters";
import TemporizadorEstado from "./TemporizadorEstado";

/**
 * Propiedades del componente de Histórico detallado de Asesores.
 * @interface PestanaHistoricoAsesoresAdminProps
 */
interface PestanaHistoricoAsesoresAdminProps {
  /** Listado de asesores, los cuales deben contener internamente el array `historial_estados`. */
  asesores: AsesorSoporte[];
  /** Filtro de búsqueda global. */
  busqueda: string;
  /** Tema visual. */
  theme?: string;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Componente PestanaHistoricoAsesoresAdmin
 * 
 * Vista analítica que permite navegar por el historial de cambios de estado de cada asesor.
 * Muestra una vista de cuadrícula (cards) inicial y permite profundizar en un "Timeline"
 * detallado por asesor, calculando duraciones entre estados automáticamente.
 * 
 * @param {PestanaHistoricoAsesoresAdminProps} props
 */
export default function PestanaHistoricoAsesoresAdmin({ 
  asesores,
  busqueda,
  theme = "dark"
}: PestanaHistoricoAsesoresAdminProps) {
  const [selectedAsesor, setSelectedAsesor] = useState<AsesorSoporte | null>(null);

  const isLight = theme === "light";

  if (selectedAsesor) {
    const historial = (selectedAsesor as any).historial_estados || [];
    
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedAsesor(null)}
            className={cn(
              "flex items-center gap-2 transition-all group",
              isLight ? "text-slate-600 hover:text-black" : "text-slate-500 hover:text-white"
            )}
          >
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Volver al listado</span>
          </button>
          
          <div className="text-right">
            <h3 className={cn("text-xl font-black uppercase italic tracking-tighter", isLight ? "text-slate-900" : "text-white")}>
              Historial de <span className="text-blue-500">{selectedAsesor.nombre_asesor}</span>
            </h3>
            <p className={cn("text-[9px] font-black uppercase tracking-widest", isLight ? "text-slate-600" : "text-slate-500")}>Timeline de cambios de estado operativos</p>
          </div>
        </div>

        <div className={cn("glass-panel rounded-[3rem] border overflow-hidden shadow-2xl", isLight ? "border-slate-200" : "border-white/5")}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className={cn("text-[9px] font-black uppercase tracking-[0.3em] border-b", isLight ? "bg-slate-100/50 text-slate-700 border-slate-200" : "bg-[#060d14] text-slate-500 border-white/5")}>
                <tr>
                  <th className="px-10 py-7">ESTADO</th>
                  <th className="px-10 py-7">INICIO</th>
                  <th className="px-10 py-7">FIN</th>
                  <th className="px-10 py-7 text-right">DURACIÓN</th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-bold divide-y divide-inherit">
                {historial.length > 0 ? (
                  historial.map((h: any, idx: number) => (
                    <tr key={idx} className={cn("transition-all group", isLight ? "hover:bg-slate-50 border-slate-100" : "hover:bg-blue-600/[0.03] border-white/[0.02]")}>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", ESTADOS_CONFIG[h.estado]?.dot)} />
                          <span className={cn("uppercase", ESTADOS_CONFIG[h.estado]?.color)}>
                            {ESTADOS_CONFIG[h.estado]?.label || h.estado}
                          </span>
                        </div>
                      </td>
                      <td className={cn("px-10 py-6", isLight ? "text-slate-800" : "text-slate-400")}>{new Date(h.fecha_inicio).toLocaleString()}</td>
                      <td className={cn("px-10 py-6", isLight ? "text-slate-800" : "text-slate-400")}>
                        {h.fecha_fin ? new Date(h.fecha_fin).toLocaleString() : <span className="text-emerald-500 animate-pulse font-black">ACTIVO</span>}
                      </td>
                      <td className={cn("px-10 py-6 text-right font-mono", isLight ? "text-slate-900" : "text-slate-300")}>
                         {h.duracion_segundos ? formatSeconds(h.duracion_segundos) : <TemporizadorEstado lastChange={h.fecha_inicio} />}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={cn("px-10 py-20 text-center italic uppercase text-[10px] tracking-widest font-black", isLight ? "text-slate-400" : "text-slate-600")}>
                      No se encontraron registros históricos para este asesor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const filteredAsesores = asesores.filter(a => 
    !busqueda || 
    a.nombre_asesor.toUpperCase().includes(busqueda.toUpperCase()) || 
    a.cedula.includes(busqueda) ||
    a.login.toUpperCase().includes(busqueda.toUpperCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAsesores.length > 0 ? (
          filteredAsesores.map((asesor) => (
            <div 
              key={asesor.id} 
              onClick={() => setSelectedAsesor(asesor)}
              className={cn(
                "glass-panel p-8 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden",
                isLight ? "bg-white border-slate-200 shadow-xl hover:border-blue-500" : "border-white/5 hover:border-blue-500/30 hover:bg-white/[0.02]"
              )}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-1000" />
              
              <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    <User size={20} />
                  </div>
                  <div className="text-right">
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", isLight ? "text-blue-600" : "text-slate-500")}>{asesor.login}</p>
                    <div className="flex items-center gap-2 justify-end mt-1">
                      <div className={cn("w-1.5 h-1.5 rounded-full", ESTADOS_CONFIG[asesor.estado]?.dot)} />
                      <span className={cn("text-[8px] font-black uppercase", isLight ? "text-slate-700" : "text-slate-300")}>{ESTADOS_CONFIG[asesor.estado]?.label}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className={cn("text-sm font-black uppercase truncate group-hover:text-blue-500 transition-colors", isLight ? "text-slate-900" : "text-white")}>{asesor.nombre_asesor}</h4>
                  <p className={cn("text-[9px] font-black uppercase tracking-widest mt-1", isLight ? "text-slate-600" : "text-slate-500")}>C.C. {asesor.cedula}</p>
                </div>

                <div className={cn("pt-6 border-t flex items-center justify-between", isLight ? "border-slate-100" : "border-white/5")}>
                   <div className="flex items-center gap-2">
                      <History size={14} className="text-blue-500" />
                      <span className={cn("text-[9px] font-black uppercase tracking-widest", isLight ? "text-slate-800" : "text-slate-400")}>
                        {(asesor as any).historial_estados?.length || 0} Registros
                      </span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <Clock size={12} className={cn(isLight ? "text-slate-700" : "text-slate-500")} />
                      <span className={cn("text-[9px] font-mono", isLight ? "text-slate-900" : "text-slate-500")}>
                        <TemporizadorEstado lastChange={asesor.ultimo_cambio_estado} />
                      </span>
                   </div>
                </div>

                <div className="pt-2">
                  <button className={cn(
                    "w-full py-3 border rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    isLight 
                       ? "bg-blue-50 border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white" 
                       : "bg-blue-600/5 border-blue-600/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white"
                  )}>
                    Ver Timeline Detallado
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={cn("col-span-full py-20 text-center glass-panel rounded-[3rem] border", isLight ? "border-slate-200" : "border-white/5")}>
            <p className={cn("text-xs font-black uppercase tracking-widest", isLight ? "text-slate-500" : "text-slate-500")}>No se encontraron asesores para la búsqueda actual</p>
          </div>
        )}
      </div>
    </div>
  );
}
