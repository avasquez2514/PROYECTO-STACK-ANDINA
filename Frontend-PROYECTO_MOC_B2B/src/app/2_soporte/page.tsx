"use client";

/**
 * SoportePage Component
 * 
 * Este componente es el centro de control para el personal de despacho y soporte.
 * Incluye monitoreo de estado de asesores, indicadores de rendimiento (HUD) 
 * y una tabla de gestión en tiempo real.
 */

import React, { useEffect, useState, useRef } from "react";
import { Menu, X, LogOut, Search, ClipboardList, MessageSquareText, FileText, Info, Radio, Save, AlertCircle, Sun, Moon, ChevronDown, Zap, AlertTriangle } from "lucide-react";

/**
 * Utilidad para el manejo de clases dinámicas
 */
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

const estadosGestion = ["En gestión", "Enrutado", "Resuelto", "Mal Escalado"];

/**
 * Colores para el selector de estado de gestión
 */
const coloresEstadoGestion: Record<string, string> = {
  "En gestión": "bg-emerald-800 text-white",
  "Enrutado": "bg-amber-200 text-amber-900",
  "Resuelto": "bg-emerald-200 text-emerald-900",
  "Mal Escalado": "bg-rose-700 text-white"
};

/**
 * Configuración visual de los estados de los asesores
 */
const estadosAsesorConfig: Record<string, { bg: string, dot: string }> = {
  "EN_GESTION": { bg: "bg-emerald-300 text-emerald-950", dot: "bg-emerald-500 shadow-emerald-500/50" },
  "EN_DESCANSO": { bg: "bg-emerald-800 text-white", dot: "bg-rose-500 shadow-rose-500/50" },
  "NO_DISPONIBLE": { bg: "bg-amber-200 text-amber-900", dot: "bg-rose-500 shadow-rose-500/50" },
  "CASO_COMPLEJO": { bg: "bg-rose-700 text-white", dot: "bg-rose-500 shadow-rose-500/50" }
};

