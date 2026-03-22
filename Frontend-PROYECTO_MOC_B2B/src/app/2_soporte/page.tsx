"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  X, Search, ClipboardList, FileText,
  ChevronDown, Zap, MessageSquare, Copy,
  Activity, LayoutDashboard, CheckCircle2, AlertCircle, Clock, Image as ImageIcon, Megaphone
} from "lucide-react";
import ChatWindow from "../components/ChatWindow";
import LiveTimer from "../components/LiveTimer";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

const estadosGestion = ["En gestión", "Enrutado", "Resuelto", "Mal Escalado"];

const coloresEstadoGestion: Record<string, string> = {
  "En gestión": "bg-[#00b8e5]/10 text-[#00b8e5] border-[#00b8e5]/20",
  "Enrutado": "bg-amber-400/10 text-amber-400 border-amber-400/20",
  "Resuelto": "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
  "Mal Escalado": "bg-rose-500/10 text-rose-500 border-rose-500/20"
};

const estadosAsesorConfig: Record<string, { bg: string, dot: string, border: string }> = {
  "EN_GESTION": { bg: "bg-emerald-500/10 text-emerald-500", dot: "bg-emerald-500 shadow-emerald-500/50", border: "border-emerald-500/20" },
  "EN_DESCANSO": { bg: "bg-slate-500/10 text-slate-400", dot: "bg-slate-500 shadow-slate-500/50", border: "border-white/5" },
  "NO_DISPONIBLE": { bg: "bg-rose-500/10 text-rose-500", dot: "bg-rose-500 shadow-rose-500/50", border: "border-rose-500/20" },
  "CASO_COMPLEJO": { bg: "bg-amber-500/10 text-amber-500", dot: "bg-amber-500 shadow-amber-500/50", border: "border-amber-500/20" }
};

