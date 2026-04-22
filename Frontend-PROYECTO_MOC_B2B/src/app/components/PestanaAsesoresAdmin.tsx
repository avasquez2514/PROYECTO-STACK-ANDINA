import React from "react";
import { History, Edit2, Trash2, Clock } from "lucide-react";
import EsqueletoCarga from "./EsqueletoCarga";
import TemporizadorEstado from "./TemporizadorEstado";
import { ESTADOS_CONFIG, PERFILES_CONFIG } from "../../constants";
import { AsesorSoporte } from "../../types";

/**
 * Propiedades del componente PestanaAsesoresAdmin.
 * @interface AdminTabAsesoresProps
 */
interface AdminTabAsesoresProps {
  /** Indica si los datos de asesores están en proceso de carga. */
  loading: boolean;
  /** Listado completo de asesores nivel 1. */
  asesores: AsesorSoporte[];
  /** Término de filtrado por nombre o cédula. */
  busqueda: string;
  /** Tema visual (light/dark). */
  theme: string;
  /** Función para abrir modales de edición o creación. */
  setModalConfig: (config: any) => void;
  /** Función genérica para ejecutar acciones CRUD (POST, PATCH, DELETE). */
  handleAction: (endpoint: string, method: string, id?: number, data?: any) => Promise<void>;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Componente PestanaAsesoresAdmin
 * 
 * Vista de tabla detallada para la gestión de Asesores de Nivel 1.
 * Permite visualizar el estado en tiempo real, el tiempo transcurrido en dicho estado
 * y acceder a acciones de edición, borrado o visualización de historial.
 * 
 * @param {AdminTabAsesoresProps} props
 */
export default function PestanaAsesoresAdmin({
  loading,
  asesores,
  busqueda,
  theme,
  setModalConfig,
  handleAction
}: AdminTabAsesoresProps) {
  const isLight = theme === 'light';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className={cn("glass-panel rounded-[3rem] border overflow-hidden shadow-2xl", isLight ? "border-slate-200" : "border-white/5")}>
        <table className="w-full text-left border-collapse">
          <thead className={cn("text-[9px] font-black uppercase tracking-[0.3em] border-b shadow-xl", isLight ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-[#060d14] text-slate-500 border-white/5")}>
            <tr>
              <th className="px-10 py-7">ID</th>
              <th className="px-10 py-7">NOMBRES Y APELLIDOS</th>
              <th className="px-10 py-7">ACCESO / ID</th>
              <th className="px-10 py-7">PERFIL ASIGNADO</th>
              <th className="px-10 py-7">ESTADO ACTUAL</th>
              <th className="px-10 py-7 text-center">GESTIÓN</th>
            </tr>
          </thead>
          <tbody className="text-[11px] font-bold">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className={cn("border-t", isLight ? "border-slate-100" : "border-white/5")}>
                  <td colSpan={6} className="px-8 py-4">
                    <EsqueletoCarga className="h-6 w-full" />
                  </td>
                </tr>
              ))
            ) : (
              asesores
                .filter(a => !busqueda || a.nombre_asesor.toUpperCase().includes(busqueda.toUpperCase()) || a.cedula.includes(busqueda))
                .map((a) => (
                  <tr key={a.id} className={cn("border-t transition-all group relative", isLight ? "border-slate-50 hover:bg-slate-50" : "border-white/5 hover:bg-blue-600/[0.03]")}>
                    <td className={cn("px-8 py-5 font-mono", isLight ? "text-slate-500" : "text-slate-500")}>#{a.id}</td>
                    <td className={cn("px-8 py-5 uppercase font-black", isLight ? "text-slate-900" : "text-white")}>{a.nombre_asesor}</td>
                    <td className="px-8 py-5 uppercase tracking-tighter">
                      <div className="flex flex-col">
                        <span className={isLight ? "text-blue-600" : "text-white"}>{a.login}</span>
                        <span className={cn("text-[8px] opacity-70", isLight ? "text-slate-500" : "text-slate-400")}>{a.cedula}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[8px] font-black uppercase border animate-blink",
                        PERFILES_CONFIG[a.perfil]?.bg,
                        PERFILES_CONFIG[a.perfil]?.color,
                        PERFILES_CONFIG[a.perfil]?.border
                      )}>
                        {PERFILES_CONFIG[a.perfil]?.label}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", ESTADOS_CONFIG[a.estado]?.dot)} />
                          <span className={cn("uppercase text-[9px] font-black", isLight ? "text-slate-900" : "text-white")}>{ESTADOS_CONFIG[a.estado]?.label || a.estado}</span>
                        </div>
                        <div className={cn("flex items-center gap-1.5 mt-1 border-t pt-1", isLight ? "border-slate-100" : "border-white/5")}>
                          <Clock size={10} className={cn(isLight ? "text-slate-500" : "text-slate-500")} />
                          <span className={cn("text-[8px] font-mono", isLight ? "text-slate-800" : "text-slate-400")}>
                            <TemporizadorEstado lastChange={a.ultimo_cambio_estado} />
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={() => setModalConfig({ type: 'asesor_history', mode: 'edit', data: a })} 
                          className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all" 
                          title="Ver Historial de Estados"
                        >
                          <History size={16} />
                        </button>
                        <button 
                          onClick={() => setModalConfig({ type: 'asesor', mode: 'edit', data: a })} 
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => { if (confirm('¿ELIMINAR ASESOR?')) handleAction('asesores', 'DELETE', a.id) }} 
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
