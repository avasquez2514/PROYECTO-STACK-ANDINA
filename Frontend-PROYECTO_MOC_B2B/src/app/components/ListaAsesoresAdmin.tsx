import React from "react";
import { Clock } from "lucide-react";
import TemporizadorEstado from "./TemporizadorEstado";
import { ESTADOS_CONFIG } from "../../constants";
import { AsesorSoporte } from "../../types";

/**
 * Interface del listado de Asesores de la Home en la subvista del Administrador.
 * @interface AdminAdvisorListProps
 */
interface AdminAdvisorListProps {
  /** Array total de asesores conectados o registrados en la BD. */
  asesores: AsesorSoporte[];
  /** Contexto visual actual (`dark` o `light`). */
  theme: string;
  /** Función que a inyección computa dinámicamente Casos vs Cierres de la gestión hoy. */
  getStatsPerAsesor: (login: string) => { total: number; cierres: number; soportes: number };
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Componente ListaAsesoresAdmin
 * 
 * Renderiza el listado grid pequeño de "Asesores Destacados/Activos" que se 
 * ve al interior del panel de Administración, informando también el Operational Load.
 * 
 * @param {AdminAdvisorListProps} props
 * @returns {JSX.Element} Grid responsivo con "Cartas de asesores".
 */
export default function ListaAsesoresAdmin({ asesores, theme, getStatsPerAsesor }: AdminAdvisorListProps) {
  const isLight = theme === 'light';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {asesores.slice(0, 6).map((a) => {
        // En el archivo original, getStatsPerAsesor usa 'gestiones'. 
        // Aquí lo recibimos como prop para mantener la lógica centralizada o delegada.
        const stats = getStatsPerAsesor(a.login);
        const st = ESTADOS_CONFIG[a.estado] || ESTADOS_CONFIG.NO_DISPONIBLE;

        return (
          <div key={a.id} className={cn(
            "glass-panel p-5 relative overflow-hidden transition-all group flex flex-col justify-between min-h-[140px] rounded-xl border-l-[3px] shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]",
            st.color.replace('text-', 'border-l-'),
            a.estado === 'EN_GESTION' ? 'shadow-[0_0_20px_rgba(0,229,160,0.05)] border-l-[#00e5a0]' : ''
          )}>
            <div className="flex items-start justify-between gap-4 w-full">
              <div className="flex gap-4">
                <div className="relative shrink-0">
                  <div className={cn("w-12 h-12 rounded-[14px] flex items-center justify-center font-black text-lg", isLight ? 'bg-blue-600/10 text-blue-600' : 'bg-[#1e2e47] text-blue-400')}>
                    {a.login.substring(0, 2).toUpperCase()}
                  </div>
                  <div className={cn("absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-[3px]", isLight ? 'border-white' : 'border-[#1E293B]', st.dot.split('shadow')[0].trim())} />
                </div>
                <div className="flex flex-col pt-0.5">
                  <h4 className={cn("text-[13px] font-black leading-tight tracking-tight", isLight ? 'text-slate-800' : 'text-white')}>{a.nombre_asesor}</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{a.login} - {a.perfil}</p>
                </div>
              </div>
              <div className="text-right shrink-0 pt-0.5">
                <div className="flex items-center gap-1.5 justify-end mb-1 text-slate-400 font-bold">
                  <Clock size={12} className="opacity-70" />
                  <span className={cn("text-[11px] font-mono", isLight ? 'text-blue-600' : 'text-[#4ea8de]')}><TemporizadorEstado lastChange={a.ultimo_cambio_estado} /></span>
                </div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  Operational Load <span className={cn(isLight ? 'text-slate-800' : 'text-white')}>
                    {stats.total} Cases
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-end justify-between mt-6">
              <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border backdrop-blur-sm",
                st.color, st.color.replace('text-', 'bg-').concat('/20'), st.color.replace('text-', 'border-').concat('/40')
              )}>
                {st.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