const SoportePage = () => {
  // --- ESTADOS ---
  const [datos, setDatos] = useState<any[]>([]); // Almacena las gestiones (filas de la tabla)
  const [asesoresSoporte, setAsesoresSoporte] = useState<any[]>([]); // Lista de asesores N1
  const [proximoAsesorLogin, setProximoAsesorLogin] = useState<string>(""); // Indicador visual
  const [sidebarOpen, setSidebarOpen] = useState(false); // Estado del menú lateral en móviles
  const [hasMounted, setHasMounted] = useState(false); // Bandera para renderizado cliente
  const [busqueda, setBusqueda] = useState(""); // Filtro de búsqueda por incidente
  const [theme, setTheme] = useState("dark"); // Control de tema visual

  // Refs de control para evitar ejecuciones
  const asignandoRef = useRef(false);
  const inicioResetRef = useRef(false);

  // Configuración del modal de edición
  const [modalConfig, setModalConfig] = useState<{
    id: number;
    campo: 'plantilla' | 'observaciones' | 'observaciones_ultima';
    texto: string;
    index: number;
  } | null>(null);

  const [alertaPrioridad, setAlertaPrioridad] = useState<{ id: number, incidente: string }[]>([]);
  const priorityIdsRef = useRef<Set<number>>(new Set());

  /**
   * Cambia el tema entre claro y oscuro
   */
  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  /**
   * --- 1. CARGA DE DATOS ---
   */
  const cargarDatos = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/soporte/");
      const json = await res.json();
      const ordenados = json.sort((a: any, b: any) => b.id - a.id);
      setDatos(ordenados);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  /**
   * --- 2. CARGA DE ASESORES ---
   */
  const cargarAsesores = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/asesores/");
      const data = await res.json();

      setAsesoresSoporte(prev => {
        return data.map((asesorAPI: any) => {
          const asesorLocal = prev.find(p => p.id === asesorAPI.id);
          // Buscamos en LocalStorage como respaldo
          const estadoGuardado = typeof window !== 'undefined' ? localStorage.getItem(`asesor_estado_${asesorAPI.id}`) : null;

          return {
            ...asesorAPI,
            estado: asesorAPI.estado || (estadoGuardado || (asesorLocal?.estado || "NO_DISPONIBLE"))
          };
        });
      });
    } catch (error) {
      console.error("Error cargando asesores:", error);
    }
  };

  /**
   * --- POLLING ---
   */
  useEffect(() => {
    setHasMounted(true);
    cargarDatos();
    cargarAsesores();

    // Escuchar cambios en otras pestañas automáticamente
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('asesor_estado_')) {
        cargarAsesores();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const intervalo = setInterval(() => {
      cargarDatos();
      cargarAsesores();
    }, 2000);

    return () => {
      clearInterval(intervalo);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  /**
   * --- 3. LÓGICA DE ASIGNACIÓN AUTOMÁTICA (DESACTIVADA) ---
   * Los casos entran vacíos por solicitud del usuario.
   */
  useEffect(() => {
    const prioritarios = datos.filter(d => d.es_prioridad);
    const nuevosPrioritarios = prioritarios.filter(d => !priorityIdsRef.current.has(d.id));

    if (nuevosPrioritarios.length > 0) {
      setAlertaPrioridad(prioritarios.map(p => ({ id: p.id, incidente: p.incidente || 'SIN INC' })));
      nuevosPrioritarios.forEach(d => priorityIdsRef.current.add(d.id));
      console.log("🔥 ALERTA: NUEVA PRIORIDAD ASIGNADA");
    } else {
      if (prioritarios.length === 0 && alertaPrioridad.length > 0) {
        setAlertaPrioridad([]);
      } else if (prioritarios.length !== alertaPrioridad.length) {
        setAlertaPrioridad(prioritarios.map(p => ({ id: p.id, incidente: p.incidente || 'SIN INC' })));
      }
    }
  }, [datos]);

  // --- FUNCIONES COMUNICACIÓN API ---
  const actualizarSoporte = async (id: number, campo: string, valor: any) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/soporte/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [campo]: valor }),
      });
    } catch (error) { console.error("Error API Soporte:", error); }
  };

  const actualizarEstadoAsesorAPI = async (idAsesor: number, nuevoEstado: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/asesores/${idAsesor}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
    } catch (error) { console.error("Error API Asesor", error); }
  }

  const handleCambioEstadoAsesor = async (idAsesor: number, nuevoEstado: string) => {
    // Actualización optimista
    setAsesoresSoporte(prev => prev.map(a =>
      a.id === idAsesor ? { ...a, estado: nuevoEstado } : a
    ));

    // Persistencia Local (mientras el backend se actualiza)
    localStorage.setItem(`asesor_estado_${idAsesor}`, nuevoEstado);

    await actualizarEstadoAsesorAPI(idAsesor, nuevoEstado);
  };

  // --- UI HELPERS ---
  const handleLoginChange = (id: number, nuevoLogin: string) => {
    // Si el usuario selecciona vacío, volvemos al placeholder que el backend acepta
    const loginParaBackend = nuevoLogin === "" ? "POR_ASIGNAR" : nuevoLogin;

    setDatos(prev => prev.map(item =>
      item.id === id ? { ...item, login_n1: loginParaBackend } : item
    ));

    actualizarSoporte(id, "login_n1", loginParaBackend);
  };

  const handleEstadoChange = (id: number, nuevoEstado: string) => {
    setDatos(prev => prev.map(item =>
      item.id === id ? { ...item, estado: nuevoEstado } : item
    ));
    actualizarSoporte(id, "estado", nuevoEstado);
  };

  const guardarDesdeModal = async () => {
    if (!modalConfig) return;

    setDatos(prev => prev.map(item =>
      item.id === modalConfig.id ? { ...item, [modalConfig.campo]: modalConfig.texto } : item
    ));

    await actualizarSoporte(modalConfig.id, modalConfig.campo, modalConfig.texto);
    cargarDatos(); // Sincronizar después de guardar
    setModalConfig(null);
  };

  const notifyReading = async () => {
    if (!modalConfig || modalConfig.campo !== 'observaciones_ultima') return;
    const nuevoTexto = `✅ VISTO POR SOPORTE - ${modalConfig.texto}`;
    await actualizarSoporte(modalConfig.id, 'observaciones_ultima', nuevoTexto);
    cargarDatos();
    setModalConfig(null);
  };

  const formatearFechaHora = (fechaStr: string) => {
    if (!fechaStr) return "--/--/-- --:--";
    const d = new Date(fechaStr);
    const fecha = d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    return `${fecha} | ${hora}`;
  };

  const handleCopyTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("📋 Plantilla copiada al portapapeles");
  };

  /**
   * Helper para formatear la plantilla técnica de JSON a texto legible
   */
  const formatearPlantillaParaEditor = (jsonString: string) => {
    try {
      const obj = JSON.parse(jsonString);
      return Object.entries(obj)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
    } catch (e) {
      return jsonString; // Si no es JSON, devolver tal cual
    }
  };

  const datosFiltrados = datos.filter((item) => {
    if (!busqueda) return true;
    return (item.incidente?.toLowerCase() || "").includes(busqueda.toLowerCase());
  });

  // --- CÁLCULO DE ESTADÍSTICAS ---
  const totalCasos = datos.length;
  const resueltos = datos.filter(d => d.estado === "Resuelto").length;
  const enrutados = datos.filter(d => d.estado === "Enrutado").length;
  const pendientes = datos.filter(d => !d.login_n1).length;
  const porcentajeResolucion = totalCasos > 0 ? Math.round((resueltos / totalCasos) * 100) : 0;

  if (!hasMounted) return <div className="min-h-screen bg-[#020617]" />;

  return (
    <div className={cn(
      "min-h-screen relative overflow-x-hidden cyber-grid transition-colors duration-300",
      theme === "light" ? "light bg-slate-50 text-slate-900" : "bg-[#020617] text-slate-200"
    )}>
      <div className="fixed inset-0 pointer-events-none">
        <div className={cn(
          "absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] animate-pulse-slow",
          theme === "light" ? "bg-emerald-500/5" : "bg-emerald-500/5"
        )} />
      </div>

      <div className="flex flex-col lg:flex-row h-screen relative z-10">
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 glass-panel border-r border-white/5 transition-transform duration-500 lg:translate-x-0 lg:static lg:block",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg">P</div>
                <div>
                  <h1 className={cn("font-black text-xl tracking-tighter italic uppercase", theme === "light" ? "text-slate-900" : "text-white")}>
                    PHOENIX <span className="text-emerald-500">MOC</span>
                  </h1>
                </div>
              </div>
              <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[.3em] px-2">ESTADO DE ASESORES</h3>
              <div className="space-y-4">
                {asesoresSoporte.map((asesor) => {
                  const casosAsignados = datos.filter(d => d.login_n1 === asesor.login).length;
                  return (
                    <div key={asesor.id} className="bg-[#0f172a]/40 border border-white/5 p-5 rounded-[1.5rem] group transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black shadow-lg transition-colors",
                            estadosAsesorConfig[asesor.estado]?.bg || 'bg-slate-700 text-white'
                          )}>
                            {asesor.login.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className={cn("text-xs font-black tracking-tight uppercase", theme === "light" ? "text-slate-700" : "text-white")}>
                              {asesor.login}
                            </span>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest leading-none">
                                {casosAsignados} CASOS ASIGNADOS
                              </span>
                              {asesor.perfil && (
                                <span className="text-[7px] text-blue-400 font-black uppercase tracking-[0.1em] px-1 py-0.5 bg-blue-500/10 rounded-sm w-fit border border-blue-500/20">
                                  {asesor.perfil === 'TODO' ? 'GESTIÓN TOTAL' : asesor.perfil === 'EN_CIERRES' ? 'PERFIL CIERRES' : 'PERFIL SOPORTES'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={cn(
                          "w-2.5 h-2.5 rounded-full transition-all duration-300",
                          estadosAsesorConfig[asesor.estado]?.dot || 'bg-slate-600'
                        )} />
                      </div>
                      <div className="relative">
                        <select
                          value={asesor.estado || "NO_DISPONIBLE"}
                          onChange={(e) => handleCambioEstadoAsesor(asesor.id, e.target.value)}
                          className={cn(
                            "w-full text-[10px] font-black uppercase py-3 px-4 rounded-xl border outline-none cursor-pointer appearance-none transition-all",
                            theme === "light" ? "bg-white border-slate-200 text-slate-600" : "bg-[#020617] border-white/5 text-slate-300"
                          )}
                        >
                          <option value="EN_GESTION">EN GESTIÓN</option>
                          <option value="EN_DESCANSO">EN DESCANSO</option>
                          <option value="NO_DISPONIBLE">NO DISPONIBLE</option>
                          <option value="CASO_COMPLEJO">CASO COMPLEJO</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                          <ChevronDown size={14} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-slate-500/5">
              <button className="w-full flex items-center justify-center gap-3 p-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-rose-500 transition-all group">
                <LogOut className="h-4 w-4" /> Salir del Sistema
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <header className="h-24 glass-panel border-b border-white/5 flex items-center justify-between px-10 shrink-0">
            <h2 className={cn("text-2xl font-black tracking-tighter italic uppercase", theme === "light" ? "text-slate-900" : "text-white")}>
              CONSOLA DE <span className="text-emerald-500">SOPORTE</span>
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-pulse mr-auto ml-6">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span className="text-[8px] font-black text-emerald-500 tracking-widest uppercase">Live Connection</span>
            </div>

            <div className="flex items-center gap-6 flex-1 max-w-2xl mx-12">
              <div className="relative w-full group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="BUSCAR POR INCIDENTE..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className={cn(
                    "w-full pl-14 pr-6 py-4 border rounded-2xl text-[10px] font-black tracking-widest outline-none transition-all uppercase",
                    theme === "light" ? "bg-white border-slate-200 text-slate-900" : "bg-slate-950/50 border-white/10 text-emerald-400"
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className="p-3 glass-card rounded-2xl">
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </header>

          <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar relative">
            {alertaPrioridad.length > 0 && (
              <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[100] animate-bounce-subtle">
                <div className="bg-rose-600 text-white px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(225,29,72,0.6)] flex items-center gap-4 border border-rose-400">
                  <Zap size={20} fill="white" className="animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[.2em]">ALERTA DE DESPACHO</span>
                    <span className="text-sm font-black italic">ATENCIÓN: {alertaPrioridad.length} CASOS MARCADOS COMO PRIORIDAD</span>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "CASOS TOTALES", value: totalCasos, icon: ClipboardList, color: "emerald" },
                { label: "NODOS RESUELTOS", value: resueltos, icon: Save, color: "emerald" },
                { label: "ENRUTADOS", value: enrutados, icon: Radio, color: "blue" },
                { label: "PENDIENTES", value: pendientes, icon: AlertCircle, color: "amber" },
              ].map((stat, idx) => (
                <div key={idx} className="glass-panel p-6 rounded-[2rem] group hover:border-emerald-500/40 transition-all relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn("p-3 rounded-2xl bg-slate-500/10 border border-white/10", stat.color === 'emerald' ? "text-emerald-500" : stat.color === 'blue' ? "text-blue-500" : "text-amber-500")}>
                      <stat.icon size={20} />
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-500 tracking-[.3em] uppercase">{stat.label}</p>
                      <p className={cn("text-3xl font-black italic tracking-tighter", theme === "light" ? "text-slate-900" : "text-white")}>{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-panel rounded-[2.5rem] border-white/5 overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-500/5">
                <h3 className={cn("text-[11px] font-black tracking-[.4em] px-4 flex items-center gap-3 uppercase", theme === "light" ? "text-slate-900" : "text-white")}>
                  LISTADO DE GESTIONES RECIENTES
                </h3>
              </div>

              <div className="overflow-x-auto overflow-y-auto max-h-[800px] custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[2000px]">
                  <thead>
                    <tr className={cn("text-[10px] font-black uppercase tracking-widest", theme === "light" ? "bg-slate-100 text-slate-500" : "bg-slate-950/80 text-slate-500")}>
                      <th className="px-8 py-6 border-b border-white/5">MARCA TEMPORAL</th>
                      <th className="px-6 py-6 border-b border-white/5 text-center">EN SITIO</th>
                      <th className="px-8 py-6 border-b border-white/5 min-w-[200px]">NOMBRE FUNCIONARIO</th>
                      <th className="px-8 py-6 border-b border-white/5">NUMERO CELULAR</th>
                      <th className="px-8 py-6 border-b border-white/5">TORRE ASIGNADA</th>
                      <th className="px-8 py-6 border-b border-white/5">NUMERO INC</th>
                      <th className="px-8 py-6 border-b border-white/5 text-center">GESTIÓN REQUERIDA</th>
                      <th className="px-8 py-6 border-b border-white/5 min-w-[180px]">OBSERVACIONES</th>
                      <th className="px-8 py-6 border-b border-white/5">PLANTILLA</th>
                      <th className="px-8 py-6 border-b border-white/5">LOGIN N1</th>
                      <th className="px-8 py-6 border-b border-white/5">ESTADO GESTION</th>
                      <th className="px-8 py-6 border-b border-white/5">OBS. DESPACHO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {datosFiltrados.map((d, i) => (
                      <tr key={d.id} className={cn(
                        "transition-all group border-l-4",
                        d.es_prioridad
                          ? "bg-rose-500/10 border-rose-500 shadow-[inset_10px_0_20px_-10px_rgba(225,29,72,0.2)]"
                          : "hover:bg-emerald-500/[0.03] border-transparent"
                      )}>
                        <td className="px-8 py-6">
                          <p className="text-[9px] text-slate-400 font-mono whitespace-nowrap">{formatearFechaHora(d.fecha_hora)}</p>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className={cn("inline-block w-8 h-8 rounded-lg text-[9px] font-black items-center justify-center border", (d.en_sitio === "SI" || d.en_sitio === true) ? "text-emerald-500 border-emerald-500/30" : "text-slate-500 border-white/10")}>{(d.en_sitio === "SI" || d.en_sitio === true) ? "SÍ" : "NO"}</div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs font-black uppercase tracking-tight">{d.nombre}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-bold font-mono text-slate-500">{d.celular}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{d.torre}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg font-mono font-black text-[10px] border border-emerald-500/20">{d.incidente}</span>
                            {d.es_prioridad && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-rose-500 text-white text-[8px] font-black rounded-md animate-pulse">
                                <Zap size={8} fill="currentColor" /> PRIORIDAD
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase border", d.gestion === 'ASESORIA' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500')}>{d.gestion}</span>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-[11px] text-slate-500 italic line-clamp-2">"{d.observaciones || "SIN DATOS..."}"</p>
                        </td>
                        <td className="px-8 py-6">
                          <button
                            onClick={() => {
                              const textoFormateado = d.campo === 'plantilla' || d.plantilla ? formatearPlantillaParaEditor(d.plantilla || "{}") : "{}";
                              setModalConfig({ id: d.id, campo: 'plantilla', texto: textoFormateado, index: i });
                            }}
                            className={cn(
                              "p-3 rounded-xl transition-all border",
                              (d.gestion === "CIERRE" || d.gestion === "ENRUTAR") ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950" : "bg-slate-500/10 border-white/5 text-slate-500 hover:bg-slate-500/20"
                            )}
                            title="Plantilla Técnica"
                          >
                            <ClipboardList size={16} />
                          </button>
                        </td>
                        <td className="px-8 py-6">
                          <select
                            value={d.login_n1 === "POR_ASIGNAR" ? "" : (d.login_n1 || "")}
                            onChange={(e) => handleLoginChange(d.id, e.target.value)}
                            className="text-[10px] font-black border rounded-xl px-4 py-2 w-44 bg-slate-950 border-white/10 text-emerald-400 outline-none"
                          >
                            <option value="">Por asignar</option>
                            {asesoresSoporte.map((a) => <option key={a.id} value={a.login}>{a.login}</option>)}
                          </select>
                        </td>
                        <td className="px-8 py-6">
                          <select
                            value={d.estado || "En gestión"}
                            onChange={(e) => handleEstadoChange(d.id, e.target.value)}
                            className={cn(
                              "text-[9px] font-black rounded-xl px-4 py-2 border w-40 outline-none transition-colors",
                              coloresEstadoGestion[d.estado || "En gestión"] || "bg-slate-950 text-slate-400 border-white/10"
                            )}
                          >
                            {estadosGestion.map((e) => (
                              <option key={e} value={e} className="bg-[#0f172a] text-white">
                                {e}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <button
                            onClick={() => setModalConfig({ id: d.id, campo: 'observaciones_ultima', texto: d.observaciones_ultima || "", index: i })}
                            className={cn(
                              "p-3 border rounded-xl transition-all group relative",
                              (d.observaciones_ultima && d.observaciones_ultima !== "Registro inicial de gestión")
                                ? "bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-bounce-subtle"
                                : "bg-slate-500/10 border-white/5 text-slate-500 hover:bg-amber-500/20 hover:text-amber-500"
                            )}
                            title="Ver Novedad de Despacho"
                          >
                            <MessageSquareText size={16} className={cn((d.observaciones_ultima && d.observaciones_ultima !== "Registro inicial de gestión") ? "animate-pulse" : "")} />
                            {(d.observaciones_ultima && d.observaciones_ultima !== "Registro inicial de gestión") && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-white"></span>
                              </span>
                            )}
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

        {modalConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-8 animate-in fade-in">
            <div className="bg-[#0f172a] border border-white/10 rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden p-10 space-y-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  {modalConfig.campo === 'plantilla' ? <ClipboardList className="text-emerald-500" size={24} /> : <AlertTriangle className="text-amber-500" size={24} />}
                  <h2 className="text-2xl font-black text-white italic uppercase">
                    {modalConfig.campo === 'plantilla' ? "Visualizar Plantilla" : "Novedad de Despacho"}
                  </h2>
                </div>
                <button onClick={() => setModalConfig(null)} className="p-3 bg-white/5 rounded-full"><X size={20} className="text-slate-400" /></button>
              </div>

              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                {modalConfig.campo === 'plantilla' ? "Contenido técnico (Solo lectura):" : "Instrucciones de despacho para soporte:"}
              </p>

              <textarea
                className={cn(
                  "w-full h-80 p-8 bg-slate-950/50 border border-white/10 rounded-[2rem] text-sm outline-none resize-none transition-all font-medium",
                  modalConfig.campo === 'plantilla' ? "text-emerald-400 font-mono" : "text-slate-200 focus:border-amber-500/50"
                )}
                value={modalConfig.texto}
                readOnly={modalConfig.campo === 'plantilla'}
                onChange={(e) => setModalConfig({ ...modalConfig, texto: e.target.value })}
                placeholder="Escriba aquí la novedad..."
              />

              <div className="flex gap-6">
                <button onClick={() => setModalConfig(null)} className="flex-1 px-8 py-5 border border-white/10 text-[10px] font-black uppercase rounded-2xl text-slate-500">Descartar</button>
                {modalConfig.campo === 'plantilla' ? (
                  <button onClick={() => handleCopyTemplate(modalConfig.texto)} className="flex-[2] px-8 py-5 bg-emerald-500 text-slate-950 font-black rounded-2xl uppercase shadow-lg shadow-emerald-500/20 text-xs">Copiar Datos</button>
                ) : (
                  <div className="flex-[2] flex gap-4">
                    <button onClick={notifyReading} className="flex-1 px-8 py-5 bg-emerald-600 text-white font-black rounded-2xl uppercase shadow-lg shadow-emerald-600/20 text-[9px] flex items-center justify-center gap-2">
                      <Radio size={14} className="animate-pulse" /> Notificar Lectura
                    </button>
                    <button onClick={guardarDesdeModal} className="flex-1 px-8 py-5 bg-amber-500 text-slate-950 font-black rounded-2xl uppercase shadow-lg shadow-amber-500/20 text-[9px]">Guardar Cambios</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoportePage;