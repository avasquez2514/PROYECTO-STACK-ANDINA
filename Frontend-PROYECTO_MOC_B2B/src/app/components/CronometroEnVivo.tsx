"use client";

import React, { useState, useEffect } from "react";

/**
 * Propiedades del cronómetro en vivo para gestiones de despacho.
 * @interface LiveTimerProps
 */
interface LiveTimerProps {
  /** Timestamp ISO de inicio de la acción. */
  inicio: string | null;
  /** Timestamp ISO opcional de finalización; si no se provee, el reloj sigue corriendo. */
  fin: string | null;
}

/**
 * Componente CronometroEnVivo
 * 
 * Un reloj digital de alta precisión que calcula la diferencia entre el inicio y el ahora (o fin).
 * Utiliza `setInterval` cada segundo para actualizar la interfaz.
 * Ideal para medir tiempos de respuesta en incidentes de soporte.
 * 
 * @param {LiveTimerProps} props
 */
export default function CronometroEnVivo({ inicio, fin }: LiveTimerProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Si ya terminó, no necesitamos actualizar (optimizacion)
    if (fin) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fin]);

  if (!inicio) return <span className="text-[#608096]">--:--:--</span>;

  const start = new Date(inicio).getTime();
  const end = fin ? new Date(fin).getTime() : now.getTime();
  const diff = Math.max(0, end - start);

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  return (
    <div className="flex items-center gap-1 font-mono tracking-widest text-[11px] tabular-nums justify-center text-amber-500 bg-amber-500/5 px-2 py-1 rounded-lg border border-amber-500/10 shadow-inner">
      <div className="flex items-baseline gap-0.5">
        <span className="w-5 text-right px-1 bg-amber-500/20 rounded-md border border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]">{h.toString().padStart(2, '0')}</span>
        <span className="text-[7px] text-amber-500/80 font-sans uppercase font-black">h</span>
      </div>
      <span className="opacity-60 animate-pulse font-bold text-amber-500">:</span>
      <div className="flex items-baseline gap-0.5">
        <span className="w-5 text-right px-1 bg-amber-500/20 rounded-md border border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]">{m.toString().padStart(2, '0')}</span>
        <span className="text-[7px] text-amber-500/80 font-sans uppercase font-black">m</span>
      </div>
      <span className="opacity-60 animate-pulse font-bold text-amber-500">:</span>
      <div className="flex items-baseline gap-0.5">
        <span className="w-5 text-right px-1 bg-amber-500/20 rounded-md border border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]">{s.toString().padStart(2, '0')}</span>
        <span className="text-[7px] text-amber-500/80 font-sans uppercase font-black">s</span>
      </div>
    </div>
  );
}