export default function SoportePage() {
  const [datos, setDatos] = useState<any[]>([]);
  const [asesoresSoporte, setAsesoresSoporte] = useState<any[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [loggedUser, setLoggedUser] = useState("AVASQUEZ"); // Mock or from context

  // Chat State
  const [activeChatSoporteId, setActiveChatSoporteId] = useState<number | null>(null);
  const [activeChatIncidente, setActiveChatIncidente] = useState<string>("");

  const [modalConfig, setModalConfig] = useState<{ id: number; text: string; title: string; evidencias?: string[] } | null>(null);

  // Live Timer State removed to optimize renders

  // Dropdown States
  const [openDropdownId, setOpenDropdownId] = useState<{ id: number; type: 'login' | 'estado' } | null>(null);
  const [openAdvisorDropdown, setOpenAdvisorDropdown] = useState<number | null>(null);
  const [noticia, setNoticia] = useState<any>(null);

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
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/soporte/");
      const json = await res.json();
      setDatos(json.sort((a: any, b: any) => a.id - b.id));
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

  const actualizarSoporte = async (id: number, field: string, value: any) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/soporte/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      cargarDatos();
    } catch (e) { console.error(e); }
  };

  const handleCambioEstadoAsesor = async (id: number, nuevoEstado: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/asesores/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      cargarAsesores();
    } catch (e) { console.error(e); }
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
    } catch (e) { }
    return obs;
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
              <Zap className="text-[#00e5a0]" size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter italic uppercase drop-shadow-md text-white shadow-[#00e5a0]/50">
                SIMOC<span className="text-[#00e5a0]"></span>
              </h1>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] px-2 opacity-70 text-[#608096] glow-text-green mb-4">ASESORES EN LÍNEA</h3>

            <div className="flex flex-wrap gap-x-4 gap-y-6 px-2">
              {asesoresSoporte.map((a, i) => {
                const conf = estadosAsesorConfig[a.estado] || estadosAsesorConfig.NO_DISPONIBLE;
                return (
                  <div key={a.id} className="relative group flex flex-col items-center gap-2">
                    <button
                      onClick={() => setOpenAdvisorDropdown(openAdvisorDropdown === a.id ? null : a.id)}
                      className={cn(
                        "relative w-16 h-16 rounded-full p-1 transition-all duration-500 hover:scale-110 active:scale-95 border-2 flex items-center justify-center",
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
                    </button>

                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black text-white/80 uppercase tracking-tighter truncate max-w-[64px]">
                        {a.login}
                      </span>
                      {/* Sub-label state */}
                      <span className={cn("text-[7px] font-bold uppercase opacity-60", conf.bg.replace('bg-', 'text-'))}>
                        {a.estado.substring(0, 10)}
                      </span>
                    </div>

                    {/* Personal Dropdown Menu */}
                    {openAdvisorDropdown === a.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenAdvisorDropdown(null)} />
                        <div className="absolute top-[85%] left-1/2 -translate-x-1/2 mt-2 w-40 z-50 rounded-2xl border border-[#152233] bg-[#0b1621]/98 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="p-3 border-b border-white/5 bg-white/5">
                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest text-center">Cambiar mi estado</p>
                          </div>
                          {Object.keys(estadosAsesorConfig).map(est => (
                            <button
                              key={est}
                              onClick={() => {
                                handleCambioEstadoAsesor(a.id, est);
                                setOpenAdvisorDropdown(null);
                              }}
                              className={cn(
                                "w-full px-5 py-3 text-[9px] font-black text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 uppercase flex items-center gap-3",
                                a.estado === est ? "text-[#00e5a0] bg-[#00e5a0]/5" : "text-white/60"
                              )}
                            >
                              <div className={cn("w-2 h-2 rounded-full", estadosAsesorConfig[est].dot)} />
                              {est.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
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
                TERMINAL DE <span className="text-[#00e5a0]">SOPORTE</span>
              </h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-[#00e5a0]/10 border border-[#00e5a0]/30 rounded-full animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] shadow-[0_0_8px_#00e5a0]" />
                <span className="text-[8px] font-black text-[#00e5a0] tracking-widest uppercase">Live System</span>
              </div>
            </div>

            <div className="flex-1 max-w-2xl mx-12 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-[#00b8e5] group-focus-within:text-[#00e5a0] transition-colors" />
              <input
                type="text"
                placeholder="BUSCAR CASO POR INCIDENTE..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full border rounded-2xl py-4 pl-16 pr-6 text-[10px] font-black tracking-[0.2em] outline-none transition-all uppercase placeholder:text-[#3a5c72] bg-[#060d14] border-[#152233] text-white focus:border-[#00e5a0]/50 focus:shadow-[0_0_20px_rgba(0,229,160,0.1)]"
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Theme toggle removed */}
            </div>

          </header>

          <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar relative">
            {/* Noticia Panel Section */}
            {noticia && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="relative group overflow-hidden rounded-[2rem] p-[1px] bg-gradient-to-r from-amber-500/50 via-amber-400/20 to-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                  <div className="relative flex items-center gap-6 px-8 py-5 bg-[#0b1621] rounded-[1.95rem]">
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
                      <div className="relative w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500">
                        <Megaphone size={22} className="animate-bounce" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80">AVISO IMPORTANTE DEL ADMINISTRADOR</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-500/30 to-transparent" />
                      </div>
                      <p className="text-sm font-black text-white/90 leading-relaxed uppercase italic">
                        {noticia.contenido}
                      </p>
                    </div>
                    <div className="flex flex-col items-end opacity-40">
                      <p className="text-[8px] font-black uppercase tracking-widest text-[#608096]">Publicado hoy</p>
                      <p className="text-[10px] font-mono text-white/60">{new Date(noticia.fecha_publicacion).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                  <div className="p-2.5 rounded-xl border bg-[#00e5a0]/10 border-[#00e5a0]/30">
                    <LayoutDashboard className="text-[#00e5a0]" size={20} />
                  </div>
                  <h3 className="text-[12px] font-black uppercase tracking-[0.4em] drop-shadow-md text-white">MONITOREO DE GESTIONES ACTIVAS</h3>
                </div>
              </div>

              <div className="custom-scrollbar">
                {/* Removido overflow-x-auto para evitar recortes de dropdowns */}
                <table className="w-full text-left min-w-[1400px] border-collapse">
                  <thead>
                    <tr className="text-[9px] font-bold uppercase tracking-[0.1em] sticky top-0 z-20 text-[#608096] bg-[#060d14] border-b border-[#152233]">
                      <th className="px-4 py-3">FECHA / HORA</th>
                      <th className="px-2 py-3 text-center">EN SITIO</th>
                      <th className="px-4 py-3">TÉCNICO</th>
                      <th className="px-4 py-3">CELULAR</th>
                      <th className="px-4 py-3">TORRE ASIGNADA</th>
                      <th className="px-4 py-3">NÚMERO INC</th>
                      <th className="px-4 py-3 text-center">GESTIÓN</th>
                      <th className="px-4 py-3 min-w-[250px]">OBS. TÉCNICAS</th>
                      <th className="px-2 py-3 text-center">CHAT</th>
                      <th className="px-2 py-3 text-center">PLANTILLA</th>
                      <th className="px-2 py-3 text-center">LOGIN N1</th>
                      <th className="px-2 py-3 text-center">ESTADO</th>
                      <th className="px-4 py-3 text-center">TIEMPO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#152233]/40">
                    {datosFiltrados.map((d) => (
                      <tr
                        key={d.id}
                        className={cn(
                          "transition-all group border-l-4 border-transparent hover:border-[#00e5a0]/60 hover:bg-[#060d14]/60",
                          d.prioridad ? "bg-rose-500/10 border-l-rose-500" : "",
                          openDropdownId?.id === d.id ? "relative z-50 bg-[#060d14] shadow-[0_0_30px_rgba(0,0,0,0.9)]" : "relative z-0"
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="text-[11px] font-bold tracking-tight text-slate-300">{formatearFecha(d.fecha_hora).split('|')[1]}</p>
                          <p className="text-[9px] text-slate-400 font-medium">{formatearFecha(d.fecha_hora).split('|')[0]}</p>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <span className={cn(
                            "text-[10px] font-black px-2.5 py-1 rounded-lg transition-all",
                            d.en_sitio
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-slate-100/50 text-slate-400 border border-slate-200"
                          )}>
                            {d.en_sitio ? "SI" : "NO"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-black uppercase tracking-tight text-white">{d.nombre}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-bold text-slate-400">{d.celular || "315 --"}</span>
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
                            "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight",
                            d.gestion === 'AUSENCIA' || d.gestion === 'ASESORIA' ? 'bg-amber-500/10 text-amber-600' :
                              d.gestion === 'DIRECTO' ? 'bg-orange-500/10 text-orange-600' :
                                'bg-emerald-500/10 text-emerald-600'
                          )}>
                            {d.gestion}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[10px] font-medium line-clamp-2 max-w-[300px] text-slate-400 group-hover:text-white transition-colors" title={decodificarObservaciones(d.observaciones)}>
                            {decodificarObservaciones(d.observaciones)}
                          </p>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            onClick={() => {
                              setActiveChatSoporteId(d.id);
                              setActiveChatIncidente(d.incidente);
                            }}
                            className="p-2 border rounded-xl transition-all relative flex items-center justify-center mx-auto hover:bg-[#00e5a0]/5 bg-[#060d14] border-[#152233] text-[#608096]"
                          >
                            <MessageSquare size={14} strokeWidth={2} />
                            {d.chat_visto_soporte === false && (
                              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-[#00e5a0] opacity-50 animate-ping shadow-[0_0_15px_#00e5a0]"></span>
                                <span className="relative inline-flex rounded-full h-full w-full bg-[#00e5a0] border-2 border-[#060d14] shadow-[0_0_10px_rgba(0,229,160,0.8)] items-center justify-center">
                                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-sm"></span>
                                </span>
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            onClick={() => {
                              const textoFormateado = formatearPlantilla(d.plantilla || "{}");
                              let evList = [];
                              try { if (d.evidencias) evList = JSON.parse(d.evidencias); } catch (e) { }
                              setModalConfig({ id: d.id, text: textoFormateado, title: "PLANTILLA TÉCNICA", evidencias: evList });
                            }}
                            className="p-2 border rounded-xl transition-all flex items-center justify-center mx-auto hover:bg-[#00b8e5]/5 bg-[#060d14] border-[#152233] text-[#608096]"
                          >
                            <ClipboardList size={14} strokeWidth={2} />
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <div className={cn("relative flex justify-center", openDropdownId?.id === d.id && openDropdownId?.type === 'login' ? "z-50" : "z-0")}>
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId?.id === d.id && openDropdownId?.type === 'login' ? null : { id: d.id, type: 'login' })}
                              className="w-32 border text-[9px] font-black uppercase py-2 px-3 rounded-xl flex items-center justify-between transition-all active:scale-95 bg-[#060d14] border-[#152233] text-white hover:border-[#00e5a0]/30"
                            >
                              <span className="truncate pr-2">{d.login_n1 === "POR_ASIGNAR" ? "--" : d.login_n1}</span>
                              <ChevronDown size={10} className={cn("text-white/40 transition-transform", openDropdownId?.id === d.id && openDropdownId?.type === 'login' && "rotate-180")} />
                            </button>

                            {openDropdownId?.id === d.id && openDropdownId?.type === 'login' && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 z-50 rounded-2xl border border-[#152233] bg-[#0b1621]/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200">
                                  <button
                                    onClick={() => { actualizarSoporte(d.id, "login_n1", "POR_ASIGNAR"); setOpenDropdownId(null); }}
                                    className="w-full px-5 py-3 text-[9px] font-bold text-left hover:bg-rose-500/10 hover:text-rose-500 transition-colors border-b border-white/5 text-white/50"
                                  >
                                    -- QUITAR ASIGNACIÓN --
                                  </button>
                                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    {asesoresSoporte.map(a => (
                                      <button
                                        key={a.id}
                                        onClick={() => {
                                          actualizarSoporte(d.id, "login_n1", a.login);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full px-5 py-3 text-[9px] font-black text-left hover:bg-[#00e5a0]/10 hover:text-[#00e5a0] transition-colors border-b border-white/5 last:border-0 text-white/80 uppercase"
                                      >
                                        {a.login}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-3 text-center relative">
                          <div
                            className={cn(
                              "w-28 border text-[9px] font-black rounded-xl py-1.5 px-3 flex items-center justify-between mx-auto opacity-80 cursor-pointer hover:opacity-100 transition-all",
                              d.estado === 'Resuelto' || d.estado === 'ACTIVO' ? 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20 hover:bg-emerald-600/20' :
                                d.estado === 'En gestión' || d.estado === 'PENDIENTE' ? 'bg-[#00b8e5]/10 text-[#00b8e5] border-[#00b8e5]/20 hover:bg-[#00b8e5]/20' :
                                  d.estado === 'Enrutado' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20 hover:bg-amber-400/20' :
                                    d.estado === 'Mal Escalado' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20' :
                                      "bg-[#060d14] text-white border-[#152233]"
                            )}
                            onClick={() => setOpenDropdownId(openDropdownId?.id === d.id && openDropdownId?.type === 'estado' ? null : { id: d.id, type: 'estado' })}
                          >
                            <span className="truncate pr-1 uppercase">{d.estado || "---"}</span>
                            <ChevronDown size={10} className="opacity-40" />
                          </div>

                          {/* Menú Desplegable ESTADO */}
                          {openDropdownId?.id === d.id && openDropdownId?.type === 'estado' && (
                            <div className="absolute top-[85%] left-1/2 -translate-x-1/2 z-[100] mt-1 w-36 bg-[#0b1621] border border-[#152233] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                              {estadosGestion.map(st => (
                                <button
                                  key={st}
                                  onClick={() => {
                                    actualizarSoporte(d.id, "estado", st);
                                    setOpenDropdownId(null);
                                  }}
                                  className={cn(
                                    "w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-white border-b border-white/5 last:border-0",
                                    d.estado === st ? "bg-white/5 text-amber-400" : ""
                                  )}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          )}
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
                              <div className="w-1 h-1 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]" />
                            )}
                            <LiveTimer inicio={d.fecha_inicio_sitio} fin={d.fecha_fin} />
                          </span>
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

      {/* VISOR MODAL */}
      {modalConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xl animate-in fade-in p-8 bg-[#060d14]/80">
          <div className="border rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] w-full max-w-5xl overflow-hidden flex flex-col h-[90vh] hud-corners transition-all duration-500 bg-[#0b1621] border-[#152233]">
            <div className="p-10 border-b flex justify-between items-center transition-colors duration-500 border-white/5 bg-[#060d14]/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 border rounded-2xl flex items-center justify-center transition-colors bg-[#00b8e5]/10 border-[#00b8e5]/30 text-[#00b8e5]">
                  <ClipboardList size={24} />
                </div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter drop-shadow-lg transition-colors text-white">{modalConfig.title}</h2>
              </div>
              <button onClick={() => setModalConfig(null)} className="p-4 rounded-2xl border transition-all bg-[#060d14] hover:bg-rose-500/10 text-white hover:text-rose-500 border-[#152233]">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 p-10 overflow-hidden flex flex-col gap-6">
              <p className="text-[10px] font-black text-[#00b8e5] uppercase tracking-[0.4em] opacity-80">CONTENIDO ESTRUCTURADO REGISTRADO</p>
              <div className="flex-1 p-10 rounded-[2.5rem] border shadow-inner overflow-hidden flex flex-col transition-colors duration-500 bg-[#060d14] border-white/5">
                <textarea
                  className="w-full flex-1 bg-transparent text-base font-bold font-mono whitespace-pre-wrap leading-relaxed outline-none resize-none custom-scrollbar transition-colors text-white"
                  value={modalConfig.text}
                  onChange={(e) => setModalConfig({ ...modalConfig, text: e.target.value })}
                />
              </div>

              {modalConfig.evidencias && modalConfig.evidencias.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-[#00e5a0] uppercase tracking-[0.4em] opacity-80 flex items-center gap-2">
                    <ImageIcon size={14} /> EVIDENCIAS FOTOGRÁFICAS (TÉCNICO)
                  </p>
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {modalConfig.evidencias.map((img, idx) => (
                      <div key={idx} className="shrink-0 group relative overflow-hidden rounded-2xl border border-white/5 h-32 w-32 shadow-2xl">
                        <img src={img} className="h-full w-full object-cover cursor-pointer hover:scale-110 transition-transform duration-500" onClick={() => window.open(img)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(modalConfig.text);
                  }}
                  className="flex-1 py-5 border-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 bg-[#0b1621] border-[#00b8e5]/40 text-[#00b8e5] hover:bg-[#00b8e5] hover:text-[#061511] shadow-[0_0_20px_rgba(0,184,229,0.1)]"
                >
                  Copiar información
                </button>
                <button
                  onClick={async () => {
                    await actualizarSoporte(modalConfig.id, "plantilla", modalConfig.text);
                    setModalConfig(null);
                  }}
                  className="flex-1 py-5 bg-gradient-to-r from-[#00e5a0] to-[#00b8e5] text-[#061511] text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(0,229,160,0.3)] hover:shadow-[0_0_40px_rgba(0,229,160,0.5)]"
                >
                  Guardar Cambios
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
          remitenteActual={"SOPORTE"}
          nombreRemitente={loggedUser}
          onClose={() => setActiveChatSoporteId(null)}
        />
      )}
    </div>
  );
}