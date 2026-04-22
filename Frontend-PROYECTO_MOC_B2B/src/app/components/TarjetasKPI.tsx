import React from 'react';
import { ClipboardList, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Soporte } from "../../types";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Interfaz de propiedades KPI.
 * @interface KPICardsProps
 */
interface KPICardsProps {
  /** Lista cruda de todas las gestiones / soportes para el conteo automático. */
  datos: Soporte[];
}

/**
 * Componente TarjetasKPI
 * 
 * Muestra las 4 tarjetas clave (Cards): Totales, Resueltos, Enrutados y Pendientes
 * calculados iterando sobre la data del JSON de Soportes.
 * 
 * @param {KPICardsProps} props - Datos del endpoint principal.
 * @returns {JSX.Element} Fila de 4 tarjetas glassmorphism oscuras.
 */
export default function TarjetasKPI({ datos }: KPICardsProps) {
  const stats = {
    total: datos.length,
    resueltos: datos.filter(d => d.estado === "Resuelto" || d.estado === "ACTIVO").length,
    enrutados: datos.filter(d => d.estado === "Enrutado").length,
    pendientes: datos.filter(d => !d.login_n1 || d.login_n1 === "POR_ASIGNAR").length
  };

  const cards = [
    { label: "CASOS TOTALES", value: stats.total, icon: ClipboardList, color: "text-blue-600", bgIcon: "bg-blue-50", borderColor: "border-blue-100" },
    { label: "CASOS RESUELTOS", value: stats.resueltos, icon: CheckCircle2, color: "text-emerald-500", bgIcon: "bg-emerald-50", borderColor: "border-emerald-100" },
    { label: "CASOS ENRUTADOS", value: stats.enrutados, icon: AlertCircle, color: "text-amber-500", bgIcon: "bg-amber-50", borderColor: "border-amber-100" },
    { label: "EN ESPERA", value: stats.pendientes, icon: Clock, color: "text-rose-500", bgIcon: "bg-rose-50", borderColor: "border-rose-100" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
      {cards.map((s, i) => (
        <div key={i} className="p-6 rounded-2xl transition-all relative overflow-hidden group border bg-[#0b1621]/40 border-[#152233] shadow-lg">
          <div className="flex items-center gap-6 relative z-10">
            <div className={cn(
              "w-14 h-14 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110 bg-[#060d14] border-white/5 ",
              s.color
            )}>
              <s.icon size={24} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1 text-[#608096]">{s.label}</p>
              <p className="text-4xl font-black italic tracking-tighter text-white">{s.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
