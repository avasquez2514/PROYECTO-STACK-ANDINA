import React from "react";

import { AuditLog } from "../../types";

interface AdminTabAuditLogsProps {
  auditLogs: AuditLog[];
  busqueda: string;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

export default function PestanaAuditoriaAdmin({ auditLogs, busqueda }: AdminTabAuditLogsProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#060d14] text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/5 shadow-xl">
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
                  <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-all">
                    <td className="px-8 py-5 text-slate-500 font-mono italic">
                      {formattedDate.includes("Invalid") ? ts : formattedDate}
                    </td>
                    <td className="px-8 py-5 uppercase font-black text-blue-500">{model}</td>
                    <td className="px-8 py-5 text-slate-400">ID: {objId}</td>
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
                    <td className="px-8 py-5 font-black text-white">{user}</td>
                    <td className="px-8 py-5 text-slate-500 italic max-w-sm truncate" title={changes}>{changes}</td>
                  </tr>
                );
              })}
            {auditLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-20 text-center opacity-40 font-black uppercase tracking-[0.2em]">
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
