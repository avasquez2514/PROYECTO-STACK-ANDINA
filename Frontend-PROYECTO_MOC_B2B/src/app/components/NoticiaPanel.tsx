"use client";

import React from "react";
import { Megaphone } from "lucide-react";

interface Noticia {
  contenido: string;
  fecha_publicacion: string;
  activa: boolean;
}

interface NoticiaPanelProps {
  noticia: Noticia | null;
}

export default function NoticiaPanel({ noticia }: NoticiaPanelProps) {
  if (!noticia) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="relative group overflow-hidden rounded-[1.5rem] bg-[#0b1621]/40 border border-white/5 shadow-2xl news-glass">
        <div className="flex items-center h-16 relative">
          {/* Fixed Label Section */}
          <div className="z-20 h-full flex items-center px-8 bg-[#0b1621] border-r border-white/5 shadow-[20px_0_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4">
              <div className="relative w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <Megaphone size={18} className="animate-bounce-subtle" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500/90 leading-none">AVISO IMPORTANTE</span>
                <span className="text-[7px] font-bold uppercase tracking-widest text-[#608096] mt-1">Live Update</span>
              </div>
            </div>
          </div>

          {/* Marquee Content Section */}
          <div className="flex-1 h-full overflow-hidden relative flex items-center">
            <div className="w-full whitespace-nowrap overflow-hidden h-full flex items-center">
              <div className="animate-marquee flex gap-12 items-center">
                {/* Repetimos el mensaje para un loop infinito sin cortes */}
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-6">
                    <p className="text-sm font-black text-white uppercase tracking-wide">
                      {noticia.contenido}
                    </p>
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#fbbf24] animate-pulse shrink-0" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Fade Edge overlays */}
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0b1621]/80 to-transparent pointer-events-none z-10" />
          </div>

          {/* Time Section */}
          <div className="z-20 h-full flex items-center px-8 bg-[#0b1621]/80 border-l border-white/5 opacity-80 backdrop-blur-md">
            <div className="flex flex-col items-end">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#608096]">Hoy</p>
              <p className="text-[10px] font-mono text-white/60 mt-0.5">
                {new Date(noticia.fecha_publicacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
