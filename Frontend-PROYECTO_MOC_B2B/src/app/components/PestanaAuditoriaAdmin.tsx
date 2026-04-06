import React from "react";

import { AuditLog } from "../../types";

interface AdminTabAuditLogsProps {
  auditLogs: AuditLog[];
  busqueda: string;
  theme?: string;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

export default function PestanaAuditoriaAdmin({ auditLogs, busqueda, theme = "dark" }: AdminTabAuditLogsProps) {
  const isLight = theme === "light";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className={cn("glass-panel rounded-[2.5rem] border overflow-hidden shadow-2xl", isLight ? "border-slate-200" : "border-white/5")}>
        <table className="w-full text-left border-collapse">
          <thead className={cn("text-[9px] font-black uppercase tracking-[0.3em] border-b shadow-xl", isLight ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-[#060d14] text-slate-500 border-white/5")}>
            <tr>
              <th className="px-8 py-6">FECHA/HORA</th>
              <th className="px-8 py-6">MODELO</th>
              <th className="px-8 py-6">ID REGISTRO</th>
              <th className="px-8 py-6">ACCIÓN</th>
              <th className="px-8 py-6">USUARIO</th>
              <th className="px-8 py-6">DESCRIPCIÓN</th>
            </tr>
          </thead>
          <tbody className="text-[10px] font-bold">
            {auditLogs
              .filter(log => 
                !busqueda || 
                (log.admin_user || "").toUpperCase().includes(busqueda.toUpperCase()) || 
                (log.model_name || "").toUpperCase().includes(busqueda.toUpperCase())
              )
              .map((log: any, i) => {
                // Handle different potential field names from backend
                const ts = log.timestamp || log.created_at || log.fecha_hora;
                const formattedDate = ts ? new Date(ts).toLocaleString('es-CO') : "---";
                const user = log.admin_user || log.user || "SISTEMA";
                const action = log.action || "UPDATE";
                const model = log.model_name || log.modelo || "SOPORTE";
                const changes = log.changes || log.descripcion || log.mensaje || "SIN DETALLES";
                const objId = log.object_id || log.id_registro || log.id;

                return (
                  <tr key={i} className={cn("border-t transition-all", isLight ? "border-slate-100 hover:bg-slate-50" : "border-white/5 hover:bg-white/5")}>
                    <td className={cn("px-8 py-5 font-mono italic", isLight ? "text-slate-600" : "text-slate-500")}>
                      {formattedDate.includes("Invalid") ? ts : formattedDate}
                    </td>
                    <td className="px-8 py-5 uppercase font-black text-blue-500">{model}</td>
                    <td className={cn("px-8 py-5", isLight ? "text-slate-600" : "text-slate-400")}>ID: {objId}</td>
                    <td className="px-8 py-5 uppercase">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[8px] font-black uppercase border",
                        action === 'CREATE' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                        (action === 'UPDATE' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : 
                        "bg-rose-500/10 text-rose-500 border-rose-500/20")
                      )}>
                        {action}
                      </span>
                    </td>
                    <td className={cn("px-8 py-5 font-black", isLight ? "text-slate-900" : "text-white")}>{user}</td>
                    <td className={cn("px-8 py-5 italic max-w-sm truncate", isLight ? "text-slate-700" : "text-slate-500")} title={changes}>{changes}</td>
                  </tr>
                );
              })}
            {auditLogs.length === 0 && (
              <tr>
                <td colSpan={6} className={cn("py-20 text-center font-black uppercase tracking-[0.2em]", isLight ? "text-slate-400" : "opacity-40")}>
                  Sincronizando registros...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
