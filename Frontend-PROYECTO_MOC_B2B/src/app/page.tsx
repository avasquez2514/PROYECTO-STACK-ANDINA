"use client";

import React from "react";
import { Activity, Zap, ShieldCheck, ChevronRight, Briefcase } from "lucide-react";
import Link from "next/link";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Página de Lanzamiento (Landing Page)
 * 
 * Punto de entrada principal (`/`) de la aplicación SIMOC.
 * Funciona como un orquestador de módulos que presenta los accesos directos
 * a las 4 consolas operativas: Técnicos, Soporte, Despacho y Administración.
 * 
 * @returns {JSX.Element} Menú de selección de módulos.
 */
const LandingPage = () => {
  const modules = [
    { 
      id: "tecnicos", 
      label: "Técnicos de Campo", 
      icon: Zap, 
      href: "/1_tecnicos", 
      color: "#00e5a0", 
      bg: "bg-[#0b2018]",
      desc: "Registro de gestiones y plantillas técnicas" 
    },
    { 
      id: "soporte", 
      label: "Consola de Soporte", 
      icon: Activity, 
      href: "/2_soporte", 
      color: "#00b8e5", 
      bg: "bg-[#081e28]",
      desc: "Asignación de incidentes y novedades" 
    },
    { 
      id: "despacho", 
      label: "Consola de Despacho", 
      icon: Briefcase, 
      href: "/3_despacho", 
      color: "#e5b800", 
      bg: "bg-[#1e1a06]",
      desc: "Monitoreo y resolución de incidentes" 
    },
    { 
      id: "admin", 
      label: "Control Center", 
      icon: ShieldCheck, 
      href: "/4_administrador", 
      color: "#e5003d", 
      bg: "bg-[#200a10]",
      desc: "Administración y control de usuarios" 
    },
  ];

  return (
    <div className="min-h-screen bg-[#060d14] text-white relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(ellipse 55% 65% at 10% 55%, #0a2a44 0%, transparent 65%),
              radial-gradient(ellipse 45% 50% at 88% 18%, #082a1e 0%, transparent 60%),
              radial-gradient(ellipse 40% 40% at 70% 85%, #051820 0%, transparent 60%),
              #060d14
            `
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center space-y-12 animate-in fade-in duration-700">
        {/* Top Icon */}
        <div className="w-14 h-14 bg-[#00e5a0] rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(0,229,160,0.3)] mb-2">
            <Activity className="text-[#04130d] w-7 h-7" />
        </div>

        {/* Title Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tight uppercase leading-[0.9] max-w-4xl">
            SISTEMA DE CONTROL DE<br />DESPACHO <span className="text-[#00e5a0]">SIMOC</span>
          </h1>
          
          <div className="flex items-center justify-center gap-4 opacity-40 pt-2">
            <div className="h-px w-10 bg-[#1e3a50]" />
            <p className="text-[8px] font-black uppercase tracking-[0.4em]">Operational Management Unit · V.02 · Anderson Vasquez G.</p>
            <div className="h-px w-10 bg-[#1e3a50]" />
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full pt-8">
          {modules.map((m) => (
            <Link href={m.href} key={m.id} className="group">
              <div className="bg-[#0b1621]/40 border border-[#152233] p-8 rounded-2xl h-full flex flex-col justify-between transition-all duration-300 hover:border-[#00e5a0]/30 hover:translate-y-[-5px] hover:bg-[#0b1621]/60 shadow-xl">
                <div className="space-y-6">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                    m.bg
                  )} style={{ color: m.color }}>
                    <m.icon size={18} />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-black uppercase italic leading-tight group-hover:text-[#00e5a0] transition-colors">{m.label}</h3>
                    <p className="text-[8px] font-bold text-[#3a5c72] leading-relaxed uppercase tracking-widest">{m.desc}</p>
                  </div>
                </div>

                <div className="mt-12 flex items-center justify-between">
                  <span className="text-[8px] font-black text-[#608096] uppercase tracking-[0.1em]">Acceder Módulo</span>
                  <div className="w-7 h-7 rounded-lg border border-[#1e3a50] bg-[#0d1f2e] flex items-center justify-center text-[#5e7d8f] group-hover:border-[#00e5a0]/50 group-hover:bg-[#0d2a1e] group-hover:text-[#00e5a0] transition-all">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-20 text-center opacity-25">
          <p className="text-[8px] font-black uppercase tracking-[0.3em]">
            © 2026 SIMOC SYSTEM · DESARROLLADO POR ANDERSON VASQUEZ GONZALEZ · V.02 · SECURITY CLEARANCE REQUIRED
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
