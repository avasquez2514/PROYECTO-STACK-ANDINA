import React from "react";
import { Soporte } from "../../types";

interface AdminTabSoportesProps {
  gestiones: Soporte[];
  busqueda: string;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

export default function PestanaSoportesAdmin({ gestiones, busqueda }: AdminTabSoportesProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden max-h-[800px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className="sticky top-0 bg-[#060d14] z-20 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-xl">
            <tr>
              <th className="px-8 py-6">FECHA/HORA</th>
              <th className="px-8 py-6">FUNCIONARIO</th>
              <th className="px-8 py-6">CELULAR</th>
              <th className="px-8 py-6">TORRE</th>
              <th className="px-8 py-6">INCIDENTE</th>
              <th className="px-8 py-6">GESTION</th>
              <th className="px-8 py-6">OBSERVACIONES</th>
              <th className="px-8 py-6">PLANTILLA</th>
              <th className="px-8 py-6">ASESOR N1</th>
            </tr>
          </thead>
          <tbody className="text-[10px] font-bold">
            {gestiones
              .filter(g => 
                !busqueda || 
                g.incidente?.toUpperCase().includes(busqueda.toUpperCase()) || 
                g.nombre?.toUpperCase().includes(busqueda.toUpperCase())
              )
              .map((g) => (
                <tr key={g.id} className="border-t border-white/5 hover:bg-white/5 transition-all">
                  <td className="px-8 py-4 text-slate-400">{g.fecha_hora}</td>
                  <td className="px-8 py-4 uppercase font-black">{g.nombre}</td>
                  <td className="px-8 py-4 text-slate-500">{g.celular}</td>
                  <td className="px-8 py-4 uppercase">{g.torre}</td>
                  <td className="px-8 py-4 font-mono text-blue-500">{g.incidente}</td>
                  <td className="px-8 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-black uppercase border",
                      g.gestion === 'CIERRE' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                      g.gestion === 'SOPORTE' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : 
                      "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}>
                      {g.gestion}
                    </span>
                  </td>
                  <td className="px-8 py-4 max-w-[250px] truncate opacity-50">{g.observaciones}</td>
                  <td className="px-8 py-4 max-w-[200px] truncate opacity-30 font-mono italic">{g.plantilla}</td>
                  <td className="px-8 py-4 font-black uppercase text-blue-400">{g.login_n1 || '---'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
