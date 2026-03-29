import React, { useState } from "react";
import { History, ArrowLeft, User, Clock } from "lucide-react";
import { AsesorSoporte } from "../../types";
import { ESTADOS_CONFIG } from "../../constants";
import { formatSeconds } from "../../utils/formatters";
import TemporizadorEstado from "./TemporizadorEstado";

interface PestanaHistoricoAsesoresAdminProps {
  asesores: AsesorSoporte[];
  busqueda: string;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

export default function PestanaHistoricoAsesoresAdmin({ 
  asesores,
  busqueda
}: PestanaHistoricoAsesoresAdminProps) {
  const [selectedAsesor, setSelectedAsesor] = useState<AsesorSoporte | null>(null);

  // If we have a selected advisor, show their detailed history
  if (selectedAsesor) {
    const historial = (selectedAsesor as any).historial_estados || [];
    
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedAsesor(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-all group"
          >
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Volver al listado</span>
          </button>
          
          <div className="text-right">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">
              Historial de <span className="text-blue-500">{selectedAsesor.nombre_asesor}</span>
            </h3>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Timeline de cambios de estado operativos</p>
          </div>
        </div>

        {/* History Table */}
        <div className="glass-panel rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#060d14] text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/5">
                <tr>
                  <th className="px-10 py-7">ESTADO</th>
                  <th className="px-10 py-7">INICIO</th>
                  <th className="px-10 py-7">FIN</th>
                  <th className="px-10 py-7 text-right">DURACIÓN</th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-bold divide-y divide-white/[0.02]">
                {historial.length > 0 ? (
                  historial.map((h: any, idx: number) => (
                    <tr key={idx} className="hover:bg-blue-600/[0.03] transition-all group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", ESTADOS_CONFIG[h.estado]?.dot)} />
                          <span className={cn("uppercase", ESTADOS_CONFIG[h.estado]?.color)}>
                            {ESTADOS_CONFIG[h.estado]?.label || h.estado}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-slate-400">{new Date(h.fecha_inicio).toLocaleString()}</td>
                      <td className="px-10 py-6 text-slate-400">
                        {h.fecha_fin ? new Date(h.fecha_fin).toLocaleString() : <span className="text-emerald-500 animate-pulse">ACTIVO</span>}
                      </td>
                      <td className="px-10 py-6 text-right font-mono text-slate-300">
                         {h.duracion_segundos ? formatSeconds(h.duracion_segundos) : <TemporizadorEstado lastChange={h.fecha_inicio} />}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-10 py-20 text-center text-slate-600 italic uppercase text-[10px] tracking-widest font-black">
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

  // Main listing of advisors with stats
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
              className="glass-panel p-8 rounded-[2.5rem] border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group hover:bg-white/[0.02] relative overflow-hidden"
            >
              {/* Highlight background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-1000" />
              
              <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    <User size={20} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{asesor.login}</p>
                    <div className="flex items-center gap-2 justify-end mt-1">
                      <div className={cn("w-1.5 h-1.5 rounded-full", ESTADOS_CONFIG[asesor.estado]?.dot)} />
                      <span className="text-[8px] font-black uppercase text-slate-300">{ESTADOS_CONFIG[asesor.estado]?.label}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black uppercase text-white truncate group-hover:text-blue-400 transition-colors">{asesor.nombre_asesor}</h4>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">C.C. {asesor.cedula}</p>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <History size={14} className="text-blue-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {(asesor as any).historial_estados?.length || 0} Registros
                      </span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-500" />
                      <span className="text-[9px] font-mono text-slate-500">
                        <TemporizadorEstado lastChange={asesor.ultimo_cambio_estado} />
                      </span>
                   </div>
                </div>

                <div className="pt-2">
                  <button className="w-full py-3 bg-blue-600/5 border border-blue-600/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    Ver Timeline Detallado
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center glass-panel rounded-[3rem] border border-white/5">
            <p className="text-xs font-black uppercase text-slate-500 tracking-widest">No se encontraron asesores para la búsqueda actual</p>
          </div>
        )}
      </div>
    </div>
  );
}
