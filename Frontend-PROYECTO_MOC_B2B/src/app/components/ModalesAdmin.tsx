import React from "react";
import { X, Check, History, Trash2, Clock, ShieldCheck, User, FileJson } from "lucide-react";
import TemporizadorEstado from "./TemporizadorEstado";
import { ESTADOS_CONFIG, PERFILES_CONFIG } from "../../constants";
import { formatSeconds } from "../../utils/formatters";
import { AsesorSoporte } from "../../types";

/**
 * Propiedades del Gestor de Modales (Administración).
 * @interface AdminModalsProps
 */
interface AdminModalsProps {
  /** Configuración cargada del modal: tipo (entidad), modo (nuevo/editar) y los datos persistidos. */
  modalConfig: {
    type: 'asesor' | 'funcionario' | 'soporte' | 'asesor_history' | 'noticia';
    mode: 'add' | 'edit';
    data?: any;
  } | null;
  /** Función para mutar o cerrar la vista de configuración del modal. */
  setModalConfig: (config: any) => void;
  /** Tema escogido (oscuro/claro) aplicado de forma transversal en Admin. */
  theme: string;
  /** JSON de la nómina de todos los asesores para Dropdowns o listados internos. */
  asesores: AsesorSoporte[];
  /** Wrapper/Hook asíncrono para abstraer mutaciones POST/PATCH a la DB. */
  handleAction: (endpoint: string, method: string, id?: number, data?: any) => Promise<void>;
  /** Callback para limpiar o resetear el historial de estados de nivel 1. */
  handleClearHistory: (asesorId: number) => Promise<void>;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Componente ModalesAdmin
 * 
 * Centralizador / Enrutador de modales en el Panel de Administrador.
 * En función de la propiedad `type` del `modalConfig`, renderiza visualmente
 * diferentes formularios (crear/editar asesores, despachadores, noticias o casos).
 * Es un "God Component" visual aislado.
 * 
 * @param {AdminModalsProps} props - Variables estado/setters para hidratar al hijo renderizado.
 * @returns {JSX.Element | null} Formulario central en PopUp Glassmorph.
 */
export default function ModalesAdmin({
  modalConfig,
  setModalConfig,
  theme,
  asesores,
  handleAction,
  handleClearHistory
}: AdminModalsProps) {
  if (!modalConfig) return null;

  const isLight = theme === 'light';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    
    if (modalConfig.type === 'asesor_history') return;

    handleAction(
      modalConfig.type === 'asesor' ? 'asesores' :
        modalConfig.type === 'funcionario' ? 'funcionarios' : 'noticias',
      modalConfig.mode === 'add' ? 'POST' : 'PATCH',
      modalConfig.data?.id,
      data
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl relative">
        <button 
          onClick={() => setModalConfig(null)} 
          className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all"
        >
          <X size={24} />
        </button>

        <div className="p-10 border-b border-white/5 space-y-2">
          <h3 className="text-2xl font-black uppercase italic tracking-tighter">
            {modalConfig.mode === 'add' ? 'Registrar Nuevo' : 'Editar Datos de'} {modalConfig.type}
          </h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Completa la información técnica para el backend
          </p>
        </div>

        <form className="p-10 space-y-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-8">
            {modalConfig.type === 'asesor_history' ? (
              <div className="col-span-2 space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-black">
                      {modalConfig.data?.login?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase text-white">{modalConfig.data?.nombre_asesor}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{modalConfig.data?.login}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Estado Actual</p>
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase", 
                        ESTADOS_CONFIG[modalConfig.data?.estado]?.color.replace('text', 'bg').replace('500', '500/20'), 
                        ESTADOS_CONFIG[modalConfig.data?.estado]?.color
                      )}>
                        {ESTADOS_CONFIG[modalConfig.data?.estado]?.label || modalConfig.data?.estado}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleClearHistory(modalConfig.data?.id)}
                      className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 rounded-2xl transition-all flex items-center gap-2 group shadow-lg shadow-rose-500/5 group-hover:scale-105 active:scale-95"
                    >
                      <Trash2 size={16} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Vaciar Historial</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-white/5 rounded-[2rem] overflow-hidden">
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 sticky top-0">
                        <tr>
                          <th className="px-6 py-4">ESTADO</th>
                          <th className="px-6 py-4">INICIO</th>
                          <th className="px-6 py-4">FIN</th>
                          <th className="px-6 py-4 text-right">DURACIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="text-[10px] font-bold divide-y divide-white/5 text-slate-400">
                        {modalConfig.data?.historial_estados?.length > 0 ? (
                          modalConfig.data.historial_estados.map((h: any, idx: number) => (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-all">
                              <td className="px-6 py-4">
                                <span className={cn("uppercase", ESTADOS_CONFIG[h.estado]?.color)}>
                                  {ESTADOS_CONFIG[h.estado]?.label || h.estado}
                                </span>
                              </td>
                              <td className="px-6 py-4">{new Date(h.fecha_inicio).toLocaleString()}</td>
                              <td className="px-6 py-4">{h.fecha_fin ? new Date(h.fecha_fin).toLocaleString() : <span className="text-emerald-500 animate-pulse">ACTIVO</span>}</td>
                              <td className="px-6 py-4 text-right font-mono text-slate-300">
                                {h.duracion_segundos ? formatSeconds(h.duracion_segundos) : <TemporizadorEstado lastChange={h.fecha_inicio} />}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-600 italic uppercase text-[9px] tracking-widest font-black">No hay registros previos en el historial</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : modalConfig.type === 'asesor' ? (
              <>
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Nombre Completo</label>
                  <input name="nombre_asesor" defaultValue={modalConfig.data?.nombre_asesor} className={cn("w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-500/50", isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-500/5 border-white/10 text-white')} required placeholder="EJ: JUAN PEREZ" />
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Cédula</label>
                  <input name="cedula" defaultValue={modalConfig.data?.cedula} className={cn("w-full border p-5 rounded-2xl text-xs font-black outline-none focus:border-blue-500/50", isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-500/5 border-white/10 text-white')} required placeholder="1010..." />
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Login / Usuario</label>
                  <input name="login" defaultValue={modalConfig.data?.login} className={cn("w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-500/50", isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-500/5 border-white/10 text-white')} required placeholder="USER_N1" />
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Perfil de Asistencia</label>
                  <select name="perfil" defaultValue={modalConfig.data?.perfil || 'TODO'} className={cn("w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none", isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-800 border-white/10 text-white')}>
                    {Object.entries(PERFILES_CONFIG).map(([v, c]: any) => <option key={v} value={v}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Estado Actual</label>
                  <select name="estado" defaultValue={modalConfig.data?.estado || 'NO_DISPONIBLE'} className={cn("w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none", isLight ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-800 border-white/10 text-white')}>
                    {Object.entries(ESTADOS_CONFIG).map(([v, c]: any) => <option key={v} value={v}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-4 col-span-2">
                  <label className="text-[9px] font-black text-emerald-500 uppercase px-1 tracking-widest">Contraseña de Acceso (Técnico)</label>
                  <input name="password" defaultValue={modalConfig.data?.password} className="w-full bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl text-xs font-black outline-none focus:border-emerald-500/50" required placeholder="CLAVE123" />
                </div>
              </>
            ) : modalConfig.type === 'funcionario' ? (
              <>
                <div className="space-y-4 col-span-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Nombre del Funcionario</label>
                  <input name="nombre" defaultValue={modalConfig.data?.nombre || modalConfig.data?.nombre_funcionario} className="w-full bg-slate-500/5 border border-white/10 p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-500/50" required />
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Cédula</label>
                  <input name="cedula" defaultValue={modalConfig.data?.cedula} className="w-full bg-slate-500/5 border border-white/10 p-5 rounded-2xl text-xs font-black outline-none focus:border-blue-500/50" required />
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Celular</label>
                  <input name="celular" defaultValue={modalConfig.data?.celular} className="w-full bg-slate-500/5 border border-white/10 p-5 rounded-2xl text-xs font-black outline-none focus:border-blue-500/50" placeholder="300..." />
                </div>
                <div className="space-y-4 col-span-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest text-[#00e5a0]">Contraseña de Acceso</label>
                  <input name="password" defaultValue={modalConfig.data?.password} className="w-full bg-[#00e5a0]/5 border border-[#00e5a0]/20 p-5 rounded-2xl text-xs font-black outline-none focus:border-[#00e5a0]/50 text-[#00e5a0]" placeholder="ACCESO_TEC" />
                </div>
              </>
            ) : modalConfig.type === 'noticia' ? (
              <>
                <div className="col-span-2 space-y-4">
                  <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Novedad / Anuncio (Máx. 500 carac.)</label>
                  <textarea
                    name="contenido"
                    defaultValue={modalConfig.data?.contenido}
                    className="w-full bg-slate-500/5 border border-white/10 p-6 rounded-3xl text-sm font-black uppercase outline-none focus:border-amber-500/50 h-40 resize-none leading-relaxed"
                    required
                    placeholder="Ej: Estimados técnicos, favor reportar..."
                  />
                </div>
                <div className="flex items-center gap-4 col-span-2">
                  <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <input
                      type="checkbox"
                      name="activa"
                      id="activa_news"
                      defaultChecked={modalConfig.mode === 'add' ? true : modalConfig.data?.activa}
                      className="w-5 h-5 rounded border-white/10 bg-[#060d14] text-amber-500"
                    />
                    <label htmlFor="activa_news" className="text-[10px] font-black uppercase text-white cursor-pointer">Mostrar inmediatamente</label>
                  </div>
                </div>
              </>
            ) : modalConfig.type === 'soporte' && (
              <div className="col-span-2 space-y-8 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className={cn("p-6 rounded-[2rem] border shadow-xl", isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/5')}>
                    <div className="flex items-center gap-3 mb-4 text-emerald-500">
                      <Clock size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">Timestamp</span>
                    </div>
                    <p className={cn("text-sm font-mono font-black", isLight ? 'text-black' : 'text-white')}>{new Date(modalConfig.data?.fecha_hora).toLocaleString('es-CO')}</p>
                  </div>
                  <div className={cn("p-6 rounded-[2rem] border shadow-xl", isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/5')}>
                    <div className="flex items-center gap-3 mb-4 text-amber-500">
                      <ShieldCheck size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">Radicado Incident</span>
                    </div>
                    <p className={cn("text-sm font-mono font-black italic", isLight ? 'text-black' : 'text-white')}>#{modalConfig.data?.incidente || '---'}</p>
                  </div>
                </div>

                <div className={cn("p-8 rounded-[2.5rem] border shadow-inner space-y-6", isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/5')}>
                  <div className={cn("flex items-center gap-4 border-b pb-4", isLight ? 'border-slate-300' : 'border-white/5')}>
                    <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500"><User size={20} /></div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Información del Funcionario</h4>
                      <p className={cn("text-lg font-black uppercase tracking-tighter italic leading-none", isLight ? 'text-black' : 'text-white')}>{modalConfig.data?.nombre}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 px-2">
                    <div>
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Celular Reportado</span>
                      <span className="text-xs font-black text-blue-400">{modalConfig.data?.celular || '---'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Ubicación / Torre</span>
                      <span className={cn("text-xs font-black uppercase", isLight ? 'text-black' : 'text-white')}>{modalConfig.data?.torre || '---'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Procedimiento / Gestión Realizada</span>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[8px] font-black uppercase border border-blue-500/20">{modalConfig.data?.gestion}</span>
                  </div>
                  <div className={cn("p-8 rounded-[2.5rem] border italic text-sm font-serif leading-relaxed shadow-lg text-slate-400", isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-500/5 border-white/5')}>
                    "{modalConfig.data?.observaciones || 'Sin observaciones registradas.'}"
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-black text-amber-500 uppercase px-2 tracking-widest flex items-center gap-2 italic">
                    <FileJson size={14} /> Plantilla Técnica Enviada:
                  </span>
                  <pre className="p-8 bg-slate-950 rounded-[2rem] border border-white/5 text-[10px] font-mono text-emerald-400 shadow-2xl overflow-x-auto custom-scrollbar">
                    {(() => {
                      try {
                        const p = JSON.parse(modalConfig.data?.plantilla);
                        return JSON.stringify(p, null, 4);
                      } catch (e) {
                        return modalConfig.data?.plantilla;
                      }
                    })()}
                  </pre>
                </div>

                <div className="flex items-center justify-between p-6 bg-blue-600/5 rounded-[2rem] border border-blue-600/10 border-dashed">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500"><ShieldCheck size={14} /></div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Asesor Atendente</span>
                  </div>
                  <span className="text-xs font-black text-blue-400 uppercase italic tracking-tighter leading-none">{modalConfig.data?.login_n1 || '---'}</span>
                </div>
              </div>
            )}
          </div>

          {modalConfig.type !== 'soporte' && modalConfig.type !== 'asesor_history' && (
            <button type="submit" className="w-full py-6 bg-blue-600 shadow-xl shadow-blue-500/30 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4">
              <Check size={18} /> {modalConfig.mode === 'add' ? 'Confirmar Registro' : 'Guardar Cambios'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
