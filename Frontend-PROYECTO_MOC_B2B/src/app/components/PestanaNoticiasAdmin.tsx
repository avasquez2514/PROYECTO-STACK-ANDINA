import React from "react";
import { Edit2, Trash2, BellRing, Megaphone } from "lucide-react";
import { Noticia } from "../../types";

interface AdminTabNoticiasProps {
  noticias: Noticia[];
  theme: string;
  setModalConfig: (config: any) => void;
  handleAction: (endpoint: string, method: string, id?: number, data?: any) => Promise<void>;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

export default function PestanaNoticiasAdmin({
  noticias,
  theme,
  setModalConfig,
  handleAction
}: AdminTabNoticiasProps) {
  const isLight = theme === 'light';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {noticias.map((n) => (
          <div key={n.id} className={cn(
            "glass-panel p-10 rounded-[3rem] border transition-all relative group overflow-hidden",
            n.activa ? "border-amber-500/30 shadow-[0_20px_40px_rgba(245,158,11,0.1)]" : "border-white/5 opacity-60"
          )}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-4 rounded-3xl", n.activa ? "bg-amber-500/10 text-amber-500" : "bg-slate-500/10 text-slate-500")}>
                  <BellRing size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    Publicado en: {new Date(n.fecha_publicacion).toLocaleDateString()}
                  </span>
                  <h4 className={cn("text-lg font-black uppercase leading-tight mt-1 truncate max-w-[200px]", isLight ? 'text-slate-800' : 'text-white')}>
                    {n.contenido}
                  </h4>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                  n.activa ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-white/10"
                )}>
                  {n.activa ? "VISIBLE" : "OCULTA"}
                </span>
              </div>
            </div>

            <p className={cn("text-sm font-medium leading-relaxed mb-8 h-20 overflow-hidden line-clamp-3 italic uppercase font-black", isLight ? 'text-slate-700' : 'text-slate-400')}>
              {n.contenido}
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex gap-4">
                <button 
                  onClick={() => setModalConfig({ type: 'noticia', mode: 'edit', data: n })} 
                  className="p-3 text-blue-500 hover:bg-blue-500/10 rounded-2xl transition-all border border-transparent hover:border-blue-500/20"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => { if (confirm('¿ELIMINAR NOVEDAD?')) handleAction('noticias', 'DELETE', n.id) }} 
                  className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all border border-transparent hover:border-rose-500/20"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <button
                onClick={() => handleAction('noticias', 'PATCH', n.id, { activa: !n.activa })}
                className={cn(
                  "px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all",
                  n.activa ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20"
                )}
              >
                {n.activa ? "Desactivar" : "Activar Ahora"}
              </button>
            </div>
          </div>
        ))}
        {noticias.length === 0 && (
          <div className="col-span-2 py-20 text-center glass-panel rounded-[3rem] border border-white/5">
            <Megaphone size={48} className="mx-auto text-slate-700 mb-6 opacity-20" />
            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">No hay noticias registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
