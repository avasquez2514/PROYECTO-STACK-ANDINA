"use client";

import React, { useEffect, useState } from "react";
import {
  X, Search, ClipboardList,
  ChevronDown, Zap, MessageSquare, Copy,
  LayoutDashboard, CheckCircle2, AlertCircle, Clock, Megaphone
} from "lucide-react";
import ChatWindow from "../components/ChatWindow";
import LiveTimer from "../components/LiveTimer";
import NoticiaPanel from "../components/NoticiaPanel";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

const estadosAsesorConfig: Record<string, { bg: string, dot: string, border: string }> = {
  "EN_GESTION": { bg: "bg-emerald-500/10 text-emerald-500", dot: "bg-emerald-500 shadow-emerald-500/50", border: "border-emerald-500/20" },
  "EN_DESCANSO": { bg: "bg-slate-500/10 text-slate-400", dot: "bg-slate-500 shadow-slate-500/50", border: "border-white/5" },
  "NO_DISPONIBLE": { bg: "bg-rose-500/10 text-rose-500", dot: "bg-rose-500 shadow-rose-500/50", border: "border-rose-500/20" },
  "CASO_COMPLEJO": { bg: "bg-amber-500/10 text-amber-500", dot: "bg-amber-500 shadow-amber-500/50", border: "border-amber-500/20" }
};

const PERFILES_CONFIG: any = {
  "EN_CIERRES": { label: "Cierres", color: "text-amber-400", bg: "bg-amber-400/10" },
  "SOLO_SOPORTES": { label: "Soporte", color: "text-amber-400", bg: "bg-amber-400/10" },
  "TODO": { label: "Todo gestión:", color: "text-amber-400", bg: "bg-amber-400/10" }
};

export default function DespachoPage() {
  const [datos, setDatos] = useState<any[]>([]);
  const [asesoresSoporte, setAsesoresSoporte] = useState<any[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [loggedUser] = useState("DESPACHO");

  // Chat State
  const [activeChatSoporteId, setActiveChatSoporteId] = useState<number | null>(null);
  const [activeChatIncidente, setActiveChatIncidente] = useState<string>("");
  const [noticia, setNoticia] = useState<any>(null);

  const [openDropdownId, setOpenDropdownId] = useState<{ id: number; type: string } | null>(null);
  const [modalConfig, setModalConfig] = useState<{ id: number; text: string; title: string; evidencias?: string[] } | null>(null);

  // Live Timer State removed to optimize renders

  // Global timer effect removed to avoid full table re-renders

  useEffect(() => {
    setHasMounted(true);
    cargarDatos();
    cargarAsesores();
    cargarNoticia();
    const interval = setInterval(() => {
      cargarDatos();
      cargarAsesores();
      cargarNoticia();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/soporte/");
      const json = await res.json();
      setDatos(json.sort((a: any, b: any) => a.id - b.id));
    } catch (e) { console.error(e); }
  };

  const handleUpdateSoporte = async (id: number, field: string, value: any) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/soporte/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      cargarDatos();
    } catch (e) { console.error(e); }
  };

  const cargarAsesores = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/asesores/");
      const data = await res.json();
      setAsesoresSoporte(data);
    } catch (e) { console.error(e); }
  };

  const cargarNoticia = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/noticias/");
      const data = await res.json();
      const activa = data.find((n: any) => n.activa);
      setNoticia(activa || null);
    } catch (e) { console.error(e); }
  };

  const formatearFecha = (f: string) => {
    if (!f) return "---";
    try {
      const date = new Date(f);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
      
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strHours = hours.toString().padStart(2, '0');

      return `${day}/${month}/${year} | ${strHours}:${minutes}:${seconds} ${ampm}`;
    } catch {
      return f;
    }
  };

  const decodificarObservaciones = (obs: string) => {
    if (!obs) return "--";
    try {
      const parsed = JSON.parse(obs);
      if (typeof parsed === 'object') {
        return Object.entries(parsed)
          .filter(([key, val]) => val && key !== 'incidente' && key !== 'tecnico')
          .map(([_, val]) => `${val}`)
          .join(" ");
      }
    } catch (e) {}
    return obs;
  };

  const formatearPlantilla = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      return Object.entries(data)
        .map(([key, val]) => {
          let label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
          if (label.toLowerCase() === 'incidente') label = 'Inc';
          return `${label}: ${val}`;
        })
        .join('\n');
    } catch (e) {
      return jsonString;
    }
  };

  // calcularTiempo removed from here, now encapsulated in LiveTimer

  const datosFiltrados = datos.filter(d =>
    !busqueda || d.incidente?.toLowerCase().includes(busqueda.toLowerCase()) || d.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const stats = {
    total: datos.length,
    resueltos: datos.filter(d => d.estado === "Resuelto").length,
    enrutados: datos.filter(d => d.estado === "Enrutado").length,
    pendientes: datos.filter(d => !d.login_n1 || d.login_n1 === "POR_ASIGNAR").length
  };

  if (!hasMounted) return <div className="min-h-screen bg-[#060d14]" />;

  return (
    <div className="min-h-screen font-sans selection:bg-[#00e5a0]/30 overflow-hidden flex flex-col relative transition-colors duration-500 bg-[#060d14] text-white">
      {/* Background Decor Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 transition-opacity duration-1000 opacity-40"
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

      <div className="relative z-10 flex h-screen">
        {/* Sidebar - Advisor Status Section */}
        <aside className="w-80 shrink-0 border-r flex flex-col transition-all duration-500 border-[#152233] bg-[#0b1621]/80 backdrop-blur-xl shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
          <div className="p-8 border-b flex items-center gap-4 border-white/5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hud-corners transition-colors bg-[#0b1621] border border-[#152233]">
              <Zap className="text-amber-400" size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter italic uppercase drop-shadow-md text-white shadow-amber-400/50">
                SIMOC <span className="text-amber-400"></span>
              </h1>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] px-2 opacity-70 text-[#608096] glow-text-yellow mb-4">ASESORES EN LÍNEA</h3>

            <div className="flex flex-wrap gap-x-4 gap-y-6 px-2">
              {asesoresSoporte.map((a, i) => {
                const conf = estadosAsesorConfig[a.estado] || estadosAsesorConfig.NO_DISPONIBLE;
                return (
                  <div key={a.id} className="relative group flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "relative w-16 h-16 rounded-full p-1 transition-all duration-500 border-2 flex items-center justify-center",
                        a.estado === 'EN_GESTION' ? 'border-[#00e5a0] shadow-[0_0_15px_rgba(0,229,160,0.2)]' :
                          a.estado === 'EN_DESCANSO' ? 'border-amber-400' :
                            a.estado === 'NO_DISPONIBLE' ? 'border-rose-500' : 'border-white/10'
                      )}
                    >
                      <div className={cn(
                        "w-full h-full rounded-full flex items-center justify-center text-[14px] font-black shadow-inner bg-gradient-to-br",
                        i === 0 ? "from-[#00e5a0] to-[#00b8e5] text-[#061511]" :
                          i === 1 ? "from-[#00b8e5] to-[#0060e5] text-white" :
                            "from-[#e5003d] to-[#800022] text-white"
                      )}>
                        {a.login.substring(0, 2).toUpperCase()}
                      </div>

                      {/* Status Dot Indicator */}
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#0b1621] shadow-lg",
                        conf.dot
                      )} />
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black text-white/80 uppercase tracking-tighter truncate max-w-[64px]">
                        {a.login}
                      </span>
                      {/* Sub-label state */}
                      <span className={cn("text-[7px] font-bold uppercase opacity-60", conf.bg.replace('bg-', 'text-'))}>
                        {a.estado.substring(0, 10)}
                      </span>
                      {/* Profile label */}
                      {a.perfil && PERFILES_CONFIG[a.perfil] && (
                        <span className={cn("text-[6px] font-black uppercase mt-1 px-1.5 py-0.5 rounded-md border border-white/5 animate-blink", PERFILES_CONFIG[a.perfil].bg, PERFILES_CONFIG[a.perfil].color)}>
                          {PERFILES_CONFIG[a.perfil].label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-8 border-t border-white/5 bg-[#0b1621]/40">
            <p className="text-[9px] font-black text-[#608096] text-center uppercase tracking-[0.3em] opacity-50">© 2026 SIMOC SYSTEM</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Header */}
          <header className="h-24 border-b flex items-center justify-between px-10 shrink-0 backdrop-blur-xl transition-all duration-500 border-[#152233] bg-[#0b1621]/60">
            <div className="flex items-center gap-6">
              <h2 className="text-2xl font-black tracking-tighter italic uppercase drop-shadow-md text-white">
                TERMINAL DE <span className="text-amber-400">DESPACHO</span>
              </h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-full animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                <span className="text-[8px] font-black text-amber-400 tracking-widest uppercase">Live System</span>
              </div>
            </div>

            <div className="flex-1 max-w-2xl mx-12 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-[#00b8e5] group-focus-within:text-amber-400 transition-colors" />
              <input
                type="text"
                placeholder="BUSCAR CASO POR INCIDENTE..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full border rounded-2xl py-4 pl-16 pr-6 text-[10px] font-black tracking-[0.2em] outline-none transition-all uppercase placeholder:text-[#3a5c72] bg-[#060d14] border-[#152233] text-white focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(251,191,36,0.1)]"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_emerald]" />
              </div>
            </div>

          </header>

          <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar relative">
            {/* Noticia Panel Section */}
            <NoticiaPanel noticia={noticia} />

            {/* Stats Cards Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: "CASOS TOTALES", value: stats.total, icon: ClipboardList, color: "text-blue-600", bgIcon: "bg-blue-50", borderColor: "border-blue-100" },
                { label: "CASOS RESUELTOS", value: stats.resueltos, icon: CheckCircle2, color: "text-emerald-500", bgIcon: "bg-emerald-50", borderColor: "border-emerald-100" },
                { label: "CASOS ENRUTADOS", value: stats.enrutados, icon: AlertCircle, color: "text-amber-500", bgIcon: "bg-amber-50", borderColor: "border-amber-100" },
                { label: "EN ESPERA", value: stats.pendientes, icon: Clock, color: "text-rose-500", bgIcon: "bg-rose-50", borderColor: "border-rose-100" },
              ].map((s, i) => (
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

            {/* Main Table Section */}
            <div className="rounded-[2.5rem] flex flex-col backdrop-blur-md border transition-all duration-500 bg-[#0b1621]/40 border-[#152233] shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
              <div className="p-8 border-b flex items-center justify-between bg-[#060d14]/50 border-[#152233]">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl border bg-amber-400/10 border-amber-400/30">
                    <LayoutDashboard className="text-amber-400" size={20} />
                  </div>
                  <h3 className="text-[12px] font-black uppercase tracking-[0.4em] drop-shadow-md text-white">MONITOREO DE GESTIONES ACTIVAS</h3>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[1400px] border-collapse">
                  <thead>
                    <tr className="text-[9px] font-bold uppercase tracking-[0.1em] sticky top-0 z-20 text-[#608096] bg-[#060d14] border-b border-[#152233]">
                      <th className="px-4 py-3">FECHA</th>
                      <th className="px-2 py-3 text-center">EN SITIO</th>
                      <th className="px-4 py-3">TÉCNICO</th>
                      <th className="px-4 py-3">CELULAR</th>
                      <th className="px-4 py-3">TORRE ASIGNADA</th>
                      <th className="px-4 py-3">NÚMERO INC</th>
                      <th className="px-4 py-3 text-center">GESTIÓN</th>
                      <th className="px-4 py-3 min-w-[250px]">OBS. TÉCNICAS</th>
                      <th className="px-2 py-3 text-center">PLANTILLA</th>
                      <th className="px-2 py-3 text-center">LOGIN N1</th>
                      <th className="px-2 py-3 text-center">ESTADO</th>
                      <th className="px-4 py-3 text-center">TIEMPO</th>
                      <th className="px-4 py-3 text-center">PRIORIDAD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#152233]/40">
                    {datosFiltrados.map((d) => (
                      <tr key={d.id} className="transition-all group border-l-4 border-transparent hover:border-amber-400/60 hover:bg-[#060d14]/60">
                        <td className="px-4 py-3">
                          <p className="text-[11px] font-bold tracking-tight text-slate-300">{formatearFecha(d.fecha_hora).split('|')[1]}</p>
                          <p className="text-[9px] text-slate-400 font-medium">{formatearFecha(d.fecha_hora).split('|')[0]}</p>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <span className={cn(
                            "text-[10px] font-black px-2.5 py-1 rounded-lg transition-all",
                            d.en_sitio
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          )}>
                            {d.en_sitio ? "SI" : "NO"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-black uppercase tracking-tight text-white group-hover:text-amber-400 transition-colors">{d.nombre}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-bold text-slate-400">{d.celular || "---"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-bold uppercase tracking-tighter truncate max-w-[150px] inline-block text-white">{d.torre}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-[#0b1621] text-white rounded-lg font-mono font-black text-[10px] border border-white/20">
                              {d.incidente || "INC-0000"}
                            </span>
                            <button
                              onClick={(e) => {
                                navigator.clipboard.writeText(d.incidente || "INC-0000");
                                const btn = e.currentTarget;
                                const originalHtml = btn.innerHTML;
                                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                                setTimeout(() => {
                                  btn.innerHTML = originalHtml;
                                }, 1500);
                              }}
                              className="p-1.5 hover:bg-[#00e5a0]/20 hover:text-[#00e5a0] text-[#608096] rounded-md transition-all border border-transparent hover:border-[#00e5a0]/30 shadow-sm"
                              title="Copiar Incidente"
                            >
                              <Copy size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border",
                            d.gestion === 'AUSENCIA' || d.gestion === 'ASESORIA' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                              d.gestion === 'DIRECTO' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                                'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          )}>
                            {d.gestion}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[11px] font-medium italic line-clamp-2 max-w-[250px] text-slate-400 group-hover:text-white transition-colors" title={decodificarObservaciones(d.observaciones)}>
                            {decodificarObservaciones(d.observaciones)}
                          </p>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            onClick={() => {
                              const textoFormateado = formatearPlantilla(d.plantilla || "{}");
                              let evList: string[] = [];
                              if (d.evidencias_files && (d.evidencias_files as any[]).length > 0) {
                                evList = (d.evidencias_files as any[]).map(f => `http://127.0.0.1:8000${f.archivo}`);
                              } else {
                                try { if (d.evidencias) evList = JSON.parse(d.evidencias); } catch (e) { }
                              }
                              setModalConfig({ id: d.id, text: textoFormateado, title: "PLANTILLA TÉCNICA", evidencias: evList });
                            }}
                            className="p-2 border rounded-xl transition-all flex items-center justify-center mx-auto hover:bg-[#00b8e5]/5 bg-[#060d14] border-[#152233] text-[#608096]"
                          >
                            <ClipboardList size={14} strokeWidth={2} />
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <div
                            className="w-32 border text-[9px] font-black uppercase py-2 px-3 rounded-xl flex items-center justify-between mx-auto bg-[#060d14] border-[#152233] text-white opacity-80"
                          >
                            <span className="truncate pr-2">{d.login_n1 === "POR_ASIGNAR" ? "--" : d.login_n1}</span>
                            <ChevronDown size={10} className="text-white/40" />
                          </div>
                        </td>
                        <td className="px-8 py-3 text-center">
                          <div
                            className={cn(
                              "w-28 border text-[9px] font-black rounded-xl py-1.5 px-3 flex items-center justify-center mx-auto opacity-80 transition-all",
                              d.estado === 'Resuelto' || d.estado === 'ACTIVO' ? 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20' :
                                d.estado === 'En gestión' || d.estado === 'PENDIENTE' ? 'bg-[#00b8e5]/10 text-[#00b8e5] border-[#00b8e5]/20' :
                                  d.estado === 'Enrutado' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                                    d.estado === 'Mal Escalado' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                      "bg-[#060d14] text-white border-[#152233]"
                            )}
                          >
                            <span className="truncate uppercase">{d.estado || "---"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "text-[10px] font-black px-3 py-1.5 rounded-xl transition-all inline-flex items-center justify-center gap-2",
                            d.estado === 'Resuelto' ? 'text-emerald-500 animate-pulse-slow' :
                              d.estado === 'Enrutado' ? 'text-amber-400' :
                                d.estado === 'Mal Escalado' ? 'text-rose-500' :
                                  'text-white'
                          )}>
                            {!d.fecha_fin && d.fecha_inicio_sitio && (
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                            )}
                            <LiveTimer inicio={d.fecha_inicio_sitio} fin={d.fecha_fin} />
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleUpdateSoporte(d.id, "prioridad", !d.prioridad)}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                              d.prioridad 
                                ? "bg-rose-500 text-white border-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse" 
                                : "bg-[#060d14] text-[#608096] border-[#152233] hover:border-rose-500/50 hover:text-rose-400"
                            )}
                          >
                            {d.prioridad ? "PRIORIDAD ALTA" : "NORMAL"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* VISOR MODAL (READ-ONLY FOR DESPACHO) */}
      {modalConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xl animate-in fade-in p-8 bg-[#060d14]/80">
          <div className="border rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] w-full max-w-3xl overflow-hidden flex flex-col h-[700px] hud-corners transition-all duration-500 bg-[#0b1621] border-[#152233]">
            <div className="p-10 border-b flex justify-between items-center bg-[#060d14]/40 border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 border rounded-2xl flex items-center justify-center transition-colors bg-[#00b8e5]/10 border-[#00b8e5]/30 text-[#00b8e5]">
                  <ClipboardList size={24} />
                </div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter drop-shadow-lg text-white">{modalConfig.title}</h2>
              </div>
              <button onClick={() => setModalConfig(null)} className="p-4 rounded-2xl border transition-all bg-[#060d14] hover:bg-rose-500/10 text-white hover:text-rose-500 border-[#152233]">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 p-10 overflow-hidden flex flex-col gap-6">
              <p className="text-[10px] font-black text-[#00b8e5] uppercase tracking-[0.4em] opacity-80">CONTENIDO ESTRUCTURADO REGISTRADO</p>
              <div className="flex-1 p-10 rounded-[2.5rem] border shadow-inner overflow-hidden flex flex-col bg-[#060d14] border-white/5">
                <textarea
                  className="w-full flex-1 bg-transparent text-sm font-mono whitespace-pre-wrap leading-relaxed outline-none resize-none custom-scrollbar text-white"
                  value={modalConfig.text}
                  readOnly={true}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(modalConfig.text);
                  }}
                  className="w-full py-5 border-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 bg-[#0b1621] border-[#00b8e5]/40 text-[#00b8e5] hover:bg-[#00b8e5] hover:text-[#061511] shadow-[0_0_20px_rgba(0,184,229,0.1)]"
                >
                  Copiar información
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHAT WINDOW */}
      {activeChatSoporteId !== null && (
        <ChatWindow
          soporteId={activeChatSoporteId}
          incidente={activeChatIncidente}
          remitenteActual={"DESPACHO"}
          nombreRemitente={loggedUser}
          onClose={() => setActiveChatSoporteId(null)}
        />
      )}
    </div>
  );
}
